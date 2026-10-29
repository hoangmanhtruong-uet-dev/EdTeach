"""
Bubble Evaluator for OMR Sheet.
Analyzes circular bubbles, measures pixel fill ratio, filters eraser smudges,
and assigns confidence scores with automated warning flags.
"""

import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple


def extract_bubble_stats(
    gray: np.ndarray,
    cx: int,
    cy: int,
    radius: int
) -> Dict[str, float]:
    """
    Extracts fill ratio and luminance stats from a single circular bubble.
    Uses an inner circular mask to exclude the printed black outline.
    """
    h_img, w_img = gray.shape
    r = int(radius)

    x1 = max(0, cx - r)
    y1 = max(0, cy - r)
    x2 = min(w_img, cx + r + 1)
    y2 = min(h_img, cy + r + 1)

    roi = gray[y1:y2, x1:x2]
    if roi.size == 0:
        return {"fill_ratio": 0.0, "mean_intensity": 255.0, "darkness": 0.0}

    roi_h, roi_w = roi.shape
    center_roi = (cx - x1, cy - y1)

    # Inner circular mask: 75% of radius to strictly sample inside the circle
    inner_r = max(2, int(r * 0.75))
    mask = np.zeros((roi_h, roi_w), dtype="uint8")
    cv2.circle(mask, center_roi, inner_r, 255, -1)

    total_inner_pixels = cv2.countNonZero(mask)
    if total_inner_pixels == 0:
        return {"fill_ratio": 0.0, "mean_intensity": 255.0, "darkness": 0.0}

    # Mean intensity inside circle
    mean_val = cv2.mean(roi, mask=mask)[0]

    # Local thresholding: Pencil on white paper
    # Typical paper is 220-250, pencil is 50-130, eraser smudge is 160-200
    _, thresh = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
    dark_pixels = cv2.countNonZero(cv2.bitwise_and(thresh, thresh, mask=mask))

    fill_ratio = dark_pixels / float(total_inner_pixels)

    # Darkness metric: 1.0 = completely black (0), 0.0 = completely white (255)
    darkness = max(0.0, min(1.0, (240.0 - mean_val) / 180.0))

    # Composite score giving weight to both binary fill and analog darkness
    composite_score = 0.65 * fill_ratio + 0.35 * darkness

    return {
        "fill_ratio": float(fill_ratio),
        "mean_intensity": float(mean_val),
        "darkness": float(darkness),
        "score": float(composite_score)
    }


def evaluate_single_choice(
    gray: np.ndarray,
    options: List[Tuple[str, int, int]],  # [(label, cx, cy), ...]
    radius: int = 15
) -> Dict[str, Any]:
    """
    Evaluates a single-choice question (e.g. A, B, C, D).
    Distinguishes valid fills from eraser smudges and detects double-marked bubbles.
    """
    stats_list = []
    for label, cx, cy in options:
        st = extract_bubble_stats(gray, cx, cy, radius)
        stats_list.append((label, cx, cy, st))

    # Sort descending by composite score
    sorted_stats = sorted(stats_list, key=lambda x: x[3]["score"], reverse=True)
    best_label, best_cx, best_cy, best_st = sorted_stats[0]
    second_label, _, _, second_st = sorted_stats[1] if len(sorted_stats) > 1 else ("", 0, 0, {"score": 0.0})

    # Threshold benchmarks:
    # High confidence fill: score >= 0.40
    # Moderate fill: score >= 0.28
    # Unanswered / empty: score < 0.20
    score_gap = best_st["score"] - second_st["score"]

    if best_st["score"] < 0.20:
        return {
            "selected": None,
            "confidence": "high",
            "flag": "UNANSWERED",
            "score": best_st["score"],
            "all_scores": {item[0]: round(item[3]["score"], 3) for item in stats_list},
            "selected_coord": None
        }

    # Case: Double mark or severe eraser residue
    if best_st["score"] >= 0.28 and second_st["score"] >= 0.24 and score_gap < 0.12:
        return {
            "selected": best_label,
            "confidence": "low",
            "flag": "DOUBLE_MARK",
            "warning": f"Nghi ngờ tô 2 đáp án {best_label} ({best_st['score']:.2f}) và {second_label} ({second_st['score']:.2f})",
            "score": best_st["score"],
            "all_scores": {item[0]: round(item[3]["score"], 3) for item in stats_list},
            "selected_coord": (best_cx, best_cy)
        }

    # Case: Light pencil mark
    if 0.20 <= best_st["score"] < 0.35 and score_gap >= 0.12:
        return {
            "selected": best_label,
            "confidence": "medium",
            "flag": "LIGHT_MARK",
            "warning": f"Tô hơi nhạt ở ô {best_label} ({best_st['score']:.2f})",
            "score": best_st["score"],
            "all_scores": {item[0]: round(item[3]["score"], 3) for item in stats_list},
            "selected_coord": (best_cx, best_cy)
        }

    # Case: Valid unambiguous answer
    return {
        "selected": best_label,
        "confidence": "high",
        "flag": "VALID",
        "score": best_st["score"],
        "all_scores": {item[0]: round(item[3]["score"], 3) for item in stats_list},
        "selected_coord": (best_cx, best_cy)
    }


def evaluate_digit_column(
    gray: np.ndarray,
    digits_coords: List[Tuple[str, int, int]],  # [('0', cx, cy), ('1', cx, cy), ..., ('9', cx, cy)]
    radius: int = 14
) -> Tuple[Optional[str], float, Optional[Tuple[int, int]]]:
    """
    Evaluates a single column of digits (0-9) for Student Code (SBD) or Exam Code.
    Returns: (detected_digit, confidence_score, coord)
    """
    stats_list = []
    for digit, cx, cy in digits_coords:
        st = extract_bubble_stats(gray, cx, cy, radius)
        stats_list.append((digit, cx, cy, st))

    sorted_stats = sorted(stats_list, key=lambda x: x[3]["score"], reverse=True)
    best_digit, best_cx, best_cy, best_st = sorted_stats[0]

    if best_st["score"] >= 0.24:
        return best_digit, best_st["score"], (best_cx, best_cy)
    return None, best_st["score"], None

