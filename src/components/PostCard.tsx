
import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { MessageSquare, ThumbsUp, Share } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Post } from "@/types";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  post: Post;
  channelName?: string;
  showChannel?: boolean;
}

const PostCard = ({ post, channelName, showChannel = false }: PostCardProps) => {
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const toggleLike = () => {
    if (liked) {
      setLikesCount(likesCount - 1);
    } else {
      setLikesCount(likesCount + 1);
    }
    setLiked(!liked);
  };

  return (
    <Card className="mb-4 overflow-hidden card-hover">
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={post.user.avatar} alt={post.user.name} />
              <AvatarFallback>{post.user.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="grid gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {post.user.name}
                </span>
                {showChannel && channelName && (
                  <>
                    <span className="text-muted-foreground">in</span>
                    <Badge variant="outline" className="px-2 py-0 text-xs">
                      {channelName}
                    </Badge>
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ja })}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">メニューを開く</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>保存</DropdownMenuItem>
              <DropdownMenuItem>報告</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <Link to={`/post/${post.id}`}>
        <CardContent className="pb-2">
          <h3 className="text-xl font-semibold mb-2 text-left">{post.title}</h3>
          <div className="prose dark:prose-invert max-w-none text-left mb-4">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
          
          {post.images && post.images.length > 0 && (
            <div className="rounded-md overflow-hidden my-2">
              <img 
                src={post.images[0]} 
                alt="投稿添付ファイル" 
                className="w-full object-cover" 
                style={{ maxHeight: "300px" }}
              />
            </div>
          )}
        </CardContent>
      </Link>
      <CardFooter className="flex justify-between border-t p-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex gap-1"
          asChild
        >
          <Link to={`/post/${post.id}`}>
            <MessageSquare className="h-4 w-4" /> 
            <span>{post.commentsCount}</span>
          </Link>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex gap-1 ${liked ? "text-blue-500" : ""}`}
          onClick={toggleLike}
        >
          <ThumbsUp className="h-4 w-4" /> 
          <span>{likesCount}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex gap-1">
          <Share className="h-4 w-4" /> 
          <span>共有</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
