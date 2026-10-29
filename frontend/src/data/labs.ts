/**
 * Catalog phòng thí nghiệm 3D (nguồn: Tongjiang Lab — lab.tongjiang.app)
 *
 * Ghi nguồn bắt buộc (CC BY-NC 4.0):
 *   - Bài học / covers / catalog: Tongjiang Lab (© 2026 铜匠十点睡觉), CC BY-NC 4.0
 *   - Ba bài học, ảnh bìa, danh mục chỉ được dùng phi thương mại (không paywall, không quảng cáo).
 *   - File bài học gốc được host tĩnh tại /labs/courses/<slug>.html.
 *
 * lang:
 *   - "metadata"  → toàn bộ nội dung bên trong bài học vẫn tiếng Trung (dùng minh họa trên máy chiếu)
 *   - "full"      → bài đã việt hóa tệp bài học (xem scripts/labs/translate.mjs)
 */

export type LabSubject = "phys" | "chem" | "bio" | "geo";

export interface LabLesson {
  slug: string;
  subject: LabSubject;
  titleVi: string;
  /** Câu hỏi dẫn dắt đã việt hóa (chỉ có ở bài pilot; undefined = chưa dịch) */
  questionVi?: string;
  /** Vị trí trong GDPT 2018 (chuỗi tự mô tả) */
  gdpt?: string;
  steps: number;
  lang: "full" | "full";
}

export const SUBJECT_LABEL: Record<LabSubject, string> = {
  phys: "Vật lý",
  chem: "Hóa học",
  bio: "Sinh học",
  geo: "Địa lý",
};

export const SUBJECT_COLOR: Record<LabSubject, string> = {
  phys: "bg-indigo-100 text-indigo-700 border-indigo-200",
  chem: "bg-emerald-100 text-emerald-700 border-emerald-200",
  bio: "bg-rose-100 text-rose-700 border-rose-200",
  geo: "bg-amber-100 text-amber-700 border-amber-200",
};

