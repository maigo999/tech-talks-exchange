
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Submits a new comment to the database
 */
export async function submitComment(
  postId: string,
  content: string,
  userId: string | null,
  nickname?: string
) {
  try {
    // セッションを再確認 (念のため、ログインユーザーの場合)
    if (userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("セッションが期限切れです。再ログインしてください。");
      }
    }

    // Prepare comment data based on user status
    const commentData = {
      post_id: postId,
      content: content,
      // For anonymous users, set user_id to null and use nickname
      user_id: userId || null,
      guest_nickname: !userId ? (nickname || "ゲスト") : null
    };

    // コメントをデータベースに追加
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single();

    if (error) {
      console.error("コメント投稿DB エラー:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("コメント投稿エラー:", error);
    throw error;
  }
}

/**
 * Submits a reply to a comment
 */
export async function submitReply(
  postId: string,
  parentId: string,
  content: string,
  userId: string | null,
  nickname?: string
) {
  try {
    // セッションを再確認 (念のため、ログインユーザーの場合)
    if (userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("セッションが期限切れです。再ログインしてください。");
      }
    }
    
    // Prepare reply data based on user status
    const replyData = {
      post_id: postId,
      content: content,
      parent_id: parentId,
      // For anonymous users, set user_id to null and use nickname
      user_id: userId || null,
      guest_nickname: !userId ? (nickname || "返信") : null
    };
    
    // 返信をデータベースに追加
    const { data, error } = await supabase
      .from('comments')
      .insert(replyData)
      .select()
      .single();

    if (error) {
      console.error("返信投稿エラー:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("返信投稿エラー:", error);
    throw error;
  }
}

/**
 * Toggles like status for a comment
 */
export async function toggleCommentLike(commentId: string, userId: string, isLiked: boolean) {
  // セッションを再確認
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("セッションが期限切れです。再ログインしてください。");
  }
  
  try {
    if (isLiked) {
      // いいねを削除
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('comment_id', commentId);

      if (error) {
        console.error("いいね削除エラー:", error);
        throw error;
      }
      
      return false;
    } else {
      // いいねを追加
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          comment_id: commentId
        });

      if (error) {
        console.error("いいね追加エラー:", error);
        throw error;
      }
      
      return true;
    }
  } catch (error) {
    console.error("いいね処理エラー:", error);
    throw error;
  }
}

/**
 * Deletes a comment
 */
export async function deleteCommentById(commentId: string, userId: string, postId: string) {
  // セッションを再確認
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("セッションが期限切れです。再ログインしてください。");
  }
  
  try {
    // コメントを削除
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error("コメント削除エラー:", error);
      throw error;
    }
  } catch (error) {
    console.error("コメント削除エラー:", error);
    throw error;
  }
}

/**
 * Updates a comment's content
 */
export async function updateCommentContent(commentId: string, userId: string, newContent: string) {
  // セッションを再確認
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("セッションが期限切れです。再ログインしてください。");
  }

  try {
    const now = new Date().toISOString();
    
    // コメントを更新
    const { error } = await supabase
      .from('comments')
      .update({
        content: newContent,
        updated_at: now
      })
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error("コメント更新エラー:", error);
      throw error;
    }
    
    return now;
  } catch (error) {
    console.error("コメント更新エラー:", error);
    throw error;
  }
}
