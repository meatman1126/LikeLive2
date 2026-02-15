"use client";

import {
  followUserAction,
  isFollowingAction,
  unfollowUserAction,
} from "@/app/actions";
import { normalizeImageUrl } from "@/lib/utils/image-url";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";

type FollowUser = {
  id: number;
  followerId: number;
  followedId: number;
  follower?: {
    id: number;
    displayName: string | null;
    profileImageUrl: string | null;
  } | null;
  followed?: {
    id: number;
    displayName: string | null;
    profileImageUrl: string | null;
  } | null;
};

type UserWithFollowStatus = FollowUser & {
  isFollowing?: boolean;
};

type Props = {
  isFollow: boolean; // true: フォロー中, false: フォロワー
  users: FollowUser[];
  currentUserId: number | null;
  isOwnProfile: boolean;
  onClose: (isFollowUpdate: boolean) => void;
};

export function FollowListModal({
  isFollow,
  users,
  currentUserId,
  isOwnProfile,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFollowUpdate, setIsFollowUpdate] = React.useState(false);
  const [usersWithFollowStatus, setUsersWithFollowStatus] = useState<
    UserWithFollowStatus[]
  >([]);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // 各ユーザのフォロー状況を取得
  useEffect(() => {
    if (!currentUserId) {
      setUsersWithFollowStatus(users);
      return;
    }

    const fetchFollowStatus = async () => {
      const usersWithStatus = await Promise.all(
        users.map(async (follow) => {
          const user = isFollow ? follow.followed : follow.follower;
          if (!user || user.id === currentUserId) {
            // 自分自身の場合はフォロー状況を表示しない
            return { ...follow, isFollowing: false };
          }

          // 自分のフォローリストの場合、初期状態はフォロー中
          if (isOwnProfile && isFollow) {
            return { ...follow, isFollowing: true };
          }

          // 自分のフォロワーリストまたは他人のリストの場合、フォロー状況を取得
          try {
            const following = await isFollowingAction(user.id);
            return { ...follow, isFollowing: following };
          } catch {
            return { ...follow, isFollowing: false };
          }
        })
      );
      setUsersWithFollowStatus(usersWithStatus);
    };

    fetchFollowStatus();
  }, [users, currentUserId, isOwnProfile, isFollow]);

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose(isFollowUpdate);
    }
  };

  const handleNavigate = (userId: number) => {
    if (userId === currentUserId) {
      router.push("/me");
    } else {
      router.push(`/user/${userId}`);
    }
  };

  const handleFollow = async (targetUserId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      try {
        await followUserAction(targetUserId);
        setIsFollowUpdate(true);
        // フォロー状況を更新
        setUsersWithFollowStatus((prev) =>
          prev.map((follow) => {
            const user = isFollow ? follow.followed : follow.follower;
            if (user?.id === targetUserId) {
              return { ...follow, isFollowing: true };
            }
            return follow;
          })
        );
        router.refresh();
      } catch (error) {
        console.error("フォローに失敗しました:", error);
      }
    });
  };

  const handleUnfollow = async (targetUserId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      try {
        await unfollowUserAction(targetUserId);
        setIsFollowUpdate(true);
        // フォロー状況を更新
        setUsersWithFollowStatus((prev) =>
          prev.map((follow) => {
            const user = isFollow ? follow.followed : follow.follower;
            if (user?.id === targetUserId) {
              return { ...follow, isFollowing: false };
            }
            return follow;
          })
        );
        router.refresh();
      } catch (error) {
        console.error("フォロー解除に失敗しました:", error);
      }
    });
  };

  return (
    <div
      className="fixed z-30 inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center"
      onClick={handleOutsideClick}
    >
      <div
        className="bg-white w-[400px] p-4 rounded-lg shadow-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {isFollow ? "フォロー中のユーザ" : "フォロワー"}
          </h3>
          <button
            onClick={() => onClose(isFollowUpdate)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full p-1 w-8 h-8 flex items-center justify-center transition-colors"
            disabled={isPending}
            aria-label="閉じる"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>
        <ul className="p-2 space-y-3 overflow-y-auto flex-1">
          {usersWithFollowStatus.length === 0 ? (
            <li className="text-sm text-zinc-500 text-center py-4">
              {isFollow
                ? "まだフォローしていません。"
                : "まだフォロワーがいません。"}
            </li>
          ) : (
            usersWithFollowStatus.map((follow) => {
              const user = isFollow ? follow.followed : follow.follower;
              if (!user) return null;

              // ログインユーザが存在し、自分自身でない場合にボタンを表示
              const showFollowButton =
                currentUserId && user.id !== currentUserId;

              return (
                <li
                  key={follow.id}
                  className="flex items-center justify-between space-x-3"
                >
                  <div
                    className="flex items-center space-x-3 cursor-pointer flex-1"
                    onClick={() => handleNavigate(user.id)}
                  >
                    {user.profileImageUrl && !imageErrors.has(user.id) ? (
                      <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={normalizeImageUrl(user.profileImageUrl)}
                          alt={user.displayName || "Profile"}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          onError={() => {
                            setImageErrors((prev) =>
                              new Set(prev).add(user.id)
                            );
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 flex-shrink-0">
                        <span className="text-blue-300 text-2xl">👤</span>
                      </div>
                    )}
                    <p className="font-medium text-gray-900">
                      {user.displayName ?? `user#${user.id}`}
                    </p>
                  </div>
                  {showFollowButton && (
                    <div className="text-sm text-right pr-3">
                      {follow.isFollowing ? (
                        <button
                          className="bg-white text-black border border-gray-300 rounded-full px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                          onClick={(e) => handleUnfollow(user.id, e)}
                          disabled={isPending}
                        >
                          フォロー中
                        </button>
                      ) : (
                        <button
                          className="bg-blue-500 text-white rounded-full px-3 py-1 text-xs hover:bg-blue-600 disabled:opacity-60"
                          onClick={(e) => handleFollow(user.id, e)}
                          disabled={isPending}
                        >
                          フォローする
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
