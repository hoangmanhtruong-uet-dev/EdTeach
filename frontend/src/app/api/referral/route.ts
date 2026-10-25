import { NextRequest, NextResponse, connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Lấy thông tin mã giới thiệu và số người đã mời
export async function GET(req: NextRequest) {
  await connection();
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { data: profile } = await (supabase.from("users") as any)
      .select("referral_code, referred_by")
      .eq("id", user.id)
      .single();

    // Đếm số người đã mời thành công
    const { count: totalReferrals } = await (supabase.from("referrals") as any)
      .select("id", { count: "exact" })
      .eq("inviter_id", user.id);

    return NextResponse.json({
      referral_code: profile?.referral_code || "EDU" + user.id.slice(0, 5).toUpperCase(),
      total_referrals: totalReferrals || 0,
      reward_per_referral: 3, // 3 đề miễn phí (+60 credits)
      has_been_referred: !!profile?.referred_by,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Nhập mã giới thiệu của đồng nghiệp để cả hai cùng nhận +3 đề
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const { referral_code } = body;

    if (!referral_code || typeof referral_code !== "string") {
      return NextResponse.json({ error: "Mã giới thiệu không hợp lệ" }, { status: 400 });
    }

    const cleanCode = referral_code.trim().toUpperCase();

    // 1. Kiểm tra mã người mời
    const { data: inviter } = await (supabase.from("users") as any)
      .select("id, name")
      .eq("referral_code", cleanCode)
      .maybeSingle();

    if (!inviter) {
      return NextResponse.json({ error: "Mã giới thiệu không tồn tại." }, { status: 404 });
    }

    if (inviter.id === user.id) {
      return NextResponse.json({ error: "Bạn không thể tự nhập mã giới thiệu của chính mình." }, { status: 400 });
    }

    // 2. Kiểm tra xem user hiện tại đã từng được ai giới thiệu chưa
    const { data: currentProfile } = await (supabase.from("users") as any)
      .select("referred_by")
      .eq("id", user.id)
      .single();

    if (currentProfile?.referred_by) {
      return NextResponse.json({ error: "Bạn đã từng áp dụng mã giới thiệu trước đó." }, { status: 400 });
    }

    // 3. Cập nhật referred_by cho user
    await (supabase.from("users") as any)
      .update({ referred_by: inviter.id })
      .eq("id", user.id);

    // 4. Lưu vào bảng referrals
    const rewardCredits = 60; // 60 credits = 3 lượt tạo đề
    await (supabase.from("referrals") as any).insert({
      inviter_id: inviter.id,
      invitee_id: user.id,
      reward_credits: rewardCredits,
    });

    // 5. Thưởng credits cho Invitee (Người nhập mã)
    const { data: inviteeWallet } = await (supabase.from("wallets") as any)
      .select("id, balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (inviteeWallet) {
      await (supabase.from("wallets") as any)
        .update({ balance: (inviteeWallet.balance || 0) + rewardCredits })
        .eq("id", inviteeWallet.id);

      await (supabase.from("wallet_txns") as any).insert({
        wallet_id: inviteeWallet.id,
        amount: rewardCredits,
        type: "signup_bonus",
        description: `Thưởng nhập mã giới thiệu từ đồng nghiệp (${cleanCode}) (+3 đề)`,
      });
    }

    // 6. Thưởng credits cho Inviter (Người chia sẻ)
    const { data: inviterWallet } = await (supabase.from("wallets") as any)
      .select("id, balance")
      .eq("user_id", inviter.id)
      .maybeSingle();

    if (inviterWallet) {
      await (supabase.from("wallets") as any)
        .update({ balance: (inviterWallet.balance || 0) + rewardCredits })
        .eq("id", inviterWallet.id);

      await (supabase.from("wallet_txns") as any).insert({
        wallet_id: inviterWallet.id,
        amount: rewardCredits,
        type: "signup_bonus",
        description: `Thưởng giới thiệu đồng nghiệp thành công (+3 đề)`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Áp dụng mã giới thiệu thành công! Bạn và đồng nghiệp đã được cộng thêm 3 đề miễn phí.",
      reward_credits: rewardCredits,
      inviter_name: inviter.name || "Đồng nghiệp",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
