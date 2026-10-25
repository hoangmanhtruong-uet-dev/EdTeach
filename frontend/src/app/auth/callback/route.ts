import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Check forwarded host (Vercel deployment proxy)
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

        await (supabase.from("users") as any).upsert(
          {
            id: u.id,
            email: u.email || "",
            name: fullName,
            avatar_url: avatarUrl,
            referral_code: refCode,
            tier: "free",
            role: "teacher",
          },
          { onConflict: "id" }
        );

        await (supabase.from("wallets") as any).upsert(
          {
            user_id: u.id,
            balance: 100,
            daily_quota: 3,
            daily_quota_used: 0,
          },
          { onConflict: "user_id", ignoreDuplicates: true }
        );
      } catch (dbErr) {
        console.warn("User wallet sync on OAuth callback warning:", dbErr);
      }

      return NextResponse.redirect(`${redirectBase}${next}`);
    }
  }

  return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`);
}
