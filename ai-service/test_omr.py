import sys
import os

# Add ai-service to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.omr.sheet_generator import (
    build_classic_50_geometry,
    build_bgd_2025_geometry,
    synthesize_filled_exam,
    generate_printable_pdf
)
from app.omr.template_matcher import grade_exam_sheet


def test_classic_50():
    print("--- 1. Testing Classic 50 Sheet ---")
    c50_geom = build_classic_50_geometry()
    answers_50 = {str(i): ("A" if i % 2 == 0 else "B") for i in range(1, 51)}
    
    # Generate realistic filled sheet
    c50_img, meta = synthesize_filled_exam(
        c50_geom,
        student_code="654321",
        exam_code="204",
        answers_part1=answers_50,
        rotation_deg=0.0
    )
    
    # Grade sheet
    res_50 = grade_exam_sheet(c50_img, sheet_type="classic_50", answer_key=answers_50)
    print(f"Classic 50 Result: SBD={res_50['student_code']}, Exam={res_50['exam_code']}, Score={res_50['total_score']}, Correct={res_50['correct_count']}/50")
    
    assert res_50["student_code"] == "654321", f"Expected 654321, got {res_50['student_code']}"
    assert res_50["exam_code"] == "204", f"Expected 204, got {res_50['exam_code']}"
    assert res_50["correct_count"] == 50, f"Expected 50, got {res_50['correct_count']}"
    assert res_50["total_score"] == 10.0, f"Expected 10.0, got {res_50['total_score']}"
    assert "annotated_image_base64" in res_50, "Missing annotated image"
    print("PASS: Classic 50 sheet graded with 100% accuracy!")


def test_bgd_2025():
    print("--- 2. Testing BGD 2025 Sheet ---")
    bgd_geom = build_bgd_2025_geometry()
    p1_ans = {str(i): "C" for i in range(1, 41)}
    p2_ans = {str(i): {"a": "D", "b": "S", "c": "D", "d": "S"} for i in range(1, 9)}
    p3_ans = {"1": "-15", "2": "42", "3": "100"}
    
    bgd_img, meta = synthesize_filled_exam(
        bgd_geom,
        student_code="987654",
        exam_code="305",
        answers_part1=p1_ans,
        answers_part2=p2_ans,
        answers_part3=p3_ans
    )
    
    res_bgd = grade_exam_sheet(
        bgd_img,
        sheet_type="bgd_2025",
        answer_key={"part1": p1_ans, "part2": p2_ans, "part3": p3_ans}
    )
    
    print(f"BGD 2025 Result: SBD={res_bgd['student_code']}, Exam={res_bgd['exam_code']}, Total Score={res_bgd['total_score']}")
    print(f"Section Scores: {res_bgd['scores_by_section']}")
    
    assert res_bgd["student_code"] == "987654", f"Expected 987654, got {res_bgd['student_code']}"
    assert res_bgd["exam_code"] == "305", f"Expected 305, got {res_bgd['exam_code']}"
    assert res_bgd["scores_by_section"]["part1_score"] == 10.0
    assert res_bgd["scores_by_section"]["part2_score"] == 8.0  # 8 questions x 1.0 pt
    assert res_bgd["scores_by_section"]["part3_score"] == 0.75  # 3 correct x 0.25 pt
    print("PASS: BGD 2025 sheet graded with 100% accuracy!")


def test_pdf_generation():
    print("--- 3. Testing ReportLab PDF Generation ---")
    bgd_geom = build_bgd_2025_geometry()
    pdf_bytes = generate_printable_pdf(bgd_geom, "KY THI TOT NGHIEP THPT 2025")
    print(f"Generated PDF bytes: {len(pdf_bytes)}")
    assert len(pdf_bytes) > 5000, "PDF size is too small"
    print("PASS: Printable PDF generated successfully!")