export const LABS: LabLesson[] = [
  // ============================== VẬT LÝ (10) ==============================
  {
    slug: "photoelectric-step",
    subject: "phys",
    titleVi: "Hiệu ứng quang điện",
    questionVi:
      "Cùng một chùm sáng, tại sao đổi sang kim loại khác thì không đánh bật được electron nào? Năng lượng quang tử phụ thuộc vào đặc tính gì của ánh sáng?",
    gdpt: "Lý 12 — Quang học / thuyết lượng tử: hiện tượng quang điện",
    steps: 9,
    lang: "full",
  },
  {
    slug: "capacitor-step",
    subject: "phys",
    titleVi: "Thí nghiệm: Sạc và phóng điện của tụ điện",
        questionVi:
      "Tại sao điện áp trên tụ tăng theo đường cong chứ không tăng đều? Điện dung liên quan đến những đại lượng nào?",
    gdpt: "Lý 11 — Điện trường: tụ điện, tần số điện dung C",
    steps: 9,
    lang: "full",
  },
  {
    slug: "accel-force-step",
    subject: "phys",
    titleVi: "Thí nghiệm: Khảo sát mối liên hệ giữa gia tốc với lực, khối lượng",
        questionVi:
      "Lực tăng gấp đôi thì gia tốc thay đổi thế nào? Khối lượng tăng gấp đôi thì gia tốc thay đổi thế nào?",
    gdpt: "Lý 10 — Lực và chuyển động: Định luật II Newton ( thí nghiệm bài 21/tương tự)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "energy-step",
    subject: "phys",
    titleVi: "Thí nghiệm: Kiểm chứng định luật bảo toàn cơ năng",
        questionVi:
      "Thế năng giảm bao nhiêu thì động năng tăng bấy nhiêu — điều đó có thực sự đúng không?",
    gdpt: "Lý 10 — Cơ năng: bảo toàn cơ năng (thí nghiệm)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "projectile-step",
    subject: "phys",
    titleVi: "Thí nghiệm: Làm rõ chuyển động ném ngang",
        questionVi:
      "Vật ném ngang và vật rơi tự do — cái nào chạm đất trước? Tại sao?",
    gdpt: "Lý 10 — Chuyển động ném ngang (thí nghiệm)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "centripetal-step",
    subject: "phys",
    titleVi: "Thí nghiệm: Lực hướng tâm với bán kính, vận tốc góc, khối lượng",
        questionVi:
      "Khi quay nhanh hơn, cần kéo mạnh hơn bao nhiêu? Bán kính tăng gấp đôi thì lực hướng tâm thay đổi thế nào?",
    gdpt: "Lý 10 — Chuyển động tròn đều, lực hướng tâm (thí nghiệm)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "self-induction-step",
    subject: "phys",
    titleVi: "Hiện tượng tự cảm và dòng điện Foucault",
        questionVi:
      "Tại sao cuộn dây cản lại sự thay đổi dòng điện? Dòng Foucault gây ra hiệu ứng gì?",
    gdpt: "Lý 11 — Điện từ cảm ứng: hiện tượng tự cảm, dòng điện xuôi (Foucault)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "emf-step",
    subject: "phys",
    titleVi: "Thí nghiệm: Đo suất điện động và điện trở trong của nguồn",
        questionVi:
      "Điện áp đo được luôn nhỏ hơn suất điện động — tại sao? Làm thế nào đo được chính xác suất điện động thực?",
    gdpt: "Lý 11 — Dòng điện không đổi: suất điện động E, điện trở trong r",
    steps: 9,
    lang: "full",
  },
  {
    slug: "current-field-step",
    subject: "phys",
    titleVi: "Từ trường của dòng điện từ (cường độ, đường sức)",
        questionVi:
      "Từ trường vô hình — làm thế nào để vẽ ra nó? Và làm sao xác định chiều của nó?",
    gdpt: "Lý 11 — Từ trường: định luật Biô-Sa-vác, lực Loren (tiếp cận dòng điện thẳng)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "brownian-step",
    subject: "phys",
    titleVi: "Chuyển động Brown và sự khuếch tán",
        questionVi:
      "Phân tử vô hình — căn cứ vào đâu để nói nó chuyển động hỗn loạn?",
    gdpt: "Lý 11 — Chuyển động nhiệt của các hạt cấu tạo nên chất (thuyết động chất khí)",
    steps: 9,
    lang: "full",
  },

  // ============================== HÓA HỌC (25) ==============================
  {
    slug: "haber-step",
    subject: "chem",
    titleVi: "Chế tạo amoniac công nghiệp (phương pháp Haber – Bosch)",
        questionVi:
      "Làm thế nào biến nitơ trong không khí thành amoniac một cách nhanh, nhiều và tiết kiệm nhất?",
    gdpt: "Hóa 12 — Dung dịch, sự chuyển hóa tương tác hoá học giữa các chất: NH3",
    steps: 7,
    lang: "full",
  },
  {
    slug: "rate-step",
    subject: "chem",
    titleVi: "Các yếu tố ảnh hưởng đến tốc độ phản ứng",
        questionVi:
      "Cùng hai phản ứng — tại sao cái thì vài giây là xong, cái thì chờ cả nửa ngày? Nhanh chậm do đâu quyết định?",
    gdpt: "Hóa 11 — Tốc độ phản ứng hoá học (nồng độ, nhiệt độ, tác nhân xúc tác)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "ball-stick-step",
    subject: "chem",
    titleVi: "Mô hình phân tử hữu cơ bằng thanh đạn/bóng",
        questionVi:
      "Công thức phân tử vẽ trên giấy là phẳng — hình dạng 3D thật sự trông như thế nào?",
    gdpt: "Hóa 11 — Hóa học hữu cơ: cấu trúc phân tử (CH4, C2H6, gigdan...)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "titration-step",
    subject: "chem",
    titleVi: "Chuẩn độ axit – baza mạnh (chấm dừng pha lửa)",
    questionVi:
      "Đã nhỏ hơn 20 mL mà màu gần như không đổi, tại sao chỉ cần thêm nửa giọt cuối cùng là loảng cả bình (màu cột) lại lấp loáng?",
    gdpt: "Hóa 11 — Bazo – axit: chuẩn độ trung hòa (thí nghiệm)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "chlorine-step",
    subject: "chem",
    titleVi: "Chuẩn bị (điều chế) và tính chất của clo",
        questionVi:
      "Muốn có một bình clo khô, sạch — mỗi đoạn trong thiết bị làm nhiệm vụ gì? Thiếu một đoạn sẽ ra sao?",
    gdpt: "Hóa 10 — Kim loại kiềm – kiềm thổ / halogen: clo Cl2",
    steps: 9,
    lang: "full",
  },
  {
    slug: "blast-furnace-step",
    subject: "chem",
    titleVi: "Sa tinh (nấu) sắt trong lò cao",
        questionVi:
      "Một đống quặng đổ từ đỉnh lò xuống — làm thế nào vài giờ sau lại thành dòng gang lỏng, lại còn càng tiết kiệm càng tốt?",
    gdpt: "Hóa 10 — Sắt, đồng: luyện kim lò phản ứng (lò cao)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "smelting-step",
    subject: "chem",
    titleVi: "Nón chế kim (luyện) kim loại: điện phân nóng chảy và phản ứng nhiệt nhôm",
        questionVi:
      "Cùng là luyện kim — tại sao nhôm phải dùng điện phân nóng chảy còn đồng lại dùng điện phân dung dịch?",
    gdpt: "Hóa 10 — Luyện kim: điện phân nóng chảy, nhiệt nhôm thermit",
    steps: 8,
    lang: "full",
  },
  {
    slug: "coal-gas-step",
    subject: "chem",
    titleVi: "Chế biến (nhà máy) than: hơi than (khí hóa than)",
        questionVi:
      "Than rắn được chuyển thành khí như thế nào? Sản phẩm khí gồm những gì?",
steps: 8,
    lang: "full",
  },
  {
    slug: "sulfuric-step",
    subject: "chem",
    titleVi: "Chế tạo axit sulfuric bằng phương pháp tiếp xúc",
        questionVi:
      "Tại sao không hấp thụ SO₃ trực tiếp vào nước mà lại dùng axit sulfuric đặc?",
    gdpt: "Hóa 11 — Nhóm VA: lưu huỳnh, H2SO4 công nghiệp",
    steps: 7,
    lang: "full",
  },
  {
    slug: "hydrolysis-step",
    subject: "chem",
    titleVi: "Thủy phân muối và các ứng dụng của nó",
        questionVi:
      "Tại sao dung dịch muối lại có thể có tính axit hoặc bazơ? Quy tắc nào xác định điều đó?",
    gdpt: "Hóa 11 — Điện ly: thủy phân muối",
    steps: 9,
    lang: "full",
  },
  {
    slug: "cement-step",
    subject: "chem",
    titleVi: "Sản xuất xi măng công nghiệp",
        questionVi:
      "Xi măng cứng lại khi tiếp xúc nước — phản ứng gì đang xảy ra trong đó?",
steps: 8,
    lang: "full",
  },
  {
    slug: "iron-step",
    subject: "chem",
    titleVi: "Sắt và hợp chất của sắt: chuyển hóa +2 ↔ +3 chất",
        questionVi:
      "Sắt có thể tồn tại ở trạng thái +2 và +3 — điều gì quyết định trạng thái nào ổn định hơn?",
    gdpt: "Hóa 10 — Sắt và một số hợp chất quan trọng của sắt",
    steps: 9,
    lang: "full",
  },
  {
    slug: "electrolysis-step",
    subject: "chem",
    titleVi: "Nguyên tắc điện phân: dung dịch CuCl2 và nước muối bão hòa NaCl",
        questionVi:
      "Dùng điện để tách hợp chất — sản phẩm ở hai điện cực lần lượt là gì? Tại sao lại không phải chất khác?",
    gdpt: "Hóa 11 — Điện phân (dung dịch CuCl2, NaCl bão hòa)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "ammonia-step",
    subject: "chem",
    titleVi: "Chuẩn bị amoniac và tính chất của nó (thí nghiệm phun suối)",
        questionVi:
      "Tại sao khi mở van, nước phun ngược vào bình như một vòi phun — amoniac đã làm gì với không khí bên trong?",
    gdpt: "Hóa 11 — Nhóm VA: NH3 và muối amon",
    steps: 9,
    lang: "full",
  },
  {
    slug: "equilibrium-step",
    subject: "chem",
    titleVi: "Thí nghiệm: Các yếu tố làm cân bằng hoá học dịch chuyển",
        questionVi:
      "Khi thay đổi nồng độ, nhiệt độ hay áp suất — cân bằng dịch chuyển về phía nào? Nguyên lý Le Chatelier nói gì?",
    gdpt: "Hóa 11 — Vận tốc, cân bằng hoá học (Nguyên lý Le Chatelier)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "flame-step",
    subject: "chem",
    titleVi: "Thí nghiệm màu lửa và quang phổ nguyên tử",
        questionVi:
      "Mỗi kim loại cho ra màu ngọn lửa riêng — nguồn gốc của những màu đặc trưng đó là gì?",
    gdpt: "Hóa 10 — Kim loại kiềm (màu lửa Na, K); quang phổ (mở rộng kiến thức)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "galvanic-step",
    subject: "chem",
    titleVi: "Pin Galvani: hai trường điện phân (từ một tới hai)",
        questionVi:
      "Tại sao nhúng kẽm vào axit thì sủi bọt, nhưng ghép thêm đồng thì dòng điện lại chạy mạnh hơn?",
    gdpt: "Hóa 11/12 — Hóa năng → điện năng: pin Galvani",
    steps: 9,
    lang: "full",
  },
  {
    slug: "conductivity-step",
    subject: "chem",
    titleVi: "Sự điện li, tình chất dẫn điện của dung dịch và tương tác ion",
        questionVi:
      "Nước cất không dẫn điện, nhưng thêm NaCl vào thì đèn sáng — vì sao? Độ sáng liên quan đến gì?",
    gdpt: "Hóa 11 — Sự điện li: chất điện li mạnh / yếu",
    steps: 9,
    lang: "full",
  },
  {
    slug: "nitric-lab-step",
    subject: "chem",
    titleVi: "Tính chất của axit nitric đậm đặc và loãng, các Nitơ oxy hóa",
        questionVi:
      "Cùng là HNO₃ — tại sao đặc thì phản ứng với đồng cho NO₂ còn loãng lại cho NO?",
    gdpt: "Hóa 11 — Nhóm VA: Nitơ, HNO3",
    steps: 9,
    lang: "full",
  },
  {
    slug: "bromine-step",
    subject: "chem",
    titleVi: "Lấy brom từ nước biển: phương pháp thổi hơi (pholate) không khí",
        questionVi:
      "Nước biển chứa Br⁻ với nồng độ rất thấp — làm thế nào thu hồi đủ brom để dùng công nghiệp?",
steps: 7,
    lang: "full",
  },
  {
    slug: "sodium-step",
    subject: "chem",
    titleVi: "Tính chất của natri (và cách xử lý khi natri (Na) bị cháy)",
        questionVi:
      "Na cháy trong không khí và phản ứng mãnh liệt với nước — vì sao lại nguy hiểm đến vậy? Nếu Na bốc cháy thì xử lý thế nào?",
    gdpt: "Hóa 10 — Kim loại kiềm: Na và hợp chất",
    steps: 9,
    lang: "full",
  },
  {
    slug: "sulfur-step",
    subject: "chem",
    titleVi: "Lưu huỳnh, SO2 và axit sulfuric đậm đặc, hợp chất các dạng oxít của sunphua",
        questionVi:
      "SO₂ vừa có tính oxi hóa vừa có tính khử — điều gì quyết định vai trò nào trong mỗi phản ứng?",
    gdpt: "Hóa 11 — Nhóm VA: Lưu huỳnh và oxit, acid",
    steps: 9,
    lang: "full",
  },
  {
    slug: "corrosion-step",
    subject: "chem",
    titleVi: "Thí nghiệm: Ăn mòn oxy và thiết kế túi sưởi ấm",
        questionVi:
      "Sắt gỉ là quá trình rất chậm — tại sao có thể dùng nó tạo ra túi sưởi nóng đến 45°C? Và ngược lại, làm sao dùng nó để bảo vệ sắt?",
steps: 9,
    lang: "full",
  },
  {
    slug: "chlor-alkali-step",
    subject: "chem",
    titleVi: "Công nghiệp Chlor–Alcali (điện phân nước muối NaCl)",
        questionVi:
      "Cùng một lượng điện — làm thế nào lấy được nhiều NaOH hơn, ít điện hao hơn mà vẫn an toàn?",
    gdpt: "Hóa 11 — Điện phân dung dịch NaCl bão hòa có màng (theo thiết bị công nghiệp)",
    steps: 8,
    lang: "full",
  },
  {
    slug: "hou-soda-step",
    subject: "chem",
    titleVi: "Phương pháp Sơ Đá của Ho (Hou — sản xuất Na2CO3)",
        questionVi:
      "Làm thế nào dùng muối ăn và amoniac để làm ra soda — lại còn lấy thêm được phân đạm?",
    gdpt: "Hóa 10 — Kim loại kiềm: Na2CO3 (mở rộng)",
    steps: 8,
    lang: "full",
  },

  // ============================== SINH HỌC (5) ==============================
  {
    slug: "plasmolysis-step",
    subject: "bio",
    titleVi: "Cách tế bào thực vật hút nước và mất nước",
    questionVi:
      "Rau ngâm vào nước lại giòn trở lại, nhưng rắc muối lên rau lại rỉ nước — tế bào thực vật hút/mất nước theo cơ chế nào?",
    gdpt: "Sinh 10 — Chương transport (Quá trình trao đổi chất) chế độ chủ động/thụ động",
    steps: 8,
    lang: "full",
  },
  {
    slug: "transport-step",
    subject: "bio",
    titleVi: "Vận chuyển các chất xuyên màng tế bào",
        questionVi:
      "Các chất đi qua màng theo những con đường nào? Chủ động hay thụ động — khác nhau ở điểm gì?",
    gdpt: "Sinh 10 — Trao đổi chất và vật chất qua màng sinh chất",
    steps: 8,
    lang: "full",
  },
  {
    slug: "impulse-step",
    subject: "bio",
    titleVi: "Sự phát sinh và dẫn truyền xung thần kinh",
        questionVi:
      "Xung thần kinh là gì? Nó được tạo ra và truyền đi theo cơ chế nào trên sợi thần kinh?",
    gdpt: "Sinh 11 — Tiết và điều hòa nội môi (nội velit): hệ thần kinh",
    steps: 9,
    lang: "full",
  },
  {
    slug: "mitosis-step",
    subject: "bio",
    titleVi: "Quan sát nguyên phân trong tế bào phân sinh ở đầu rễ (tế bào góc trái đỉnh rễ củ)",
        questionVi:
      "Tế bào phân chia như thế nào để mỗi tế bào con có đủ bộ nhiễm sắc thể như tế bào mẹ?",
    gdpt: "Sinh 10 — Sự sinh sản và sinh trưởng phát triển: nguyên phân (thí nghiệm)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "enzyme-step",
    subject: "bio",
    titleVi: "Các điều kiện ảnh hưởng đến hoạt độ của enzym",
        questionVi:
      "Cùng một enzyme — tại sao cho vào nước sôi thì không còn hoạt động được, nhưng cho vào nước đá thì sau khi ấm lại vẫn hoạt động được?",
    gdpt: "Sinh 10 — Enzim (men) và chức năng dá nhiệm vị; nhiệt độ, độ pH",
    steps: 8,
    lang: "full",
  },

  // ============================== ĐỊA LÝ (14) ==============================
  {
    slug: "river-step",
    subject: "geo",
    titleVi: "Sự phát triển của địa hình sông",
        questionVi:
      "Tại sao bờ sông đoạn Trấn Giang liên tục dịch chuyển về phía bắc qua các năm?",
    gdpt: "Địa 10 — Nước và môi trường: địa hình do nước chảy tạo",
    steps: 8,
    lang: "full",
  },
  {
    slug: "insolation-step",
    subject: "geo",
    titleVi: "Chuyển động của điểm qua thẳng mặt trời: bốn mùa và năm đới khí hậu",
        questionVi:
      "Độ cao Mặt Trời giữa trưa và hướng Mặt Trời tại vị trí trường em thay đổi có quy luật gì trong năm?",
steps: 9,
    lang: "full",
  },
  {
    slug: "currents-step",
    subject: "geo",
    titleVi: "Dòng hải lưu của thế giới: mẫu hình và ảnh hưởng",
        questionVi:
      "Dòng hải lưu di chuyển theo những mẫu hình nào? Chúng ảnh hưởng thế nào đến khí hậu?",
    gdpt: "Địa 10 — Vòng tuần hoàn nước trên thế giới (hải lưu)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "enso-step",
    subject: "geo",
    titleVi: "Sự tương tác giữa đại dương – khí quyển: El Niño và La Niña",
        questionVi:
      "El Niño gây ra những thay đổi gì cho thời tiết toàn cầu? Tại sao nó lại ảnh hưởng đến cả những vùng xa xôi?",
    gdpt: "Địa 11/12 — Sự tương tác Khí quyển – thủy quyển, El Niño",
    steps: 7,
    lang: "full",
  },
  {
    slug: "heating-step",
    subject: "geo",
    titleVi: "Quá trình bầu khí quyển nóng lên",
        questionVi:
      "Tại sao đất nóng lên và nguội đi nhanh hơn nước biển? Điều đó tạo ra gió theo cơ chế nào?",
    gdpt: "Địa 10 — Địa lí khí quyển: quá trình chiếu xạ, hiệu ứng nhà kính",
    steps: 9,
    lang: "full",
  },
  {
    slug: "karst-step",
    subject: "geo",
    titleVi: "Hình thành và nhận diện địa hình karst",
    questionVi:
      "Xuân Hà Khách viết 'những đỉnh nhọn mọc từ lòng đất' — những chóp đá này được hình thành từ loại đá nào, bằng quá trình nào?",
    gdpt: "Địa 10 — Địa hình cacxtơ (karst) — hiểu rõ tại Việt Nam (Phong Nha, Hàm Giang...)",
    steps: 7,
    lang: "full",
  },
  {
    slug: "carbon-step",
    subject: "geo",
    titleVi: "Biến đổi khí hậu toàn cầu và an ninh quốc gia",
        questionVi:
      "Lượng CO₂ tăng gây ra những tác động gì? Cần làm gì để giảm thiểu?",
    gdpt: "Địa 11/12 — Rừng, môi trường, biến đổi khí hậu",
    steps: 8,
    lang: "full",
  },
  {
    slug: "tectonic-step",
    subject: "geo",
    titleVi: "Sự hình thành của các dạng địa hình kiến tạo",
        questionVi:
      "Núi, cao nguyên, thung lũng — những địa hình khổng lồ này hình thành như thế nào?",
steps: 6,
    lang: "full",
  },
  {
    slug: "earth-motion-step",
    subject: "geo",
    titleVi: "Ý nghĩa địa lý của sự chuyển động của Trái Đất",
        questionVi:
      "Trái Đất tự quay và quay quanh Mặt Trời — hai chuyển động này tạo ra những hiện tượng địa lý nào?",
    gdpt: "Địa 10 — Trái Đất tự chuyển động quanh mặt trời (tự chuyển động chung quanh và ô-que)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "soil-step",
    subject: "geo",
    titleVi: "Các yếu tố hình thành đất và quan sát cấu trúc phân tầng đất",
        questionVi:
      "Đất hình thành từ đá mẹ qua quá trình nào? Tại sao đất ở các vùng khác nhau lại có màu sắc và tầng khác nhau?",
    gdpt: "Địa 10 — Quá trình tạo ra đất, thành phần chủ yếu đất",
    steps: 8,
    lang: "full",
  },
  {
    slug: "thermal-step",
    subject: "geo",
    titleVi: "Vòng tuần hoàn nhiệt (luồng đối lưu khí cục bộ)",
    questionVi:
      "Tại sao gió ở hai bên eo biển Đài Loan đảo chiều trên dưới theo ngày — chứ không held thẳng một hướng suốt ngày?",
    gdpt: "Địa 10 — Gió, luồng khí quyển địa phương (gió biển–đất, gió núi–thung lũng)",
    steps: 9,
    lang: "full",
  },
  {
    slug: "wind-step",
    subject: "geo",
    titleVi: "Chuyển động ngang của khí quyển — Gió",
        questionVi:
      "Trên bản đồ thời tiết, tại sao gió không thổi thẳng từ áp cao sang áp thấp?",
    gdpt: "Địa 10 — Địa lí khí quyển: gió, sự chuyển động ngang",
    steps: 8,
    lang: "full",
  },
  {
    slug: "water-cycle-step",
    subject: "geo",
    titleVi: "Chu trình nước và ý nghĩa địa lý của nó",
    questionVi: "Sông ngòi ngày đêm đổ ra biển, tại sao nước biển không bao giờ cạn dần?",
    gdpt: "Địa 10 — Nước trên Trái Đất: chu trình nước",
    steps: 9,
    lang: "full",
  },
  {
    slug: "circulation-step",
    subject: "geo",
    titleVi: "Đới khí áp, đới gió và ba vòng tuần hoàn khí quyển",
        questionVi:
      "Đoàn thám hiểm Magellan — tại sao có chặng thuận gió, có chặng ngược gió, lại có vùng 30°N/S gần như không gió?",
    gdpt: "Địa 10 — Địa lí khí quyển: phân bố khí áp và gió trên Trái Đất",
    steps: 7,
    lang: "full",
  },
];

export function getLab(slug: string): LabLesson | undefined {
  return LABS.find((l) => l.slug === slug);
}

export function labsBySubject(subject: LabSubject): LabLesson[] {
  return LABS.filter((l) => l.subject === subject);
}

/** Đường dẫn file bài học tĩnh trong /public */
export const FREE_TRIAL_LABS: Record<LabSubject, string> = {
  phys: "photoelectric-step",
  chem: "haber-step",
  bio: "plasmolysis-step",
  geo: "river-step",
};

export function isLabFreeTrial(slug: string): boolean {
  return Object.values(FREE_TRIAL_LABS).includes(slug);
}

export function labFileUrl(slug: string): string {
  return `/labs/courses/${slug}.html`;
}

export function labCoverUrl(slug: string): string {
  return `/labs/covers/${slug}.webp`;
}
