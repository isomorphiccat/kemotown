/**
 * Post Detail Page
 * Display a single timeline post/activity with full engagement options
 */

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Heart,
  Repeat2,
  MessageCircle,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default function PostPage({ params }: PostPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const utils = trpc.useUtils();

  // Fetch the activity/post
  const { data: post, isLoading, error } = trpc.activity.getById.useQuery(
    { activityId: id },
    { retry: false }
  );

  // Like mutation
  const likeMutation = trpc.activity.like.useMutation({
    onSuccess: () => {
      utils.activity.getById.invalidate({ activityId: id });
    },
    onError: (err) => {
      toast.error(err.message || '좋아요 처리에 실패했습니다');
    },
  });

  // Unlike mutation
  const unlikeMutation = trpc.activity.unlike.useMutation({
    onSuccess: () => {
      utils.activity.getById.invalidate({ activityId: id });
    },
    onError: (err) => {
      toast.error(err.message || '좋아요 취소에 실패했습니다');
    },
  });

  // Repost mutation
  const repostMutation = trpc.activity.repost.useMutation({
    onSuccess: () => {
      utils.activity.getById.invalidate({ activityId: id });
      toast.success('리포스트했습니다');
    },
    onError: (err) => {
      toast.error(err.message || '리포스트에 실패했습니다');
    },
  });

  // Delete mutation
  const deleteMutation = trpc.activity.delete.useMutation({
    onSuccess: () => {
      toast.success('게시물이 삭제되었습니다');
      router.push('/');
    },
    onError: (err) => {
      toast.error(err.message || '삭제에 실패했습니다');
    },
  });

  const handleLike = () => {
    if (!session) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    if (post?.liked) {
      unlikeMutation.mutate({ targetActivityId: id });
    } else {
      likeMutation.mutate({ targetActivityId: id });
    }
  };

  const handleRepost = () => {
    if (!session) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    if (post?.reposted) {
      toast.info('이미 리포스트한 게시물입니다');
      return;
    }

    repostMutation.mutate({ targetActivityId: id });
  };

  const handleDelete = () => {
    if (confirm('게시물을 삭제하시겠습니까?')) {
      deleteMutation.mutate({ activityId: id });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로
        </Button>
        <div className="text-center py-16 bg-cream-50/80 dark:bg-forest-900/60 rounded-xl border border-warm-200/60 dark:border-forest-800/60">
          <MessageCircle className="w-12 h-12 text-warm-300 dark:text-warm-600 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 font-korean mb-2">
            게시물을 찾을 수 없습니다
          </h2>
          <p className="text-warm-500 dark:text-warm-400 font-korean">
            게시물이 삭제되었거나 존재하지 않습니다.
          </p>
          <Link href="/" className="inline-block mt-6">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = session?.user?.id === post.actor?.id;
  // Get content from the embedded object JSON field
  const postContent = (post.object as { content?: string })?.content ?? '';
  const formattedDate = format(new Date(post.published), 'PPP HH:mm', {
    locale: ko,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로
      </Button>

      {/* Post Card */}
      <div className="bg-cream-50/80 dark:bg-forest-900/60 rounded-xl border border-warm-200/60 dark:border-forest-800/60 p-6">
        {/* Author Header */}
        <div className="flex items-start justify-between mb-4">
          <Link
            href={`/profile/${post.actor?.username || post.actor?.id}`}
            className="flex items-center gap-3"
          >
            {post.actor?.avatarUrl ? (
              <Image
                src={post.actor.avatarUrl}
                alt={post.actor.username ?? post.actor.id}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
                <span className="text-forest-600 dark:text-forest-400 font-bold">
                  {(post.actor?.displayName || post.actor?.username || '?').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-forest-800 dark:text-cream-100 font-korean">
                {post.actor?.displayName || post.actor?.username}
              </p>
              <p className="text-sm text-warm-500 dark:text-warm-400">
                @{post.actor?.username}
              </p>
            </div>
          </Link>

          {/* Actions Menu */}
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-forest-800 dark:text-cream-100 whitespace-pre-wrap font-korean text-lg leading-relaxed">
            {postContent}
          </p>
        </div>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-4 grid gap-2 rounded-lg overflow-hidden">
            {post.attachments.map((attachment: { id: string; url: string; type: string }) => (
              attachment.type?.startsWith('image') && (
                <Image
                  key={attachment.id}
                  src={attachment.url}
                  alt="첨부 이미지"
                  width={600}
                  height={400}
                  className="w-full object-cover rounded-lg"
                />
              )
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-sm text-warm-500 dark:text-warm-400 mb-4 pb-4 border-b border-warm-200/60 dark:border-forest-800/60">
          {formattedDate}
        </p>

        {/* Engagement Stats */}
        <div className="flex items-center gap-6 text-sm text-warm-600 dark:text-warm-400 mb-4 pb-4 border-b border-warm-200/60 dark:border-forest-800/60">
          <span>
            <strong className="text-forest-800 dark:text-cream-100">{post.likesCount ?? 0}</strong> 좋아요
          </span>
          <span>
            <strong className="text-forest-800 dark:text-cream-100">{post.repostsCount ?? 0}</strong> 리포스트
          </span>
          {post._count?.replies !== undefined && post._count.replies > 0 && (
            <span>
              <strong className="text-forest-800 dark:text-cream-100">{post._count.replies}</strong> 답글
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-around">
          <button
            onClick={handleLike}
            disabled={likeMutation.isPending || unlikeMutation.isPending}
            className={`flex items-center gap-2 p-2 rounded-full transition-colors ${
              post.liked
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-warm-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            <Heart className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`} />
            <span className="font-korean">좋아요</span>
          </button>

          <button
            onClick={handleRepost}
            disabled={repostMutation.isPending}
            className={`flex items-center gap-2 p-2 rounded-full transition-colors ${
              post.reposted
                ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                : 'text-warm-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
          >
            <Repeat2 className="h-5 w-5" />
            <span className="font-korean">리포스트</span>
          </button>

          <button
            className="flex items-center gap-2 p-2 rounded-full text-warm-500 hover:text-forest-600 hover:bg-forest-50 dark:hover:bg-forest-900/20 transition-colors"
            onClick={() => toast.info('답글 기능은 준비 중입니다')}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-korean">답글</span>
          </button>
        </div>
      </div>

      {/* Reply Thread (placeholder for future) */}
      {post.inReplyTo && (
        <div className="mt-4 p-4 bg-warm-50/50 dark:bg-forest-950/50 rounded-xl border border-warm-200/40 dark:border-forest-800/40">
          <p className="text-sm text-warm-500 dark:text-warm-400 font-korean mb-2">
            이 게시물은 답글입니다
          </p>
          <Link
            href={`/post/${post.inReplyTo}`}
            className="text-forest-600 dark:text-forest-400 hover:underline font-korean"
          >
            원본 게시물 보기 →
          </Link>
        </div>
      )}
    </div>
  );
}
