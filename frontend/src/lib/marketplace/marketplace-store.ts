import { MarketplaceItem, MarketplacePurchase, PayoutRequest, QuestionFull } from "@/types/marketplace";

// ========================================================
// SAMPLE EXAM DATA (Chuẩn ma trận Bộ GD&ĐT 2025)
// ========================================================

export const INITIAL_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: "mk-toan-12-001",
    seller_id: "seller-tran-nam",
    seller_name: "Thầy Trần Nam",
    seller_tier: "pro",
    title: "Đề thi thử Tốt nghiệp THPT 2025 môn Toán - Chuẩn Ma Trận Bộ GD&ĐT (Đề số 01)",
    subject: "Toán",
    grade: 12,
    description: "Bộ đề chuẩn định dạng cấu trúc 2025: Phần I (12 câu trắc nghiệm nhiều lựa chọn), Phần II (4 câu trắc nghiệm Đúng/Sai với 16 ý lệnh), Phần III (6 câu trả lời ngắn). Có bảng ma trận điểm và lời giải chi tiết từng bước, tích hợp các bài toán ứng dụng thực tế khảo sát đồ thị đạo hàm và hình học không gian tọa độ Oxyz.",
    price_credits: 100, // 10.000đ
    question_count: 22,
    tags: ["ChuanMaTran2025", "Lop12", "OnThiTotNghiep", "CoLoiGiaiChiTiet", "Oxyz", "DaoHam"],
    downloads_count: 348,
    rating: 4.9,
    review_count: 52,
    status: "published",
    created_at: "2026-10-20T10:00:00Z",
    preview_data: {
      matrix: {
        total_questions: 22,
        multiple_choice_count: 12,
        true_false_count: 4,
        short_answer_count: 6,
        difficulty_distribution: { easy: 8, medium: 8, hard: 4, very_hard: 2 },
        duration_minutes: 90,
      },
      sample_questions: [
        {
          id: "q-toan-1",
          order: 1,
          type: "multiple_choice",
          content: "Cho hàm số y = f(x) có bảng biến thiên trên đoạn [-2; 3]. Giá trị cực đại của hàm số đã cho bằng bao nhiêu?",
          options: ["A. y_CD = 3", "B. y_CD = -2", "C. y_CD = 5", "D. y_CD = 0"],
          difficulty: "easy",
        },
        {
          id: "q-toan-2",
          order: 2,
          type: "multiple_choice",
          content: "Trong không gian Oxyz, cho mặt phẳng (P): 2x - 3y + z - 5 = 0. Một vectơ pháp tuyến của mặt phẳng (P) là:",
          options: ["A. n1 = (2; -3; 1)", "B. n2 = (2; 3; 1)", "C. n3 = (2; -3; -5)", "D. n4 = (-2; -3; 1)"],
          difficulty: "easy",
        },
        {
          id: "q-toan-3",
          order: 3,
          type: "multiple_choice",
          content: "Một doanh nghiệp sản xuất một loại sản phẩm với hàm chi phí tổng cộng C(x) = 0.02x^3 - 3x^2 + 200x + 1000 (triệu đồng), trong đó x là số lượng sản phẩm. Mức sản lượng x để chi phí biên nhỏ nhất là:",
          options: ["A. x = 50", "B. x = 75", "C. x = 100", "D. x = 120"],
          difficulty: "medium",
        },
      ],
    },
    exam_data: {
      questions: [
        {
          id: "q-toan-1",
          order: 1,
          type: "multiple_choice",
          content: "Cho hàm số y = f(x) có bảng biến thiên trên đoạn [-2; 3]. Giá trị cực đại của hàm số đã cho bằng bao nhiêu?",
          options: ["A. y_CD = 3", "B. y_CD = -2", "C. y_CD = 5", "D. y_CD = 0"],
          correct_answer: "C",
          explanation: "Dựa vào bảng biến thiên, đạo hàm đổi dấu từ dương sang âm tại x = 1 và f(1) = 5. Do đó giá trị cực đại của hàm số là y_CD = 5.",
          difficulty: "easy",
        },
        {
          id: "q-toan-2",
          order: 2,
          type: "multiple_choice",
          content: "Trong không gian Oxyz, cho mặt phẳng (P): 2x - 3y + z - 5 = 0. Một vectơ pháp tuyến của mặt phẳng (P) là:",
          options: ["A. n1 = (2; -3; 1)", "B. n2 = (2; 3; 1)", "C. n3 = (2; -3; -5)", "D. n4 = (-2; -3; 1)"],
          correct_answer: "A",
          explanation: "Mặt phẳng Ax + By + Cz + D = 0 có một vectơ pháp tuyến là n = (A; B; C) = (2; -3; 1).",
          difficulty: "easy",
        },
        {
          id: "q-toan-3",
          order: 3,
          type: "multiple_choice",
          content: "Một doanh nghiệp sản xuất một loại sản phẩm với hàm chi phí tổng cộng C(x) = 0.02x^3 - 3x^2 + 200x + 1000 (triệu đồng), trong đó x là số lượng sản phẩm. Mức sản lượng x để chi phí biên nhỏ nhất là:",
          options: ["A. x = 50", "B. x = 75", "C. x = 100", "D. x = 120"],
          correct_answer: "A",
          explanation: "Chi phí biên C'(x) = 0.06x^2 - 6x + 200. Ta có (C'(x))' = 0.12x - 6 = 0 <=> x = 6 / 0.12 = 50. Vì hệ số a = 0.06 > 0 nên parabol đạt giá trị nhỏ nhất tại x = 50.",
          difficulty: "medium",
        },
        {
          id: "q-toan-4",
          order: 4,
          type: "multiple_choice",
          content: "Cho hình lăng trụ đứng ABC.A'B'C' có đáy ABC là tam giác vuông cân tại B, AB = a. Thể tích khối lăng trụ biết khoảng cách từ A đến mặt phẳng (A'BC) bằng a*sqrt(2)/2 là:",
          options: ["A. a^3 / 2", "B. a^3 * sqrt(2) / 3", "C. a^3 / 3", "D. a^3"],
          correct_answer: "A",
          explanation: "Kẻ AH vuông góc A'B. Khi đó AH = d(A, (A'BC)) = a*sqrt(2)/2. Trong tam giác vuông ABA': 1/AH^2 = 1/AB^2 + 1/AA'^2 => AA' = a. Diện tích đáy S = 1/2*a^2. Thể tích V = S * AA' = 1/2 * a^3.",
          difficulty: "hard",
        },
        {
          id: "q-toan-5",
          order: 5,
          type: "true_false",
          content: "Cho hàm số f(x) = x^3 - 3x + 2 trên khoảng (-∞; +∞). Xét tính đúng sai của các khẳng định sau:\na) Hàm số đồng biến trên khoảng (1; +∞).\nb) Điểm cực tiểu của đồ thị hàm số là (1; 0).\nc) Phương trình f(x) = m có 3 nghiệm phân biệt khi 0 < m < 4.\nd) Giá trị lớn nhất của hàm số trên đoạn [0; 2] bằng 4.",
          correct_answer: "a: Đúng, b: Đúng, c: Đúng, d: Đúng",
          explanation: "f'(x) = 3x^2 - 3 = 0 <=> x = +-1.\na) Đúng vì với x > 1 thì f'(x) > 0.\nb) Tại x = 1, y = 0, f''(1) = 6 > 0 nên (1; 0) là điểm cực tiểu.\nc) y_CD = f(-1) = 4, y_CT = f(1) = 0 => 3 nghiệm phân biệt khi 0 < m < 4.\nd) f(0) = 2, f(1) = 0, f(2) = 4 => Max [0; 2] = 4 tại x = 2.",
          difficulty: "medium",
        },
        {
          id: "q-toan-6",
          order: 6,
          type: "short_answer",
          content: "Để thiết kế một chiếc thùng rác hình trụ có nắp đậy với thể tích V = 54pi (dm^3). Bán kính đáy r (dm) bằng bao nhiêu để tiết kiệm vật liệu nhất (diện tích toàn phần nhỏ nhất)? (Kết quả viết dưới dạng số nguyên).",
          correct_answer: "3",
          explanation: "Stp = 2pi*r^2 + 2pi*r*h = 2pi*r^2 + 2V/r. Đạo hàm theo r: Stp' = 4pi*r - 2V/r^2 = 0 <=> r^3 = V / (2pi) = 54pi / (2pi) = 27 <=> r = 3 (dm).",
          difficulty: "hard",
        },
      ],
    },
  },
  {
    id: "mk-anh-12-002",
    seller_id: "seller-hoang-mai",
    seller_name: "Cô Hoàng Mai (IELTS 8.5)",
    seller_tier: "pro",
    title: "Bộ Đề Bứt Phá 9+ Tiếng Anh THPT 2025 - Chuyên Đề Collocations & Đọc Hiểu Chuyên Sâu",
    subject: "Tiếng Anh",
    grade: 12,
    description: "Tuyển tập đề thi phân loại điểm 9 và 10 môn Tiếng Anh cập nhật theo cấu trúc mới nhất. Đề tập trung vào hệ thống cụm từ cố định (Collocations), thành ngữ (Idioms) và bài đọc hiểu 8 câu chuyên sâu chủ đề Trí tuệ nhân tạo (AI), Môi trường và Kinh tế xanh. Có phân tích đáp án chi tiết và từ vựng mở rộng.",
    price_credits: 150, // 15.000đ
    question_count: 40,
    tags: ["ChuanMaTran2025", "TiengAnh12", "ButPha9Plus", "Collocations", "ReadingComprehension"],
    downloads_count: 512,
    rating: 5.0,
    review_count: 89,
    status: "published",
    created_at: "2026-10-22T08:30:00Z",
    preview_data: {
      matrix: {
        total_questions: 40,
        multiple_choice_count: 40,
        true_false_count: 0,
        short_answer_count: 0,
        difficulty_distribution: { easy: 10, medium: 14, hard: 12, very_hard: 4 },
        duration_minutes: 50,
      },
      sample_questions: [
        {
          id: "q-eng-1",
          order: 1,
          type: "multiple_choice",
          content: "Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation:\nA. decided  B. watched  C. looked  D. stopped",
          options: ["A. decided", "B. watched", "C. looked", "D. stopped"],
          difficulty: "easy",
        },
        {
          id: "q-eng-2",
          order: 2,
          type: "multiple_choice",
          content: "The local government has decided to _____ measures to reduce traffic congestion in the city center.",
          options: ["A. adopt", "B. adapt", "C. admit", "D. address"],
          difficulty: "medium",
        },
        {
          id: "q-eng-3",
          order: 3,
          type: "multiple_choice",
          content: "He was on the _____ of giving up when his mentor provided crucial guidance that changed his perspective.",
          options: ["A. verge", "B. rim", "C. edge", "D. border"],
          difficulty: "hard",
        },
      ],
    },
    exam_data: {
      questions: [
        {
          id: "q-eng-1",
          order: 1,
          type: "multiple_choice",
          content: "Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation:\nA. decided  B. watched  C. looked  D. stopped",
          options: ["A. decided", "B. watched", "C. looked", "D. stopped"],
          correct_answer: "A",
          explanation: "Phát âm đuôi '-ed': decided phát âm là /ɪd/, các từ còn lại phát âm là /t/ do kết thúc bằng âm vô thanh (/tʃ/, /k/, /p/).",
          difficulty: "easy",
        },
        {
          id: "q-eng-2",
          order: 2,
          type: "multiple_choice",
          content: "The local government has decided to _____ measures to reduce traffic congestion in the city center.",
          options: ["A. adopt", "B. adapt", "C. admit", "D. address"],
          correct_answer: "A",
          explanation: "Cụm cố định (Collocation): 'adopt measures' = áp dụng các biện pháp giải quyết vấn đề.",
          difficulty: "medium",
        },
        {
          id: "q-eng-3",
          order: 3,
          type: "multiple_choice",
          content: "He was on the _____ of giving up when his mentor provided crucial guidance that changed his perspective.",
          options: ["A. verge", "B. rim", "C. edge", "D. border"],
          correct_answer: "A",
          explanation: "Idiom: 'on the verge of doing sth' = suýt nữa / đang trên bờ vực từ bỏ.",
          difficulty: "hard",
        },
      ],
    },
  },
  {
    id: "mk-ly-12-003",
    seller_id: "seller-le-quang",
    seller_name: "Thầy Lê Quang",
    seller_tier: "pro",
    title: "Đề Kiểm Tra Giữa Kì 1 Vật Lí 12 - Chương 1: Vật Lí Nhiệt (Theo SGK Mới Kết Nối Tri Thức)",
    subject: "Vật lí",
    grade: 12,
    description: "Bộ đề bám sát chương trình GDPT 2018 Vật lí nhiệt: Nhiệt độ, thang nhiệt độ, nhiệt dung riêng, nhiệt nóng chảy riêng và định luật 1 nhiệt động lực học. Có bài tập đồ thị chuyển pha chất và thí nghiệm đo nhiệt lượng chính xác.",
    price_credits: 80, // 8.000đ
    question_count: 28,
    tags: ["VatLi12", "VatLiNhiet", "KetNoiTriThuc", "KiemTraGiuaKi", "CoLoiGiai"],
    downloads_count: 275,
    rating: 4.8,
    review_count: 36,
    status: "published",
    created_at: "2026-10-18T14:15:00Z",
    preview_data: {
      matrix: {
        total_questions: 28,
        multiple_choice_count: 18,
        true_false_count: 4,
        short_answer_count: 6,
        difficulty_distribution: { easy: 10, medium: 10, hard: 6, very_hard: 2 },
        duration_minutes: 50,
      },
      sample_questions: [
        {
          id: "q-phy-1",
          order: 1,
          type: "multiple_choice",
          content: "Đơn vị đo nhiệt độ trong hệ đo lường quốc tế SI là:",
          options: ["A. Kelvin (K)", "B. Độ Celsius (°C)", "C. Độ Fahrenheit (°F)", "D. Joule (J)"],
          difficulty: "easy",
        },
        {
          id: "q-phy-2",
          order: 2,
          type: "multiple_choice",
          content: "Công thức tính nhiệt lượng cung cấp để làm nóng chảy hoàn toàn một vật rắn có khối lượng m ở nhiệt độ nóng chảy là:",
          options: ["A. Q = lambda * m", "B. Q = m * c * Delta_T", "C. Q = L * m", "D. Q = m / lambda"],
          difficulty: "easy",
        },
        {
          id: "q-phy-3",
          order: 3,
          type: "short_answer",
          content: "Cung cấp nhiệt lượng 3000 J cho một khối khí trong xilanh làm khối khí giãn nở và thực hiện công 1800 J lên pít-tông. Độ biến thiên nội năng Delta_U của khối khí bằng bao nhiêu Joule?",
          difficulty: "medium",
        },
      ],
    },
    exam_data: {
      questions: [
        {
          id: "q-phy-1",
          order: 1,
          type: "multiple_choice",
          content: "Đơn vị đo nhiệt độ trong hệ đo lường quốc tế SI là:",
          options: ["A. Kelvin (K)", "B. Độ Celsius (°C)", "C. Độ Fahrenheit (°F)", "D. Joule (J)"],
          correct_answer: "A",
          explanation: "Trong hệ SI, đơn vị đo nhiệt độ cơ bản là Kelvin (K).",
          difficulty: "easy",
        },
        {
          id: "q-phy-2",
          order: 2,
          type: "multiple_choice",
          content: "Công thức tính nhiệt lượng cung cấp để làm nóng chảy hoàn toàn một vật rắn có khối lượng m ở nhiệt độ nóng chảy là:",
          options: ["A. Q = lambda * m", "B. Q = m * c * Delta_T", "C. Q = L * m", "D. Q = m / lambda"],
          correct_answer: "A",
          explanation: "Nhiệt nóng chảy: Q = lambda * m, trong đó lambda là nhiệt nóng chảy riêng (J/kg).",
          difficulty: "easy",
        },
        {
          id: "q-phy-3",
          order: 3,
          type: "short_answer",
          content: "Cung cấp nhiệt lượng 3000 J cho một khối khí trong xilanh làm khối khí giãn nở và thực hiện công 1800 J lên pít-tông. Độ biến thiên nội năng Delta_U của khối khí bằng bao nhiêu Joule?",
          correct_answer: "1200",
          explanation: "Theo định luật 1 NĐLH: Delta_U = Q + A. Vì chất khí nhận nhiệt lượng nên Q = +3000 J. Chất khí sinh công đẩy pít-tông nên A = -1800 J. Vậy Delta_U = 3000 - 1800 = 1200 J.",
          difficulty: "medium",
        },
      ],
    },
  },
  {
    id: "mk-hoa-12-004",
    seller_id: "seller-nguyen-thao",
    seller_name: "Cô Nguyễn Thảo (Chuyên Hóa)",
    seller_tier: "pro",
    title: "Đề Khảo Sát Chất Lượng Môn Hóa Học 12 - Chuyên Đề Este - Lipid & Xà Phòng Hóa",
    subject: "Hóa học",
    grade: 12,
    description: "Bộ đề bao quát đầy đủ lý thuyết Este no đơn hở, đồng phân hình học, phản ứng thủy phân trong môi trường kiềm và tính toán bài tập chất béo theo phương pháp đồng đẳng hóa & dồn chất hiện đại.",
    price_credits: 100, // 10.000đ
    question_count: 28,
    tags: ["HoaHoc12", "EsteLipid", "DonChat", "XepHinhDongDang", "DeChuyen"],
    downloads_count: 198,
    rating: 4.9,
    review_count: 27,
    status: "published",
    created_at: "2026-10-15T09:00:00Z",
    preview_data: {
      matrix: {
        total_questions: 28,
        multiple_choice_count: 18,
        true_false_count: 4,
        short_answer_count: 6,
        difficulty_distribution: { easy: 8, medium: 10, hard: 8, very_hard: 2 },
        duration_minutes: 50,
      },
      sample_questions: [
        {
          id: "q-chem-1",
          order: 1,
          type: "multiple_choice",
          content: "Hợp chất nào sau đây có mùi thơm đặc trưng của quả chuối chín?",
          options: ["A. Isoamyl axetat", "B. Etyl fomat", "C. Benzyl axetat", "D. Geranyl axetat"],
          difficulty: "easy",
        },
        {
          id: "q-chem-2",
          order: 2,
          type: "multiple_choice",
          content: "Xà phòng hóa hoàn toàn 8.8 gam etyl axetat bằng dung dịch NaOH vừa đủ, cô cạn dung dịch sau phản ứng thu được m gam muối khan. Giá trị của m là:",
          options: ["A. 8.2", "B. 6.8", "C. 9.6", "D. 7.4"],
          difficulty: "medium",
        },
      ],
    },
    exam_data: {
      questions: [
        {
          id: "q-chem-1",
          order: 1,
          type: "multiple_choice",
          content: "Hợp chất nào sau đây có mùi thơm đặc trưng của quả chuối chín?",
          options: ["A. Isoamyl axetat", "B. Etyl fomat", "C. Benzyl axetat", "D. Geranyl axetat"],
          correct_answer: "A",
          explanation: "Isoamyl axetat (CH3COOCH2CH2CH(CH3)2) có mùi chuối chín đặc trưng.",
          difficulty: "easy",
        },
        {
          id: "q-chem-2",
          order: 2,
          type: "multiple_choice",
          content: "Xà phòng hóa hoàn toàn 8.8 gam etyl axetat bằng dung dịch NaOH vừa đủ, cô cạn dung dịch sau phản ứng thu được m gam muối khan. Giá trị của m là:",
          options: ["A. 8.2", "B. 6.8", "C. 9.6", "D. 7.4"],
          correct_answer: "A",
          explanation: "n(CH3COOC2H5) = 8.8 / 88 = 0.1 mol. Muối tạo thành là CH3COONa: m = 0.1 * 82 = 8.2 gam.",
          difficulty: "medium",
        },
      ],
    },
  },
  {
    id: "mk-van-12-005",
    seller_id: "seller-pham-phuong",
    seller_name: "Cô Phạm Phương",
    seller_tier: "pro",
    title: "Đề Thi Thử Môn Ngữ Văn 12 - Định Dạng Đề Thi Tốt Nghiệp Mới 2025 (Ngữ Liệu Ngoài SGK)",
    subject: "Ngữ văn",
    grade: 12,
    description: "Bộ đề đổi mới phương pháp kiểm tra đánh giá môn Văn: 100% ngữ liệu Đọc hiểu và Nghị luận văn học nằm ngoài sách giáo khoa. Hướng dẫn chấm chi tiết biểu điểm từng ý sáng tạo và cách lập luận nghị luận xã hội.",
    price_credits: 50, // 5.000đ
    question_count: 5,
    tags: ["NguVan12", "DocHieuNgoaiSGK", "NghiLuanXaHoi", "Chuan2025"],
    downloads_count: 420,
    rating: 4.9,
    review_count: 65,
    status: "published",
    created_at: "2026-10-12T16:00:00Z",
    preview_data: {
      matrix: {
        total_questions: 5,
        multiple_choice_count: 0,
        true_false_count: 0,
        short_answer_count: 0,
        difficulty_distribution: { easy: 1, medium: 2, hard: 1, very_hard: 1 },
        duration_minutes: 120,
      },
      sample_questions: [
        {
          id: "q-lit-1",
          order: 1,
          type: "essay",
          content: "PHẦN I. ĐỌC HIỂU (4,0 điểm): Đọc đoạn trích từ tùy bút 'Sự im lặng của rừng' và xác định phương thức biểu đạt chính được sử dụng.",
          difficulty: "easy",
        },
        {
          id: "q-lit-2",
          order: 2,
          type: "essay",
          content: "Chỉ ra và phân tích tác dụng của biện pháp tu từ nhân hóa được tác giả sử dụng trong câu văn: 'Cây cối đứng thở trong sương mờ và kể cho nhau nghe câu chuyện ngàn năm của đất'.",
          difficulty: "medium",
        },
      ],
    },
    exam_data: {
      questions: [
        {
          id: "q-lit-1",
          order: 1,
          type: "essay",
          content: "PHẦN I. ĐỌC HIỂU (4,0 điểm): Đọc đoạn trích từ tùy bút 'Sự im lặng của rừng' và xác định phương thức biểu đạt chính được sử dụng.",
          correct_answer: "Phương thức biểu đạt chính: Nghị luận / Biểu cảm.",
          explanation: "Đoạn văn kết hợp suy ngẫm triết lý và bộc lộ cảm xúc sâu sắc trước thiên nhiên đất trời.",
          difficulty: "easy",
        },
        {
          id: "q-lit-2",
          order: 2,
          type: "essay",
          content: "Chỉ ra và phân tích tác dụng của biện pháp tu từ nhân hóa trong câu văn: 'Cây cối đứng thở trong sương mờ...'",
          correct_answer: "Biện pháp tu từ: Nhân hóa ('đứng thở', 'kể cho nhau nghe').",
          explanation: "Làm cho thế giới tự nhiên trở nên sống động, có linh hồn và đời sống nội tâm sâu thẳm, đồng thời thể hiện sự giao hòa trân quý giữa con người với rừng cây.",
          difficulty: "medium",
        },
      ],
    },
  },
  {
    id: "mk-toan-10-006",
    seller_id: "seller-do-tuan",
    seller_name: "Thầy Đỗ Tuấn",
    seller_tier: "free",
    title: "Đề Ôn Tập Giữa Học Kì 1 Toán 10 - Mệnh Đề, Tập Hợp & Bất Phương Trình Bậc Nhất Hai Ẩn",
    subject: "Toán",
    grade: 10,
    description: "Tài liệu miễn phí dành cho các em học sinh lớp 10 củng cố kiến thức đầu cấp THPT. Bao gồm các bài toán xác định tập con, giao hợp hiệu và biểu diễn miền nghiệm của hệ bất phương trình trên mặt phẳng tọa độ Oxy.",
    price_credits: 0, // Miễn phí 0 cr
    question_count: 25,
    tags: ["Toan10", "TapHop", "MenhDe", "Oxy", "MienPhi"],
    downloads_count: 890,
    rating: 4.8,
    review_count: 110,
    status: "published",
    created_at: "2026-10-10T11:00:00Z",
    preview_data: {
      matrix: {
        total_questions: 25,
        multiple_choice_count: 20,
        true_false_count: 2,
        short_answer_count: 3,
        difficulty_distribution: { easy: 15, medium: 8, hard: 2, very_hard: 0 },
        duration_minutes: 60,
      },
      sample_questions: [
        {
          id: "q-t10-1",
          order: 1,
          type: "multiple_choice",
          content: "Trong các câu sau, câu nào là mệnh đề toán học?",
          options: ["A. 15 là số nguyên tố.", "B. Hôm nay trời đẹp quá!", "C. Bạn đã làm bài tập chưa?", "D. Số x là số chẵn."],
          difficulty: "easy",
        },
        {
          id: "q-t10-2",
          order: 2,
          type: "multiple_choice",
          content: "Cho tập hợp A = {x in R | -2 <= x < 5}. Viết lại A dưới dạng khoảng, đoạn:",
          options: ["A. [-2; 5)", "B. (-2; 5]", "C. [-2; 5]", "D. (-2; 5)"],
          difficulty: "easy",
        },
      ],
    },
    exam_data: {
      questions: [
        {
          id: "q-t10-1",
          order: 1,
          type: "multiple_choice",
          content: "Trong các câu sau, câu nào là mệnh đề toán học?",
          options: ["A. 15 là số nguyên tố.", "B. Hôm nay trời đẹp quá!", "C. Bạn đã làm bài tập chưa?", "D. Số x là số chẵn."],
          correct_answer: "A",
          explanation: "'15 là số nguyên tố' là mệnh đề toán học (mệnh đề sai, vì 15 chia hết cho 3 và 5).",
          difficulty: "easy",
        },
        {
          id: "q-t10-2",
          order: 2,
          type: "multiple_choice",
          content: "Cho tập hợp A = {x in R | -2 <= x < 5}. Viết lại A dưới dạng khoảng, đoạn:",
          options: ["A. [-2; 5)", "B. (-2; 5]", "C. [-2; 5]", "D. (-2; 5)"],
          correct_answer: "A",
          explanation: "-2 <= x < 5 tương ứng với nửa khoảng [-2; 5).",
          difficulty: "easy",
        },
      ],
    },
  },
];

