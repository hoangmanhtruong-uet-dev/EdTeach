"""
OMR Sheet Template Geometry and PDF Generator.
Supports:
1. 'bgd_2025': Official Ministry of Education 2025 format (Part I: MCQ, Part II: True/False, Part III: Short Answer)
2. 'classic_50': Traditional 50-question MCQ (A-B-C-D)
Generates high-precision PDF sheets and provides exact pixel coordinates for OpenCV matching.
"""

import io
import math
import random
from typing import Dict, Any, List, Tuple
import cv2
import numpy as np
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors

TARGET_W = 1654
TARGET_H = 2338
PT_W, PT_H = A4
SCALE_X = TARGET_W / PT_W
SCALE_Y = TARGET_H / PT_H


def px_to_pt(x_px: float, y_px: float) -> Tuple[float, float]:
    """Convert OpenCV pixel coordinate (top-left origin) to ReportLab points (bottom-left origin)."""
    x_pt = x_px / SCALE_X
    y_pt = PT_H - (y_px / SCALE_Y)
    return x_pt, y_pt


def pt_to_px(x_pt: float, y_pt: float) -> Tuple[int, int]:
    """Convert ReportLab points to OpenCV pixel coordinate."""
    x_px = int(round(x_pt * SCALE_X))
    y_px = int(round((PT_H - y_pt) * SCALE_Y))
    return x_px, y_px


def build_bgd_2025_geometry() -> Dict[str, Any]:
    """
    Builds exact geometry for BGD 2025 exam sheet.
    Canvas: 1654 x 2338 px.
    Anchor marks: 4 corners at margin 70px, size 80px.
    """
    margin = 70
    anchor_size = 80
    anchors = [
        {"name": "TL", "rect": [margin, margin, anchor_size, anchor_size]},
        {"name": "TR", "rect": [TARGET_W - margin - anchor_size, margin, anchor_size, anchor_size]},
        {"name": "BR", "rect": [TARGET_W - margin - anchor_size, TARGET_H - margin - anchor_size, anchor_size, anchor_size]},
        {"name": "BL", "rect": [margin, TARGET_H - margin - anchor_size, anchor_size, anchor_size]},
    ]

    bubble_radius = 14

    # 1. Student Code (Số Báo Danh - 6 digits, 0-9)
    # Placed at top right of header zone
    sbd_origin_x = 1000
    sbd_origin_y = 280
    sbd_dx = 40
    sbd_dy = 32
    student_code_columns = []
    for col in range(6):
        col_digits = []
        cx = sbd_origin_x + col * sbd_dx
        for d in range(10):
            cy = sbd_origin_y + d * sbd_dy
            col_digits.append({"digit": str(d), "cx": cx, "cy": cy, "r": bubble_radius})
        student_code_columns.append(col_digits)

    # 2. Exam Code (Mã Đề Thi - 3 digits, 0-9)
    exam_origin_x = 1320
    exam_origin_y = 280
    exam_dx = 40
    exam_dy = 32
    exam_code_columns = []
    for col in range(3):
        col_digits = []
        cx = exam_origin_x + col * exam_dx
        for d in range(10):
            cy = exam_origin_y + d * exam_dy
            col_digits.append({"digit": str(d), "cx": cx, "cy": cy, "r": bubble_radius})
        exam_code_columns.append(col_digits)

    # 3. Part I: 40 questions (4 options: A, B, C, D)
    # Arranged in 2 columns: Q1-Q20 (left) and Q21-Q40 (right)
    part1_questions = {}
    col1_x = 130
    col2_x = 510
    part1_y_start = 740
    part1_dy = 34
    opt_dx = 42

    for q_idx in range(1, 41):
        is_col2 = q_idx > 20
        row_idx = (q_idx - 1) % 20
        base_x = col2_x if is_col2 else col1_x
        cy = part1_y_start + row_idx * part1_dy
        options = []
        for i, opt in enumerate(["A", "B", "C", "D"]):
            cx = base_x + 90 + i * opt_dx
            options.append({"label": opt, "cx": cx, "cy": cy, "r": bubble_radius})
        part1_questions[str(q_idx)] = options

    # 4. Part II: 8 questions (True/False - 4 sub-items: a, b, c, d; each has [Đ], [S])
    # Placed on right side: X ~ 920, Y ~ 740
    part2_questions = {}
    part2_base_x = 940
    part2_y_start = 740
    part2_q_dy = 86  # vertical span per question

    for q_idx in range(1, 9):
        q_y = part2_y_start + (q_idx - 1) * part2_q_dy
        sub_items = {}
        for sub_i, sub_lbl in enumerate(["a", "b", "c", "d"]):
            # Two sub-items per row to keep it compact
            row = sub_i // 2
            col = sub_i % 2
            item_x = part2_base_x + col * 160
            item_y = q_y + row * 34
            d_cx = item_x + 50
            s_cx = item_x + 92
            sub_items[sub_lbl] = [
                {"label": "Đ", "cx": d_cx, "cy": item_y, "r": bubble_radius},
                {"label": "S", "cx": s_cx, "cy": item_y, "r": bubble_radius}
            ]
        part2_questions[str(q_idx)] = sub_items

    # 5. Part III: 6 questions (Short Answer / Number fill)
    # Placed on bottom right: Y ~ 1520
    # Each question has 5 columns: sign (-/,) and 4 digits (0-9)
    part3_questions = {}
    part3_origin_y = 1530
    part3_q_dy = 100

    for q_idx in range(1, 7):
        # 3 questions per column
        col_group = 0 if q_idx <= 3 else 1
        q_in_col = (q_idx - 1) % 3
        q_base_x = 940 + col_group * 310
        q_cy = part3_origin_y + q_in_col * 240

        cols_data = []
        # Col 0: Sign '-' and decimal ','
        sign_col = [
            {"label": "-", "cx": q_base_x + 55, "cy": q_cy + 25, "r": 12},
            {"label": ",", "cx": q_base_x + 55, "cy": q_cy + 55, "r": 12}
        ]
        cols_data.append({"type": "sign", "bubbles": sign_col})

        # Col 1..4: Digits 0..9
        for dcol in range(4):
            digits_list = []
            cx = q_base_x + 95 + dcol * 36
            for d in range(10):
                cy = q_cy + 25 + d * 21
                digits_list.append({"label": str(d), "cx": cx, "cy": cy, "r": 10})
            cols_data.append({"type": "digit", "bubbles": digits_list})

        part3_questions[str(q_idx)] = cols_data

    return {
        "sheet_type": "bgd_2025",
        "name": "Phiếu Trả Lời Trắc Nghiệm Chuẩn Bộ GD&ĐT (GDPT 2018)",
        "width": TARGET_W,
        "height": TARGET_H,
        "anchors": anchors,
        "bubble_radius": bubble_radius,
        "student_code": student_code_columns,
        "exam_code": exam_code_columns,
        "part1": part1_questions,
        "part2": part2_questions,
        "part3": part3_questions
    }


