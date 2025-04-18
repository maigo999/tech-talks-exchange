import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Post } from "@/types";
import PostCardHeader from "./PostCardHeader";
import PostCardContent from "./PostCardContent";
import PostCardFooter from "./PostCardFooter";
import PostCardMenu from "./PostCardMenu";
import ContentToggler from "./ContentToggler";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateGuestId, hasGuestId } from "@/utils/guestUtils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import EditPostForm from "../EditPostForm";

interface PostCardProps {
  post: Post;
  channelName?: string;
  showChannel?: boolean;
  isTrending?: boolean;
  isPopular?: boolean;
}

const PostCard = ({ 
  post, 
  channelName, 
  showChannel = false, 
  isTrending = false,
  isPopular = false
}: PostCardProps) => {
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showFullContent, setShowFullContent] = useState(false);
  const navigate = useNavigate();

  // 投稿の詳細情報を取得する
  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        let isLiked = false;
        
        if (user) {
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .match({ user_id: user.id, post_id: post.id })
            .maybeSingle();
            
          isLiked = !!likeData;
        } else if (hasGuestId()) {
          const guestId = getOrCreateGuestId();
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .match({ guest_id: guestId, post_id: post.id })
            .maybeSingle();
            
          isLiked = !!likeData;
        }
        
        setLiked(isLiked);

        const { count, error: countError } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id);
          
        if (!countError && count !== null) {
          setCommentsCount(count);
        }

        const { count: likesCountResult, error: likesCountError } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id);
          
        if (!likesCountError && likesCountResult !== null) {
          setLikesCount(likesCountResult);
        }
      } catch (error) {
        console.error("Error fetching post details:", error);
      }
    };
    
    fetchPostDetails();
  }, [post.id]);

  // 投稿内容を一定の長さに制限する
  const contentPreviewLength = 150; // プレビューの文字制限
  const contentPreview = post.content.length > contentPreviewLength 
    ? post.content.substring(0, contentPreviewLength) + '...' 
    : post.content;
  
  const hasLongContent = post.content.length > contentPreviewLength;

  const toggleLike = async () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  const handleContentToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // リンククリックを防止
    setShowFullContent(!showFullContent);
  };

  const handleEditPost = () => {
    navigate(`/edit-post/${post.id}`);
  };

  const handlePostUpdated = () => {
    navigate(0);
  };

  const handlePostDeleted = () => {
    if (window.location.pathname.includes(`/post/${post.id}`)) {
      navigate('/');
    } else {
      navigate(0);
    }
  };

  return (
    <>
      <Card className={`mb-4 overflow-hidden hover:shadow-md transition-shadow relative ${isTrending ? 'border-blue-400 dark:border-blue-600 shadow-md' : ''} ${isPopular ? 'border-amber-400 dark:border-amber-600 shadow-md' : ''}`}>
        {/* カード全体をクリック可能にするための絶対配置のリンク */}
        <Link 
          to={`/post/${post.id}`}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label={`${post.title || '投稿'}の詳細を見る`}
        >
          <span className="sr-only">{post.title || '投稿'}の詳細を見る</span>
        </Link>
        
        <PostCardHeader 
          post={post} 
          channelName={channelName} 
          showChannel={showChannel}
          isTrending={isTrending}
          isPopular={isPopular}
          onEditPost={handleEditPost}
          onPostDeleted={handlePostDeleted}
        />
        
        {/* 個別のリンクは不要になるため、単純なコンポーネントとして使用 */}
        <PostCardContent 
          post={post} 
          showFullContent={showFullContent} 
          contentPreview={contentPreview} 
        />
        
        {hasLongContent && (
          <ContentToggler 
            showFullContent={showFullContent}
            onToggle={handleContentToggle}
          />
        )}
        
        <PostCardFooter 
          postId={post.id}
          commentsCount={commentsCount}
          likesCount={likesCount}
          liked={liked}
          onToggleLike={toggleLike}
        />
      </Card>
    </>
  );
};

export default PostCard;
