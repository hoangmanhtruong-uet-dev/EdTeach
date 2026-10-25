import Link from "next/link";
import {
  Sparkles,
  FileText,
  Shield,
  Zap,
  Users,
  BarChart3,
  ArrowRight,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const features = [
  {
    icon: Sparkles,
    title: "Tạo đề thi bằng AI",
    description:
      "Chỉ cần nhập chủ đề, môn học và mức độ — AI sẽ tự động sinh câu hỏi chất lượng cao trong vài giây.",
  },
  {
    icon: Shield,
    title: "Kiểm duyệt tự động",
    description:
      "Agent Verifier kiểm tra đáp án, loại bỏ câu trùng lặp và đảm bảo chất lượng trước khi giao đề.",
  },
  {
    icon: FileText,
    title: "Xuất PDF & DOCX",
    description:
      "Xuất đề thi đúng định dạng chuẩn của Bộ GD&ĐT, sẵn sàng in ấn và phát cho học sinh.",
  },
  {
    icon: Zap,
    title: "Tối ưu chi phí",
    description:
      "Hệ thống LLM Router thông minh tự chọn model phù hợp, giúp tiết kiệm tới 80% chi phí API.",
  },
  {
    icon: Users,
    title: "Ngân hàng câu hỏi",
    description:
      "Lưu trữ, tìm kiếm và tái sử dụng câu hỏi theo môn học, chương, mức độ nhận thức Bloom.",
  },
  {
    icon: BarChart3,
    title: "Thống kê & phân tích",
    description:
      "Theo dõi lịch sử tạo đề, phân tích phân bố độ khó và đánh giá chất lượng câu hỏi.",
  },
];

const pricingPlans = [
  {
    name: "Miễn phí",
    price: "0₫",
    period: "/tháng",
    description: "Dùng thử tất cả tính năng",
    credits: "50 credits/tháng",
    features: [
      "Tạo đề thi cơ bản",
      "Tối đa 5 đề/tháng",
      "Xuất PDF",
      "Hỗ trợ qua email",
    ],
    cta: "Bắt đầu miễn phí",
    highlighted: false,
  },
  {
    name: "Giáo viên",
    price: "99.000₫",
    period: "/tháng",
    description: "Cho giáo viên cá nhân",
    credits: "500 credits/tháng",
    features: [
      "Tạo đề không giới hạn",
      "Kiểm duyệt AI nâng cao",
      "Xuất PDF & DOCX",
      "Ngân hàng câu hỏi",
      "Hỗ trợ ưu tiên",
    ],
    cta: "Chọn gói này",
    highlighted: true,
  },
  {
    name: "Trường học",
    price: "Liên hệ",
    period: "",
    description: "Cho tổ chức giáo dục",
    credits: "Credits tùy chỉnh",
    features: [
      "Tất cả tính năng Giáo viên",
      "Quản lý nhiều tài khoản",
      "API tích hợp LMS",
      "Báo cáo tổng hợp",
      "Hỗ trợ chuyên biệt",
    ],
    cta: "Liên hệ tư vấn",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ebf3fb]">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 to-background" />
          <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Powered by AI
              </span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Tạo đề thi chuyên nghiệp
                <br />
                <span className="text-primary">chỉ trong vài giây</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                EduTest AI giúp giáo viên Việt Nam tạo đề thi trắc nghiệm và tự luận chất lượng cao,
                tiết kiệm hàng giờ soạn đề mỗi tuần.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  Dùng thử miễn phí
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex h-11 items-center rounded-lg border border-border px-6 text-sm font-semibold transition-colors hover:bg-secondary"
                >
                  Tìm hiểu thêm
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Không cần thẻ tín dụng • 50 credits miễn phí
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Mọi thứ bạn cần để tạo đề thi
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Công cụ toàn diện được thiết kế riêng cho giáo viên Việt Nam
              </p>
            </div>
            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Đơn giản chỉ 3 bước
              </h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Nhập yêu cầu",
                  desc: "Chọn môn học, chương, mức độ và số lượng câu hỏi bạn cần.",
                },
                {
                  step: "2",
                  title: "AI tạo & kiểm duyệt",
                  desc: "Hệ thống đa agent sinh câu hỏi và tự động kiểm tra chất lượng.",
                },
                {
                  step: "3",
                  title: "Tải về & sử dụng",
                  desc: "Xem trước, chỉnh sửa nếu cần, rồi xuất đề thi định dạng chuẩn.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Bảng giá đơn giản, minh bạch
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Chọn gói phù hợp với nhu cầu của bạn
              </p>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-xl border p-6 ${
                    plan.highlighted
                      ? "border-primary bg-card shadow-lg ring-1 ring-primary"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      Phổ biến nhất
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-primary">{plan.credits}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border hover:bg-secondary"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-accent/30 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Sẵn sàng tiết kiệm thời gian soạn đề?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tham gia cùng hàng nghìn giáo viên đang sử dụng EduTest AI mỗi ngày.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Bắt đầu ngay — Miễn phí
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}