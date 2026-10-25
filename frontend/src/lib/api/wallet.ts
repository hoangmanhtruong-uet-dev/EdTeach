import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

export type Wallet = Database["public"]["Tables"]["wallets"]["Row"];
export type WalletTxn = Database["public"]["Tables"]["wallet_txns"]["Row"];

export async function getUserWallet(): Promise<Wallet | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("Lưu ý (Wallet):", error.message);
    return null;
  }
  return (data as unknown as Wallet) || null;
}

export async function getWalletTransactions(limit = 20, offset = 0) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { transactions: [], totalCount: 0 };

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wallet) return { transactions: [], totalCount: 0 };
  const walletId = (wallet as { id: string }).id;

  const { data, error, count } = await supabase
    .from("wallet_txns")
    .select("*", { count: "exact" })
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return { transactions: (data || []) as WalletTxn[], totalCount: count || 0 };
}