import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // BẢO MẬT: Chống Open Redirect - Đảm bảo next là đường dẫn tương đối an toàn
  let safeNext = "/dashboard";
  const rawNext = searchParams.get("next");
  if (
    rawNext &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.startsWith("/\\") &&
    !rawNext.includes(":") &&
    !rawNext.includes("@")
  ) {
    safeNext = rawNext;
  }

  // Kiểm tra host ủy quyền từ reverse proxy Vercel
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const redirectBase = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      // Đảm bảo user có bản ghi trong public.users và public.wallets ngay lập tức
      try {
        const u = data.user;
        const refCode = "EDU" + u.id.replace(/-/g, "").slice(0, 5).toUpperCase();
        const fullName =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "Thầy Cô";
        const avatarUrl = u.user_metadata?.avatar_url || u.user_metadata?.picture || "";

        // Kiểm tra xem user đã tồn tại trước đó chưa
        const { data: existingUser } = await (supabase.from("users") as any)
          .select("id, referred_by")
          .eq("id", u.id)
          .maybeSingle();

        // Kiểm tra mã giới thiệu lưu trong cookie từ link mời ?ref=...
        const cookieStore = await cookies();
        const refCodeFromCookie = cookieStore.get("eduteach_referral_code")?.value?.trim().toUpperCase();
        let inviterUser: any = null;
        let bonusCredits = 0;

        if (refCodeFromCookie && (!existingUser || !existingUser.referred_by)) {
          const { data: foundInviter } = await (supabase.from("users") as any)
            .select("id, name")
            .eq("referral_code", refCodeFromCookie)
            .maybeSingle();
          if (foundInviter && foundInviter.id !== u.id) {
            inviterUser = foundInviter;
            bonusCredits = 2000;
          }
        }

        await (supabase.from("users") as any).upsert(
          {
            id: u.id,
            email: u.email || "",
            name: fullName,
            avatar_url: avatarUrl,
            referral_code: refCode,
            referred_by: inviterUser ? inviterUser.id : (existingUser?.referred_by || null),
            tier: "free",
            role: "teacher",
          },
          { onConflict: "id" }
        );

        // Khởi tạo ví: Mặc định 5000 credits, nếu có giới thiệu thì +2000 credits = 7000 credits
        const startingBalance = 5000 + bonusCredits;
        const { data: newWallet } = await (supabase.from("wallets") as any).upsert(
          {
            user_id: u.id,
            balance: startingBalance,
            daily_quota: 3,
            daily_quota_used: 0,
          },
          { onConflict: "user_id", ignoreDuplicates: true }
        ).select("id").maybeSingle();

        // Nếu người dùng mới đăng ký qua link giới thiệu, xử lý trả thưởng cho cả 2
        if (inviterUser && bonusCredits > 0) {
          try {
            // 1. Lưu bản ghi referrals
            await (supabase.from("referrals") as any).insert({
              inviter_id: inviterUser.id,
              invitee_id: u.id,
              reward_credits: bonusCredits,
            });

            // 2. Thưởng +2000 credits cho Người mời (Inviter)
            const { data: inviterWallet } = await (supabase.from("wallets") as any)
              .select("id, balance")
              .eq("user_id", inviterUser.id)
              .maybeSingle();

            if (inviterWallet) {
              await (supabase.from("wallets") as any)
                .update({ balance: (inviterWallet.balance || 0) + bonusCredits })
                .eq("id", inviterWallet.id);

              await (supabase.from("wallet_txns") as any).insert({
                wallet_id: inviterWallet.id,
                amount: bonusCredits,
                type: "signup_bonus",
                description: `Thưởng giới thiệu đồng nghiệp (${fullName}) đăng ký thành công (+2.000 credits)`,
              });
            }

            // 3. Ghi transaction cho người được mời
            if (newWallet) {
              await (supabase.from("wallet_txns") as any).insert({
                wallet_id: newWallet.id,
                amount: bonusCredits,
                type: "signup_bonus",
                description: `Thưởng đăng ký từ link giới thiệu của đồng nghiệp (${inviterUser.name || "Đồng nghiệp"}) (+2.000 credits)`,
              });
            }
          } catch (referralErr) {
            console.warn("Process referral reward error:", referralErr);
          }
        }
      } catch (dbErr) {
        console.warn("User wallet sync on OAuth callback warning:", dbErr);
      }

      const response = NextResponse.redirect(`${redirectBase}${safeNext}`);
      // Xoá cookie referral sau khi đã sử dụng
      response.cookies.delete("eduteach_referral_code");
      return response;
    }
  }

  return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`);
}
