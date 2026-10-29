"""
OpenCV Document Edge & Anchor Detection for OMR Sheet.
Handles perspective transform, corner alignment, and auto-rotation.
"""

import cv2
import numpy as np
from typing import Tuple, Optional, List
import structlog

logger = structlog.get_logger()


def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Sort 4 coordinates in consistent order:
    0: Top-Left
    1: Top-Right
    2: Bottom-Right
    3: Bottom-Left
    """
    pts = np.asarray(pts, dtype="float32").reshape((4, 2))
    rect = np.zeros((4, 2), dtype="float32")

    # Sum of coordinates: Top-Left has smallest sum, Bottom-Right has largest
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    # Difference (y - x): Top-Right has smallest diff (or x-y max), Bottom-Left has largest
    diff = np.diff(pts, axis=1)  # y - x
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    return rect


def find_anchor_marks(
    gray: np.ndarray,
    min_area: float = 300,
    max_area: float = 12000
) -> Optional[np.ndarray]:
    """
    Attempt to find 4 solid black square anchor markers printed at 4 corners.
    Returns sorted 4 center points (TL, TR, BR, BL) if found, else None.
    """
    h_img, w_img = gray.shape
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 41, 10
    )

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    candidates = []
    total_area = h_img * w_img

    for c in contours:
        area = cv2.contourArea(c)
        if area < min_area or area > max_area or area > 0.05 * total_area:
            continue

        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.04 * peri, True)

        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = float(w) / h
            if 0.75 <= aspect_ratio <= 1.30:
                # Solid fill check (black square should have high solidity)
                rect_area = w * h
                solidity = area / float(rect_area) if rect_area > 0 else 0
                if solidity >= 0.75:
                    M = cv2.moments(c)
                    if M["m00"] != 0:
                        cX = float(M["m10"] / M["m00"])
                        cY = float(M["m01"] / M["m00"])
                        candidates.append((cX, cY, area))

    if len(candidates) < 4:
        return None

    # If more than 4 candidates, find the 4 that are closest to the 4 corners of the image
    corners_target = [
        (0, 0),             # TL
        (w_img, 0),         # TR
        (w_img, h_img),     # BR
        (0, h_img)          # BL
    ]

    selected = []
    remaining = list(candidates)

    for target in corners_target:
        if not remaining:
            break
        # Pick candidate closest to this target corner
        best_cand = min(
            remaining,
            key=lambda c: (c[0] - target[0]) ** 2 + (c[1] - target[1]) ** 2
        )
        selected.append([best_cand[0], best_cand[1]])
        remaining.remove(best_cand)

    if len(selected) == 4:
        ordered = order_points(np.array(selected, dtype="float32"))
        return ordered

    return None


def find_paper_boundary(gray: np.ndarray) -> Optional[np.ndarray]:
    """
    Fallback Engine: Find the largest 4-sided contour (paper boundary).
    """
    h_img, w_img = gray.shape
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 40, 150)

    # Dilate edges to close gaps
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edged = cv2.dilate(edged, kernel, iterations=1)

    contours, _ = cv2.findContours(edged, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:8]

    min_paper_area = 0.20 * h_img * w_img

    for c in contours:
        area = cv2.contourArea(c)
        if area < min_paper_area:
            continue

        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.025 * peri, True)

        if len(approx) == 4:
            pts = approx.reshape(4, 2).astype("float32")
            return order_points(pts)

    return None


def detect_and_warp_sheet(
    image: np.ndarray,
    target_w: int = 1654,
    target_h: int = 2338
) -> Tuple[np.ndarray, np.ndarray, str]:
    """
    Detects 4 corners and performs perspective transform.
    Returns:
        warped: Transformed image (target_w, target_h, 3)
        corners: Detected 4 corners in original image (4, 2)
        engine_used: "anchor_marks" or "paper_boundary" or "identity"
    """
    if image is None or image.size == 0:
        raise ValueError("Ảnh rỗng hoặc không hợp lệ")

    orig_h, orig_w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

    # Engine 1: Anchor Marks
    corners = find_anchor_marks(gray)
    engine_used = "anchor_marks"

    # Engine 2: Paper Boundary
    if corners is None:
        corners = find_paper_boundary(gray)
        engine_used = "paper_boundary"

    # If already high quality scan matching target aspect ratio and no clear corners found, fallback to identity
    if corners is None:
        aspect = orig_h / float(orig_w) if orig_w > 0 else 0
        target_aspect = target_h / float(target_w)
        if 1.25 <= aspect <= 1.55:
            # Looks already like scanned portrait A4
            corners = np.array([
                [0, 0],
                [orig_w - 1, 0],
                [orig_w - 1, orig_h - 1],
                [0, orig_h - 1]
            ], dtype="float32")
            engine_used = "identity"
        else:
            raise ValueError(
                "Không nhận diện được 4 góc của phiếu trắc nghiệm. "
                "Vui lòng đảm bảo chụp rõ 4 góc cữ hoặc đặt phiếu trên mặt bàn có độ tương phản."
            )

    # Destination coordinates for standard portrait A4
    if engine_used == "anchor_marks":
        # Anchors are centered at (margin + size/2) = 70 + 40 = 110 px
        anchor_cx_left = 110
        anchor_cx_right = target_w - 110
        anchor_cy_top = 110
        anchor_cy_bottom = target_h - 110
        dst = np.array([
            [anchor_cx_left, anchor_cy_top],
            [anchor_cx_right, anchor_cy_top],
            [anchor_cx_right, anchor_cy_bottom],
            [anchor_cx_left, anchor_cy_bottom]
        ], dtype="float32")
    else:
        # Paper boundary maps to outer paper edges (0, 0)
        dst = np.array([
            [0, 0],
            [target_w - 1, 0],
            [target_w - 1, target_h - 1],
            [0, target_h - 1]
        ], dtype="float32")

    M = cv2.getPerspectiveTransform(corners, dst)
    warped = cv2.warpPerspective(image, M, (target_w, target_h))

    return warped, corners, engine_used