def test_skew_and_erasures():
    print("--- 4. Testing Skew & Erasures Resilience ---")
    c50_geom = build_classic_50_geometry()
    answers = {str(i): "C" for i in range(1, 51)}

    # Rotate by 2.5 degrees and simulate random eraser smudges
    img, _ = synthesize_filled_exam(
        c50_geom,
        student_code="112233",
        exam_code="999",
        answers_part1=answers,
        rotation_deg=2.5,
        simulate_erasures=True
    )

    res = grade_exam_sheet(img, sheet_type="classic_50", answer_key=answers)
    print(f"Rotated 2.5 deg result: SBD={res['student_code']}, Exam={res['exam_code']}, Correct={res['correct_count']}/50")
    print(f"Engine used: {res['engine_used']}, Flagged questions: {len(res['flagged_questions'])}")

    assert res["student_code"] == "112233", f"Expected 112233, got {res['student_code']}"
    assert res["exam_code"] == "999", f"Expected 999, got {res['exam_code']}"
    assert res["correct_count"] >= 48, f"Expected at least 48/50, got {res['correct_count']}"
    print("PASS: Sheet with skew and erasures graded with high resilience!")


def test_fastapi_endpoints():
    print("--- 5. Testing FastAPI OMR Endpoints ---")
    from fastapi.testclient import TestClient
    from main import app
    import base64
    import cv2

    client = TestClient(app)

    # 1. /ai/omr/templates
    r_tmpl = client.get("/ai/omr/templates")
    assert r_tmpl.status_code == 200
    templates_list = r_tmpl.json().get("templates", [])
    assert len(templates_list) >= 2
    print(f"PASS: /ai/omr/templates returned {len(templates_list)} templates")

    # 2. /ai/omr/generate-sheet-pdf
    r_pdf = client.post("/ai/omr/generate-sheet-pdf", json={
        "sheet_type": "bgd_2025",
        "exam_title": "KIEM TRA CUOI KY",
        "school_name": "THPT CHUYEN"
    })
    assert r_pdf.status_code == 200
    assert r_pdf.headers["content-type"] == "application/pdf"
    assert len(r_pdf.content) > 5000
    print(f"PASS: /ai/omr/generate-sheet-pdf returned {len(r_pdf.content)} bytes PDF")

    # 3. /ai/omr/grade-single
    c50_geom = build_classic_50_geometry()
    answers = {str(i): "A" for i in range(1, 51)}
    c50_img, _ = synthesize_filled_exam(c50_geom, student_code="889900", exam_code="102", answers_part1=answers)
    _, buf = cv2.imencode(".jpg", c50_img)
    b64_str = base64.b64encode(buf).decode("utf-8")

    r_single = client.post("/ai/omr/grade-single", json={
        "image_base64": b64_str,
        "sheet_type": "classic_50",
        "answer_key": answers,
        "return_annotated_image": True
    })
    assert r_single.status_code == 200, f"Error: {r_single.text}"
    single_data = r_single.json()["data"]
    assert single_data["student_code"] == "889900"
    assert single_data["exam_code"] == "102"
    assert single_data["total_score"] == 10.0
    assert "annotated_image_base64" in single_data
    print("PASS: /ai/omr/grade-single completed successfully with score 10.0")

    # 4. /ai/omr/grade-batch
    r_batch = client.post("/ai/omr/grade-batch", json={
        "sheet_type": "classic_50",
        "answer_key": answers,
        "items": [
            {"id": "std_1", "image_base64": b64_str, "student_name": "Hoc Sinh 1"},
            {"id": "std_2", "image_base64": b64_str, "student_name": "Hoc Sinh 2"}
        ]
    })
    assert r_batch.status_code == 200
    batch_data = r_batch.json()
    assert batch_data["success_count"] == 2
    assert batch_data["statistics"]["average_score"] == 10.0
    print("PASS: /ai/omr/grade-batch parallel processed 2 items successfully")


if __name__ == "__main__":
    test_classic_50()
    test_bgd_2025()
    test_pdf_generation()
    test_skew_and_erasures()
    test_fastapi_endpoints()
    print("\n==========================================")
    print("SUCCESS: ALL OMR ENGINE UNIT TESTS PASSED 100%!")
    print("==========================================")
