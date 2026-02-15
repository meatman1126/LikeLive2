"use client";

import { UserRegistrationModal } from "@/app/components/UserRegistrationModal";
import { normalizeImageUrl } from "@/lib/utils/image-url";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = {
  isFirstLogin: boolean;
  initialUsername: string | null;
  interestBlogs: any[];
  recommendedUsers: any[];
  drafts: any[];
};

export function DashboardClient({
  isFirstLogin,
  initialUsername,
  interestBlogs,
  recommendedUsers,
  drafts,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(isFirstLogin);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {isFirstLogin && (
        <UserRegistrationModal
          initialUsername={initialUsername}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
      <div className="container mx-auto p-4 font-sans">
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 bg-white px-6 py-12">
          {/* おすすめの新着投稿 */}
          <section className="space-y-4">
            <h2 className="text-xl text-gray-700 font-semibold">
              おすすめの新着投稿
            </h2>
            {interestBlogs.length === 0 ? (
              <p className="text-sm text-gray-700">
                おすすめの投稿はまだありません。
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {interestBlogs.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blog/${blog.id}`}
                    className="block rounded-lg border border-black/[.08] bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:border-white/[.145]"
                  >
                    {blog.thumbnailUrl ? (
                      <div className="relative mb-4 h-36 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={normalizeImageUrl(blog.thumbnailUrl)}
                          alt={`${blog.title}のサムネイル`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mb-4 flex h-36 w-full items-center justify-center rounded-t-lg bg-zinc-100 dark:bg-zinc-800">
                        <span className="text-sm text-zinc-500">画像なし</span>
                      </div>
                    )}

                    <h3 className="mb-4 text-xl font-bold text-gray-700">
                      {blog.title}
                    </h3>

                    <div className="mb-4 flex items-center">
                      {blog.author?.profileImageUrl ? (
                        <div className="relative mr-4 h-10 w-10 overflow-hidden rounded-full border-2 border-gray-300">
                          <Image
                            src={normalizeImageUrl(blog.author.profileImageUrl)}
                            alt={`${blog.author.displayName}のアイコン`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-300">
                          <span className="text-lg">👤</span>
                        </div>
                      )}
                      <div className="flex flex-1 items-center justify-between">
                        <p className="font-semibold text-gray-700">
                          {blog.author?.displayName ?? "unknown"}
                        </p>
                      </div>
                    </div>

                    <p className="text-right text-sm text-gray-500">
                      投稿日:{" "}
                      {new Date(blog.blogCreatedTime).toLocaleDateString(
                        "ja-JP",
                      )}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* おすすめのユーザ */}
          <section className="space-y-4">
            <h2 className="text-xl text-gray-700 font-semibold">
              おすすめのユーザ
            </h2>
            {recommendedUsers.length === 0 ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-700">
                  共通のアーティストが好きなユーザはまだいないみたいです。
                </p>
                <p className="text-sm text-gray-700">
                  興味のあるアーティストを追加してみましょう
                </p>
                <Link
                  href="/me"
                  className="inline-block rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  プロフィール設定
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  共通のアーティストが好きなユーザ
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {recommendedUsers.map((user) => (
                    <Link
                      key={user.userId}
                      href={`/user/${user.userId}`}
                      className="block rounded-lg border border-black/[.08] bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:border-white/[.145]"
                    >
                      <div className="mb-4 flex items-center">
                        {user.profileImageUrl ? (
                          <div className="relative mr-4 h-10 w-10 overflow-hidden rounded-full border-2 border-gray-300">
                            <Image
                              src={normalizeImageUrl(user.profileImageUrl)}
                              alt={`${user.displayName}のアイコン`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-300">
                            <span className="text-lg">👤</span>
                          </div>
                        )}
                        <div className="flex flex-1 items-center justify-between">
                          <p className="font-semibold text-gray-700">
                            {user.displayName}
                          </p>
                          {user.isFollow && (
                            <span className="text-xs text-gray-500">
                              フォロー中
                            </span>
                          )}
                        </div>
                      </div>
                      {user.selfIntroduction && (
                        <p className="text-sm text-gray-700">
                          {user.selfIntroduction}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 作成途中の記事 */}
          {drafts.length > 0 && (
            <section className="space-y-4 text-gray-700">
              <h2 className="text-xl font-semibold">作成途中の記事</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {drafts.map((draft) => (
                  <Link
                    key={draft.id}
                    href={`/blog/${draft.id}`}
                    className="block rounded-lg border border-black/[.08] bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:border-white/[.145]"
                  >
                    <h3 className="text-xl font-bold">
                      {draft.title || "無題"}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