// ========================================================
// GLOBAL IN-MEMORY PERSISTENCE FOR MARKETPLACE
// ========================================================

declare global {
  // eslint-disable-next-line no-var
  var __marketplaceItems: Map<string, MarketplaceItem> | undefined;
  // eslint-disable-next-line no-var
  var __marketplacePurchases: MarketplacePurchase[] | undefined;
  // eslint-disable-next-line no-var
  var __payoutRequests: PayoutRequest[] | undefined;
}

if (!globalThis.__marketplaceItems) {
  globalThis.__marketplaceItems = new Map();
  INITIAL_MARKETPLACE_ITEMS.forEach((item) => {
    globalThis.__marketplaceItems!.set(item.id, item);
  });
}

if (!globalThis.__marketplacePurchases) {
  globalThis.__marketplacePurchases = [];
}

if (!globalThis.__payoutRequests) {
  globalThis.__payoutRequests = [
    {
      id: "payout-001",
      user_id: "seller-tran-nam",
      amount_credits: 3000,
      amount_vnd: 300000,
      bank_name: "MB Bank (Ngân hàng Quân Đội)",
      account_number: "0987654321",
      account_holder: "TRAN NAM",
      status: "completed",
      created_at: "2026-10-24T08:00:00Z",
      completed_at: "2026-10-24T09:30:00Z",
      note: "Đã chi trả thành công qua Napas 247",
    },
  ];
}

export const marketplaceItemsStore = globalThis.__marketplaceItems!;
export const marketplacePurchasesStore = globalThis.__marketplacePurchases!;
export const payoutRequestsStore = globalThis.__payoutRequests!;
