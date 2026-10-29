import { createClient } from "@/lib/supabase/client";
import { Whiteboard, WhiteboardInsert, WhiteboardUpdate } from "@/types/whiteboard";

export const FREE_TIER_MAX_BOARDS = 3;

/**
 * Lấy danh sách bảng vẽ của user hiện tại
 */
export async function getUserWhiteboards(): Promise<Whiteboard[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase.from as any)("whiteboards")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Lỗi khi tải danh sách bảng vẽ:", error);
    return [];
  }

  return ((data as unknown) || []) as Whiteboard[];
}

/**
 * Lấy chi tiết một bảng vẽ theo ID
 */
export async function getWhiteboardById(id: string): Promise<Whiteboard | null> {
  const supabase = createClient();
  const { data, error } = await (supabase.from as any)("whiteboards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`Lỗi khi tải bảng vẽ ${id}:`, error);
    return null;
  }

  return ((data as unknown) as Whiteboard) || null;
}

/**
 * Tạo bảng vẽ mới (Kiểm tra quota nếu tài khoản Free)
 */
export async function createWhiteboard(
  title = "Bảng vẽ chưa đặt tên",
  isPro = false
): Promise<{ data: Whiteboard | null; error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Bạn cần đăng nhập để tạo bảng vẽ." };
  }

  // Nếu là Free tier, kiểm tra số lượng bảng hiện có
  if (!isPro) {
    const { count, error: countErr } = await (supabase.from as any)("whiteboards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!countErr && (count ?? 0) >= FREE_TIER_MAX_BOARDS) {
      return {
        data: null,
        error: `Tài khoản Free đã đạt giới hạn tối đa ${FREE_TIER_MAX_BOARDS} bảng vẽ. Vui lòng nâng cấp lên gói Pro để tạo không giới hạn!`
      };
    }
  }

  const newBoard: WhiteboardInsert = {
    user_id: user.id,
    title,
    description: null,
    elements: [],
    app_state: {
      viewBackgroundColor: "#ffffff",
      currentItemStrokeColor: "#1e1e1e",
      gridSize: 20
    },
    thumbnail_url: null,
    is_favorite: false
  };

  const { data, error } = await (supabase.from as any)("whiteboards")
    .insert(newBoard)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data as unknown) as Whiteboard, error: null };
}

/**
 * Cập nhật bảng vẽ
 */
export async function updateWhiteboard(
  id: string,
  updates: WhiteboardUpdate
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await (supabase.from as any)("whiteboards")
    .update(updates)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Xoá bảng vẽ
 */
export async function deleteWhiteboard(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await (supabase.from as any)("whiteboards")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Lỗi khi xoá bảng vẽ ${id}:`, error);
    return false;
  }

  return true;
}

/**
 * Nhân bản bảng vẽ
 */
export async function duplicateWhiteboard(id: string, isPro = false): Promise<Whiteboard | null> {
  const original = await getWhiteboardById(id);
  if (!original) return null;

  const res = await createWhiteboard(`${original.title} (Bản sao)`, isPro);
  if (res.data) {
    await updateWhiteboard(res.data.id, {
      elements: original.elements,
      app_state: original.app_state,
      description: original.description
    });
    return {
      ...res.data,
      elements: original.elements,
      app_state: original.app_state
    };
  }

  return null;
}
