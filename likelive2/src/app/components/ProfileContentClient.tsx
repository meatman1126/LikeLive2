"use client";

import { getFollowedUsersAction, getFollowersAction } from "@/app/actions";
import { normalizeImageUrl } from "@/lib/utils/image-url";
import type { ProfileViewDto } from "@/types/profile";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArtistImage } from "../me/ArtistImage";
import { BlogThumbnail } from "../me/BlogThumbnail";
import { FollowButton } from "../user/[id]/FollowButton";
import { FollowListModal } from "./FollowListModal";

type Props = {
  profile: ProfileViewDto;
  isOwnProfile: boolean;
  currentUserId: number | null;
  isLoggedIn: boolean;
  drafts?: Array<{ id: number; title: string | null }>;
  archives?: Array<{ id: number; title: string | null }>;
};

export function ProfileContentClient({
  profile,
  isOwnProfile,
  currentUserId,
  isLoggedIn,
  drafts = [],
  archives = [],
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [followUsers, setFollowUsers] = useState<Awaited<
    ReturnType<typeof getFollowedUsersAction>
  > | null>(null);
  const [followers, setFollowers] = useState<Awaited<
    ReturnType<typeof getFollowersAction>
  > | null>(null);
  const [isFollowUpdate, setIsFollowUpdate] = useState(false);

  const handleFollowLink = async () => {
    startTransition(async () => {
      try {
        const targetUserId = profile.userId;
        const data = await getFollowedUsersAction(targetUserId);
        setFollowUsers(data);
      } catch (error) {
        console.error("フォロー中一覧の取得に失敗しました:", error);
      }
    });
  };

  const handleFollowerLink = async () => {
    startTransition(async () => {
      try {
        const targetUserId = profile.userId;
        const data = await getFollowersAction(targetUserId);
        setFollowers(data);
      } catch (error) {
        console.error("フォロワー一覧の取得に失敗しました:", error);
      }
    });
  };

  const clearFollowUsers = (isFollowUpdate: boolean) => {
    if (isFollowUpdate) {
      router.refresh();
    }
    setFollowUsers(null);
  };

  const clearFollowers = (isFollowUpdate: boolean) => {
    if (isFollowUpdate) {
      router.refresh();
    }
    setFollowers(null);
  };

  return (
    <>
      <div className="container mx-auto p-4 font-sans">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-white px-6 py-12">
          {isOwnProfile && (
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                My profile
              </h1>
              <Link
                href="/me/edit"
                className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
              >
                <span className="text-sm">編集</span>
              </Link>
            </div>
          )}

          <section className="rounded-lg border border-black/[.08] bg-white p-6 text-sm shadow-lg dark:border-white/[.145]">
            <div className="flex flex-col md:flex-row md:items-start mb-6">
              <div className="mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                {profile.profileImageUrl ? (
                  <div className="relative w-32 h-32 overflow-hidden rounded-full">
                    <Image
                      src={normalizeImageUrl(profile.profileImageUrl)}
                      alt="Profile Image"
                      width={128}
                      height={128}
                      className="rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-200">
                    <span className="text-blue-300 text-6xl">👤</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.displayName ?? "no name"}
                  </h1>
                  {!isOwnProfile && (
                    <FollowButton
                      targetUserId={profile.userId}
                      isLoggedIn={isLoggedIn}
                      isFollow={profile.isFollow}
                    />
                  )}
                </div>
                {profile.selfIntroduction ? (
                  <p className="text-gray-600">{profile.selfIntroduction}</p>
                ) : (
                  <p className="text-gray-600">※プロフィールは未設定です。</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <button
                className="text-blue-500 hover:underline"
                onClick={handleFollowLink}
                disabled={isPending}
              >
                フォロー中: {profile.followedCount}
              </button>
              <button
                className="ml-4 text-blue-500 hover:underline"
                onClick={handleFollowerLink}
                disabled={isPending}
              >
                フォロワー: {profile.followerCount}
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Favorite artists
            </h2>
            {profile.favoriteArtistList.length === 0 ? (
              <p className="text-sm text-zinc-500">未設定です。</p>
            ) : (
              <div className="flex flex-col gap-2">
                {profile.favoriteArtistList.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-black/[.08] bg-gray-100 p-3 text-sm shadow-lg dark:border-white/[.145]"
                  >
                    <ArtistImage imageUrl={a.imageUrl} artistName={a.name} />
                    <div className="font-medium text-gray-900">{a.name}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Published Blogs
            </h2>
            {profile.createdBlogList.length === 0 ? (
              <p className="text-sm text-zinc-500">まだブログがありません。</p>
            ) : (
              <div className="space-y-3">
                {profile.createdBlogList.map((b) => (
                  <Link
                    key={b.id}
                    href={`/blog/${b.id}`}
                    className="block rounded-lg border border-black/[.08] bg-gray-100 p-4 shadow-lg transition-shadow hover:shadow-xl dark:border-white/[.145]"
                  >
                    <div className="mb-3">
                      <BlogThumbnail
                        thumbnailUrl={b.thumbnailUrl}
                        blogTitle={b.title}
                      />
                    </div>
                    <div className="font-medium text-gray-900">{b.title}</div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {isOwnProfile && drafts.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                下書き一覧
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {drafts.map((draft: { id: number; title: string | null }) => (
                  <Link
                    key={draft.id}
                    href={`/blog/${draft.id}`}
                    className="block rounded-lg border border-black/[.08] bg-gray-100 p-4 shadow-lg transition-shadow hover:shadow-xl dark:border-white/[.145]"
                  >
                    <p className="font-medium text-gray-900">
                      {draft.title || "無題"}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {isOwnProfile && archives.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                非公開状態のブログ一覧
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {archives.map(
                  (archive: { id: number; title: string | null }) => (
                    <Link
                      key={archive.id}
                      href={`/blog/${archive.id}`}
                      className="block rounded-lg border border-black/[.08] bg-gray-100 p-4 shadow-lg transition-shadow hover:shadow-xl dark:border-white/[.145]"
                    >
                      <p className="font-medium text-gray-900">
                        {archive.title || "無題"}
                      </p>
                    </Link>
                  )
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      {followUsers && (
        <FollowListModal
          isFollow={true}
          users={followUsers}
          currentUserId={currentUserId}
          isOwnProfile={isOwnProfile}
          onClose={clearFollowUsers}
        />
      )}

      {followers && (
        <FollowListModal
          isFollow={false}
          users={followers}
          currentUserId={currentUserId}
          isOwnProfile={isOwnProfile}
          onClose={clearFollowers}
        />
      )}
    </>
  );
}