def build_classic_50_geometry() -> Dict[str, Any]:
    """
    Builds exact geometry for Classic 50-question A-B-C-D sheet.
    """
    margin = 70
    anchor_size = 80
    anchors = [
        {"name": "TL", "rect": [margin, margin, anchor_size, anchor_size]},
        {"name": "TR", "rect": [TARGET_W - margin - anchor_size, margin, anchor_size, anchor_size]},
        {"name": "BR", "rect": [TARGET_W - margin - anchor_size, TARGET_H - margin - anchor_size, anchor_size, anchor_size]},
        {"name": "BL", "rect": [margin, TARGET_H - margin - anchor_size, anchor_size, anchor_size]},
    ]
    bubble_radius = 15

    # SBD: 6 cols x 10 rows
    sbd_origin_x = 900
    sbd_origin_y = 260
    sbd_dx = 42
    sbd_dy = 32
    student_code_columns = []
    for col in range(6):
        col_digits = []
        cx = sbd_origin_x + col * sbd_dx
        for d in range(10):
            cy = sbd_origin_y + d * sbd_dy
            col_digits.append({"digit": str(d), "cx": cx, "cy": cy, "r": bubble_radius})
        student_code_columns.append(col_digits)

    # Exam Code: 3 cols x 10 rows
    exam_origin_x = 1260
    exam_origin_y = 260
    exam_dx = 42
    exam_dy = 32
    exam_code_columns = []
    for col in range(3):
        col_digits = []
        cx = exam_origin_x + col * exam_dx
        for d in range(10):
            cy = exam_origin_y + d * exam_dy
            col_digits.append({"digit": str(d), "cx": cx, "cy": cy, "r": bubble_radius})
        exam_code_columns.append(col_digits)

    # 50 Questions: 2 columns of 25 questions each
    # Column 1: Q1 - Q25 (Left)
    # Column 2: Q26 - Q50 (Right)
    questions = {}
    col1_x = 180
    col2_x = 880
    y_start = 660
    dy = 60
    opt_dx = 65

    for q_idx in range(1, 51):
        is_col2 = q_idx > 25
        row_idx = (q_idx - 1) % 25
        base_x = col2_x if is_col2 else col1_x
        cy = y_start + row_idx * dy
        options = []
        for i, opt in enumerate(["A", "B", "C", "D"]):
            cx = base_x + 120 + i * opt_dx
            options.append({"label": opt, "cx": cx, "cy": cy, "r": bubble_radius})
        questions[str(q_idx)] = options

    return {
        "sheet_type": "classic_50",
        "name": "Phiếu Trả Lời Trắc Nghiệm Truyền Thống 50 Câu (A-B-C-D)",
        "width": TARGET_W,
        "height": TARGET_H,
        "anchors": anchors,
        "bubble_radius": bubble_radius,
        "student_code": student_code_columns,
        "exam_code": exam_code_columns,
        "questions": questions
    }


