"use client";

import { followUserAction, unfollowUserAction } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  targetUserId: number;
  isLoggedIn: boolean;
  isFollow: boolean | null;
};

export function FollowButton({ targetUserId, isLoggedIn, isFollow }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link className="inline-block underline text-sm" href="/login">
        ログインしてフォロー
      </Link>
    );
  }

  // 自分自身など isFollow 判定不能なケースは非表示
  if (isFollow === null) return null;

  const onClick = () => {
    startTransition(async () => {
      if (isFollow) {
        await unfollowUserAction(targetUserId);
      } else {
        await followUserAction(targetUserId);
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={onClick}
      className={
        isFollow
          ? "bg-white text-black border border-gray-300 rounded-full px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
          : "bg-blue-500 text-white rounded-full px-3 py-1 text-xs hover:bg-blue-600 disabled:opacity-60"
      }
    >
      {isFollow ? "フォロー中" : "フォローする"}
    </button>
  );
}
