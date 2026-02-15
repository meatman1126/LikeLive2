"use client";

import { createCommentAction, deleteCommentAction } from "@/app/actions";
import type { CommentWithReplies } from "@/app/actions/public-actions";
import { ConfirmModal } from "@/app/components/ConfirmModal";
import { normalizeImageUrl } from "@/lib/utils/image-url";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  comments: CommentWithReplies[];
  blogId: number;
  isLoggedIn: boolean;
  currentUserId: number | null;
};

export function CommentList({
  comments,
  blogId,
  isLoggedIn,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(
    null
  );
  const [selectedParentCommentId, setSelectedParentCommentId] = useState<
    number | null
  >(null);
  const [replyContent, setReplyContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetCommentId, setDeleteTargetCommentId] = useState<
    number | null
  >(null);

  // 返信コメントの親コメントIDを取得
  const findParentCommentId = (
    replyId: number,
    allComments: CommentWithReplies[]
  ): number | null => {
    for (const parentComment of allComments) {
      if (
        parentComment.replies.some(
          (reply: CommentWithReplies) => reply.id === replyId
        )
      ) {
        return parentComment.id;
      }
    }
    return null;
  };

  const handleCommentClick = (commentId: number, isReply: boolean) => {
    if (!isLoggedIn) return;

    if (isReply) {
      // 返信コメントをクリックした場合、その親コメントIDを取得
      const parentId = findParentCommentId(commentId, comments);
      if (parentId) {
        setSelectedCommentId(commentId);
        setSelectedParentCommentId(parentId);
      }
    } else {
      // 親コメントをクリックした場合
      setSelectedCommentId(commentId);
      setSelectedParentCommentId(commentId);
    }
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedParentCommentId) return;

    setError(null);
    startTransition(async () => {
      try {
        await createCommentAction(
          blogId,
          replyContent.trim(),
          selectedParentCommentId
        );
        setReplyContent("");
        setSelectedCommentId(null);
        setSelectedParentCommentId(null);
        router.refresh();
      } catch (e2) {
        setError(e2 instanceof Error ? e2.message : String(e2));
      }
    });
  };

  const handleCancelReply = () => {
    setReplyContent("");
    setSelectedCommentId(null);
    setSelectedParentCommentId(null);
    setError(null);
  };

  const handleDeleteClick = (commentId: number) => {
    setDeleteTargetCommentId(commentId);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetCommentId) return;

    startTransition(async () => {
      try {
        await deleteCommentAction(deleteTargetCommentId);
        setDeleteTargetCommentId(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setDeleteTargetCommentId(null);
      }
    });
  };

  const handleDeleteCancel = () => {
    setDeleteTargetCommentId(null);
  };

  const isOwnComment = (comment: CommentWithReplies): boolean => {
    return currentUserId !== null && comment.authorId === currentUserId;
  };

  const renderReplyInput = (commentId: number, isReply: boolean) => {
    if (selectedCommentId !== commentId || !isLoggedIn) return null;

    return (
      <div className="mt-3 ml-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSubmitReply} className="space-y-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
            placeholder="返信を入力してください..."
            disabled={isPending}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelReply}
              disabled={isPending}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending || !replyContent.trim()}
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
                    <span>返信</span>
                  </>
                )}
              </span>
            </button>
          </div>
          {error && (
            <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </form>
      </div>
    );
  };

  return (
    <>
      <ConfirmModal
        isOpen={deleteTargetCommentId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        animationType="slide-up"
        title="コメントの削除"
        message="このコメントを削除しますか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
        confirmButtonColor="red"
        isLoading={isPending}
      />
      <div className="space-y-4">
        {comments.map((parentComment) => (
          <div key={parentComment.id} className="space-y-3">
            {/* 親コメント */}
            <div
              className={`rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-md transition-shadow hover:shadow-lg ${
                isLoggedIn ? "cursor-pointer" : ""
              } relative`}
              onClick={() => handleCommentClick(parentComment.id, false)}
            >
              {isOwnComment(parentComment) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(parentComment.id);
                  }}
                  disabled={isPending}
                  className="absolute top-3 right-3 px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  削除
                </button>
              )}
              <div className="flex items-center gap-3 mb-3">
                {parentComment.author?.profileImageUrl ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full flex-shrink-0 border-2 border-gray-200">
                    <Image
                      src={normalizeImageUrl(
                        parentComment.author.profileImageUrl
                      )}
                      alt={`${
                        parentComment.author.displayName ?? "unknown"
                      }のプロフィール画像`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200 border-2 border-gray-200 flex-shrink-0">
                    <span className="text-gray-500 text-lg">👤</span>
                  </div>
                )}
                <div className="text-sm font-semibold text-gray-700">
                  {parentComment.author?.displayName ?? "unknown"}
                </div>
              </div>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {parentComment.content}
              </div>
            </div>

            {/* 親コメントへの返信入力欄 */}
            {renderReplyInput(parentComment.id, false)}

            {/* 返信コメント */}
            {parentComment.replies && parentComment.replies.length > 0 && (
              <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                {parentComment.replies.map((reply: CommentWithReplies) => (
                  <div key={reply.id}>
                    <div
                      className={`rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm transition-shadow hover:shadow-md ${
                        isLoggedIn ? "cursor-pointer" : ""
                      } relative`}
                      onClick={() => handleCommentClick(reply.id, true)}
                    >
                      {isOwnComment(reply) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(reply.id);
                          }}
                          disabled={isPending}
                          className="absolute top-3 right-3 px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          削除
                        </button>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        {reply.author?.profileImageUrl ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-full flex-shrink-0 border-2 border-gray-200">
                            <Image
                              src={normalizeImageUrl(
                                reply.author.profileImageUrl
                              )}
                              alt={`${
                                reply.author.displayName ?? "unknown"
                              }のプロフィール画像`}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200 border-2 border-gray-200 flex-shrink-0">
                            <span className="text-gray-500 text-lg">👤</span>
                          </div>
                        )}
                        <div className="text-sm font-semibold text-gray-700">
                          {reply.author?.displayName ?? "unknown"}
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {reply.content}
                      </div>
                    </div>

                    {/* 返信コメントへの返信入力欄 */}
                    {renderReplyInput(reply.id, true)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