def render_blank_sheet_image(geom: Dict[str, Any]) -> np.ndarray:
    """
    Renders an exact synthetic OpenCV image corresponding to the template geometry.
    Useful for unit testing, debug overlays, and preview.
    """
    img = np.ones((TARGET_H, TARGET_W, 3), dtype="uint8") * 255

    # 1. Draw 4 solid black anchor marks
    for anchor in geom["anchors"]:
        rx, ry, rw, rh = anchor["rect"]
        cv2.rectangle(img, (rx, ry), (rx + rw, ry + rh), (0, 0, 0), -1)

    # Orientation notch (Top Left)
    cv2.rectangle(img, (180, 85), (220, 135), (0, 0, 0), -1)

    # 2. Draw Header
    title = geom.get("name", "PHIẾU TRẢ LỜI TRẮC NGHIỆM")
    cv2.putText(img, title, (260, 120), cv2.FONT_HERSHEY_DUPLEX, 1.0, (20, 20, 20), 2)
    cv2.putText(img, "Bo Giao Duc & Dao Tao - EduTest AI OMR System", (260, 155), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (80, 80, 80), 1)

    # Candidate info box (lines for hand-writing name, class, exam date)
    cv2.rectangle(img, (100, 200), (860, 580), (50, 50, 50), 2)
    info_labels = [
        "Ho va ten thi sinh: ................................................................",
        "Ngay sinh: ........................................ Lop: ...........................",
        "Truong: ............................................................................",
        "Phong thi: ................ So bao danh: ....................................",
        "Chu y: Dung but chi 2B to kin o tron. Khong gap rach phieu.",
    ]
    for i, lbl in enumerate(info_labels):
        cv2.putText(img, lbl, (120, 245 + i * 70), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (30, 30, 30), 1)

    # 3. Draw Student Code table
    cv2.rectangle(img, (980, 210), (1240, 600), (30, 30, 30), 2)
    cv2.putText(img, "SO BAO DANH", (1030, 245), cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 0, 0), 2)
    for col_digits in geom["student_code"]:
        for item in col_digits:
            cx, cy, r = item["cx"], item["cy"], item["r"]
            cv2.circle(img, (cx, cy), r, (0, 0, 0), 1)
            cv2.putText(img, item["digit"], (cx - 5, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (60, 60, 60), 1)

    # 4. Draw Exam Code table
    cv2.rectangle(img, (1300, 210), (1440, 600), (30, 30, 30), 2)
    cv2.putText(img, "MA DE", (1335, 245), cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 0, 0), 2)
    for col_digits in geom["exam_code"]:
        for item in col_digits:
            cx, cy, r = item["cx"], item["cy"], item["r"]
            cv2.circle(img, (cx, cy), r, (0, 0, 0), 1)
            cv2.putText(img, item["digit"], (cx - 5, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (60, 60, 60), 1)

    # 5. Draw Content depending on sheet type
    if geom["sheet_type"] == "classic_50":
        for q_num, opts in geom["questions"].items():
            first_cx = opts[0]["cx"]
            cy = opts[0]["cy"]
            cv2.putText(img, f"Cau {q_num: >2}:", (first_cx - 95, cy + 5), cv2.FONT_HERSHEY_DUPLEX, 0.55, (20, 20, 20), 1)
            for opt in opts:
                cv2.circle(img, (opt["cx"], opt["cy"]), opt["r"], (0, 0, 0), 1)
                cv2.putText(img, opt["label"], (opt["cx"] - 6, opt["cy"] + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (40, 40, 40), 1)
    else:
        # BGD 2025: Draw Part I, Part II, Part III
        # Part I
        cv2.putText(img, "PHAN I: TRAC NGHIEM 4 LUA CHON (40 CAU)", (100, 690), cv2.FONT_HERSHEY_DUPLEX, 0.75, (0, 0, 0), 2)
        cv2.rectangle(img, (90, 710), (870, 1460), (40, 40, 40), 1)
        for q_num, opts in geom["part1"].items():
            first_cx = opts[0]["cx"]
            cy = opts[0]["cy"]
            cv2.putText(img, f"{q_num:>2}.", (first_cx - 48, cy + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (20, 20, 20), 1)
            for opt in opts:
                cv2.circle(img, (opt["cx"], opt["cy"]), opt["r"], (0, 0, 0), 1)
                cv2.putText(img, opt["label"], (opt["cx"] - 5, opt["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (50, 50, 50), 1)

        # Part II
        cv2.putText(img, "PHAN II: DUNG / SAI (8 CAU)", (910, 690), cv2.FONT_HERSHEY_DUPLEX, 0.75, (0, 0, 0), 2)
        cv2.rectangle(img, (900, 710), (1550, 1460), (40, 40, 40), 1)
        for q_num, sub_dict in geom["part2"].items():
            # Header for Question
            sample_sub = sub_dict["a"][0]
            q_y = sample_sub["cy"]
            cv2.putText(img, f"Cau {q_num}:", (910, q_y + 15), cv2.FONT_HERSHEY_DUPLEX, 0.55, (20, 20, 20), 1)
            for sub_lbl, bubbles in sub_dict.items():
                d_bub, s_bub = bubbles[0], bubbles[1]
                cv2.putText(img, f"{sub_lbl})", (d_bub["cx"] - 30, d_bub["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (30, 30, 30), 1)
                cv2.circle(img, (d_bub["cx"], d_bub["cy"]), d_bub["r"], (0, 0, 0), 1)
                cv2.putText(img, "D", (d_bub["cx"] - 5, d_bub["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (50, 50, 50), 1)
                cv2.circle(img, (s_bub["cx"], s_bub["cy"]), s_bub["r"], (0, 0, 0), 1)
                cv2.putText(img, "S", (s_bub["cx"] - 5, s_bub["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (50, 50, 50), 1)

        # Part III
        cv2.putText(img, "PHAN III: TRA LOI NGAN / DIEN SO (6 CAU)", (100, 1495), cv2.FONT_HERSHEY_DUPLEX, 0.75, (0, 0, 0), 2)
        cv2.rectangle(img, (90, 1515), (1550, 2240), (40, 40, 40), 1)
        for q_num, col_groups in geom["part3"].items():
            base_x = col_groups[0]["bubbles"][0]["cx"] - 50
            base_y = col_groups[0]["bubbles"][0]["cy"] - 10
            cv2.putText(img, f"Cau {q_num}", (base_x, base_y), cv2.FONT_HERSHEY_DUPLEX, 0.52, (20, 20, 20), 1)
            for c_info in col_groups:
                for b in c_info["bubbles"]:
                    cv2.circle(img, (b["cx"], b["cy"]), b["r"], (0, 0, 0), 1)
                    cv2.putText(img, b["label"], (b["cx"] - 4, b["cy"] + 3), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (50, 50, 50), 1)

    return img


def generate_printable_pdf(geom: Dict[str, Any], exam_title: str = "KỲ THI TRẮC NGHIỆM ĐỊNH KỲ") -> bytes:
    """
    Generates a production-quality, exact-dimension printable PDF sheet using ReportLab.
    Matches 1:1 with the pixel coordinates upon scanning at 200 DPI.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)

    # 1. Draw 4 Corner Anchors
    c.setFillColor(colors.black)
    for anchor in geom["anchors"]:
        rx, ry, rw, rh = anchor["rect"]
        x_pt, y_pt = px_to_pt(rx, ry + rh)
        w_pt = rw / SCALE_X
        h_pt = rh / SCALE_Y
        c.rect(x_pt, y_pt, w_pt, h_pt, fill=1, stroke=0)

    # Orientation Marker
    ox_pt, oy_pt = px_to_pt(180, 135)
    c.rect(ox_pt, oy_pt, 40 / SCALE_X, 50 / SCALE_Y, fill=1, stroke=0)

    # Title & Text
    c.setFont("Helvetica-Bold", 14)
    c.drawString(100, PT_H - 45, exam_title)
    c.setFont("Helvetica", 8)
    c.drawString(100, PT_H - 58, "He thong cham thi trac nghiem tu dong EduTest AI OMR - Quy chuan GDPT 2018")

    # Candidate Box
    c.rect(36, PT_H - 210, 275, 135, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(45, PT_H - 90, "THONG TIN THI SINH")
    c.setFont("Helvetica", 8)
    c.drawString(45, PT_H - 110, "Ho va ten: .....................................................................")
    c.drawString(45, PT_H - 130, "Ngay sinh: .............................. Lop: ...........................")
    c.drawString(45, PT_H - 150, "Truong: ........................................................................")
    c.drawString(45, PT_H - 170, "Phong thi: .................... So bao danh: .......................")
    c.setFont("Helvetica-Oblique", 7)
    c.drawString(45, PT_H - 195, "* Luu y: Dung but chi 2B to kin o tron. Khong lam rach hoac gap phieu.")

    # Student Code Table
    sbd_box_x, sbd_box_y = px_to_pt(980, 600)
    c.rect(sbd_box_x, sbd_box_y, 260 / SCALE_X, 390 / SCALE_Y, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(sbd_box_x + (130 / SCALE_X), sbd_box_y + (390 / SCALE_Y) - 14, "SO BAO DANH")

    c.setLineWidth(0.6)
    for col_digits in geom["student_code"]:
        for item in col_digits:
            x_pt, y_pt = px_to_pt(item["cx"], item["cy"])
            r_pt = item["r"] / SCALE_X
            c.circle(x_pt, y_pt, r_pt, stroke=1, fill=0)
            c.setFont("Helvetica", 6)
            c.drawCentredString(x_pt, y_pt - 2, item["digit"])

    # Exam Code Table
    exam_box_x, exam_box_y = px_to_pt(1300, 600)
    c.rect(exam_box_x, exam_box_y, 140 / SCALE_X, 390 / SCALE_Y, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(exam_box_x + (70 / SCALE_X), exam_box_y + (390 / SCALE_Y) - 14, "MA DE")

    for col_digits in geom["exam_code"]:
        for item in col_digits:
            x_pt, y_pt = px_to_pt(item["cx"], item["cy"])
            r_pt = item["r"] / SCALE_X
            c.circle(x_pt, y_pt, r_pt, stroke=1, fill=0)
            c.setFont("Helvetica", 6)
            c.drawCentredString(x_pt, y_pt - 2, item["digit"])

    # Draw Content
    if geom["sheet_type"] == "classic_50":
        for q_num, opts in geom["questions"].items():
            first_pt_x, first_pt_y = px_to_pt(opts[0]["cx"], opts[0]["cy"])
            c.setFont("Helvetica-Bold", 7)
            c.drawRightString(first_pt_x - 14, first_pt_y - 2.5, f"Cau {q_num}:")
            for opt in opts:
                opt_x, opt_y = px_to_pt(opt["cx"], opt["cy"])
                r_pt = opt["r"] / SCALE_X
                c.circle(opt_x, opt_y, r_pt, stroke=1, fill=0)
                c.setFont("Helvetica", 6.5)
                c.drawCentredString(opt_x, opt_y - 2, opt["label"])
    else:
        # BGD 2025: Part I, Part II, Part III
        # Part I
        c.setFont("Helvetica-Bold", 9)
        c.drawString(36, PT_H - 250, "PHAN I: TRAC NGHIEM 4 LUA CHON (40 CAU)")
        p1_x, p1_y = px_to_pt(90, 1460)
        c.rect(p1_x, p1_y, 780 / SCALE_X, 750 / SCALE_Y, stroke=1, fill=0)
        for q_num, opts in geom["part1"].items():
            first_pt_x, first_pt_y = px_to_pt(opts[0]["cx"], opts[0]["cy"])
            c.setFont("Helvetica-Bold", 6.5)
            c.drawRightString(first_pt_x - 10, first_pt_y - 2, f"{q_num}.")
            for opt in opts:
                opt_x, opt_y = px_to_pt(opt["cx"], opt["cy"])
                r_pt = opt["r"] / SCALE_X
                c.circle(opt_x, opt_y, r_pt, stroke=1, fill=0)
                c.setFont("Helvetica", 5.5)
                c.drawCentredString(opt_x, opt_y - 1.8, opt["label"])

        # Part II
        c.setFont("Helvetica-Bold", 9)
        c.drawString(328, PT_H - 250, "PHAN II: DUNG / SAI (8 CAU)")
        p2_x, p2_y = px_to_pt(900, 1460)
        c.rect(p2_x, p2_y, 650 / SCALE_X, 750 / SCALE_Y, stroke=1, fill=0)
        for q_num, sub_dict in geom["part2"].items():
            sample_sub = sub_dict["a"][0]
            _, q_pt_y = px_to_pt(sample_sub["cx"], sample_sub["cy"])
            c.setFont("Helvetica-Bold", 7)
            c.drawString(335, q_pt_y + 10, f"Cau {q_num}:")
            for sub_lbl, bubbles in sub_dict.items():
                d_bub, s_bub = bubbles[0], bubbles[1]
                dx_pt, dy_pt = px_to_pt(d_bub["cx"], d_bub["cy"])
                sx_pt, sy_pt = px_to_pt(s_bub["cx"], s_bub["cy"])
                r_pt = d_bub["r"] / SCALE_X
                c.setFont("Helvetica", 6)
                c.drawString(dx_pt - 10, dy_pt - 2, f"{sub_lbl})")
                c.circle(dx_pt, dy_pt, r_pt, stroke=1, fill=0)
                c.drawCentredString(dx_pt, dy_pt - 1.8, "D")
                c.circle(sx_pt, sy_pt, r_pt, stroke=1, fill=0)
                c.drawCentredString(sx_pt, sy_pt - 1.8, "S")

        # Part III
        c.setFont("Helvetica-Bold", 9)
        c.drawString(36, PT_H - 538, "PHAN III: TRA LOI NGAN / DIEN SO (6 CAU)")
        p3_x, p3_y = px_to_pt(90, 2240)
        c.rect(p3_x, p3_y, 1460 / SCALE_X, 725 / SCALE_Y, stroke=1, fill=0)
        for q_num, col_groups in geom["part3"].items():
            first_b = col_groups[0]["bubbles"][0]
            fx_pt, fy_pt = px_to_pt(first_b["cx"], first_b["cy"])
            c.setFont("Helvetica-Bold", 6.5)
            c.drawString(fx_pt - 18, fy_pt + 8, f"Cau {q_num}")
            for c_info in col_groups:
                for b in c_info["bubbles"]:
                    bx_pt, by_pt = px_to_pt(b["cx"], b["cy"])
                    br_pt = b["r"] / SCALE_X
                    c.circle(bx_pt, by_pt, br_pt, stroke=1, fill=0)
                    c.setFont("Helvetica", 5)
                    c.drawCentredString(bx_pt, by_pt - 1.5, b["label"])

    c.showPage()
    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def synthesize_filled_exam(
    geom: Dict[str, Any],
    student_code: str = "123456",
    exam_code: str = "101",
    answers_part1: Dict[str, str] = None,
    answers_part2: Dict[str, Dict[str, str]] = None,
    answers_part3: Dict[str, str] = None,
    noise_level: float = 0.05,
    rotation_deg: float = 0.0,
    simulate_erasures: bool = True
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Renders a realistic filled exam sheet with pencil marks, realistic pencil shading,
    optional erasures, and slight perspective distortion for end-to-end testing.
    """
    sheet = render_blank_sheet_image(geom)

    def fill_bubble(cx: int, cy: int, r: int, fill_prob: float = 0.90, intensity: int = 55):
        # Draw realistic pencil shading inside circle
        inner_r = max(2, int(r * 0.78))
        # Base dark circle
        cv2.circle(sheet, (cx, cy), inner_r, (intensity, intensity, intensity), -1)
        # Pencil texture jitter
        for _ in range(8):
            jx = cx + random.randint(-int(inner_r * 0.6), int(inner_r * 0.6))
            jy = cy + random.randint(-int(inner_r * 0.6), int(inner_r * 0.6))
            cv2.circle(sheet, (jx, jy), max(1, int(inner_r * 0.3)), (intensity - 15, intensity - 15, intensity - 15), -1)

    def erase_bubble(cx: int, cy: int, r: int):
        # Simulated eraser smudge: pale gray with uneven patches
        inner_r = max(2, int(r * 0.75))
        cv2.circle(sheet, (cx, cy), inner_r, (190, 190, 190), -1)

    # 1. Fill Student Code
    for col_idx, char in enumerate(student_code[:6]):
        if char.isdigit():
            digit_val = int(char)
            target_bubble = geom["student_code"][col_idx][digit_val]
            fill_bubble(target_bubble["cx"], target_bubble["cy"], target_bubble["r"])

    # 2. Fill Exam Code
    for col_idx, char in enumerate(exam_code[:3]):
        if char.isdigit():
            digit_val = int(char)
            target_bubble = geom["exam_code"][col_idx][digit_val]
            fill_bubble(target_bubble["cx"], target_bubble["cy"], target_bubble["r"])

    # 3. Fill Answers
    if geom["sheet_type"] == "classic_50":
        answers = answers_part1 or {}
        for q_num, opts in geom["questions"].items():
            ans = answers.get(q_num)
            for opt in opts:
                if opt["label"] == ans:
                    fill_bubble(opt["cx"], opt["cy"], opt["r"])
                elif simulate_erasures and random.random() < 0.03:
                    # Random eraser smudge on unselected option
                    erase_bubble(opt["cx"], opt["cy"], opt["r"])
    else:
        # BGD 2025
        # Part I
        p1_ans = answers_part1 or {}
        for q_num, opts in geom["part1"].items():
            ans = p1_ans.get(q_num)
            for opt in opts:
                if opt["label"] == ans:
                    fill_bubble(opt["cx"], opt["cy"], opt["r"])
                elif simulate_erasures and random.random() < 0.03:
                    erase_bubble(opt["cx"], opt["cy"], opt["r"])

        # Part II
        p2_ans = answers_part2 or {}
        for q_num, sub_dict in geom["part2"].items():
            q_res = p2_ans.get(q_num, {})
            for sub_lbl, bubbles in sub_dict.items():
                expected_tf = q_res.get(sub_lbl)
                exp_norm = "Đ" if str(expected_tf).upper() in ["D", "Đ", "TRUE", "T", "1"] else "S"
                for b in bubbles:
                    b_norm = "Đ" if str(b["label"]).upper() in ["D", "Đ", "TRUE", "T", "1"] else "S"
                    if b_norm == exp_norm:
                        fill_bubble(b["cx"], b["cy"], b["r"])

        # Part III
        p3_ans = answers_part3 or {}
        for q_num, col_groups in geom["part3"].items():
            val = p3_ans.get(q_num, "")
            # Fill signs and digits
            if val.startswith("-"):
                sign_bubble = col_groups[0]["bubbles"][0]
                fill_bubble(sign_bubble["cx"], sign_bubble["cy"], sign_bubble["r"])
                digits_only = val[1:]
            else:
                digits_only = val

            digit_chars = [c for c in digits_only if c.isdigit()][:4]
            for col_i, dchar in enumerate(digit_chars):
                dval = int(dchar)
                digit_bubble = col_groups[col_i + 1]["bubbles"][dval]
                fill_bubble(digit_bubble["cx"], digit_bubble["cy"], digit_bubble["r"])

    # Optional: Apply slight rotation / perspective skew
    if abs(rotation_deg) > 0.01:
        M = cv2.getRotationMatrix2D((TARGET_W / 2, TARGET_H / 2), rotation_deg, 1.0)
        sheet = cv2.warpAffine(sheet, M, (TARGET_W, TARGET_H), borderValue=(255, 255, 255))

    return sheet, {
        "student_code": student_code,
        "exam_code": exam_code,
        "part1": answers_part1 or {},
        "part2": answers_part2 or {},
        "part3": answers_part3 or {}
    }
