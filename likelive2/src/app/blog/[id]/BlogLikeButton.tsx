"use client";

import { likeBlogAction, unlikeBlogAction } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  blogId: number;
  initialLiked: boolean;
  initialLikeCount: number;
  isLoggedIn: boolean;
};

export function BlogLikeButton({
  blogId,
  initialLiked,
  initialLikeCount,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const handleClick = () => {
    if (!isLoggedIn) {
      return;
    }
    if (isPending) return;
    startTransition(async () => {
      try {
        if (liked) {
          await unlikeBlogAction(blogId);
          setLiked(false);
          setLikeCount((c) => Math.max(0, c - 1));
        } else {
          await likeBlogAction(blogId);
          setLiked(true);
          setLikeCount((c) => c + 1);
        }
        router.refresh();
      } catch (error) {
        console.error("いいねの更新に失敗しました:", error);
      }
    });
  };

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-gray-600"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className="text-sm">{likeCount}</span>
        <span className="text-xs text-gray-400">（いいねするにはログイン）</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-2 transition-colors hover:opacity-80 disabled:opacity-60"
      aria-pressed={liked}
    >
      {liked ? (
        <svg
          className="h-6 w-6 text-red-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ) : (
        <svg
          className="h-6 w-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
      <span className="text-sm font-medium text-gray-700">
        {likeCount}
        {liked && <span className="ml-1 text-xs text-red-500">いいね済み</span>}
      </span>
    </button>
  );
}
