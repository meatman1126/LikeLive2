"use client";

import { createCommentAction } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  blogId: number;
  isLoggedIn: boolean;
};

export function BlogInteractions({ blogId, isLoggedIn }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createCommentAction(blogId, content.trim(), null);
        setContent("");
        router.refresh();
      } catch (e2) {
        setError(e2 instanceof Error ? e2.message : String(e2));
      }
    });
  };

  if (!isLoggedIn) {
    return (
      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-md">
        <p className="text-gray-700">
          いいね・コメント投稿にはログインが必要です。
        </p>
        <Link
          className="mt-2 inline-block text-blue-600 hover:text-blue-700 font-medium"
          href="/login"
        >
          ログインへ →
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-md">
      <form onSubmit={onSubmitComment} className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-sm font-semibold text-gray-700">
            コメントを投稿
          </div>
        </div>
        <textarea
          id="comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
          placeholder="コメントを入力してください..."
          disabled={isPending}
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {content.length > 0 && `${content.length}文字`}
          </div>
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="group rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            <span className="flex items-center gap-2">
              {isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>投稿中...</span>
                </>
              ) : (
                <>
                  <span className="group-hover:rotate-12 transition-transform duration-200 inline-block">
                    ✈️
                  </span>
                  <span>投稿する</span>
                </>
              )}
            </span>
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      ) : null}
    </section>
  );
}
