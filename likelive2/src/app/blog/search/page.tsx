import {
  getCurrentUserAction,
  getInterestBlogsAction,
  getPublicRecommendedBlogsAction,
  searchBlogsByArtistAction,
} from "@/app/actions";
import { Header } from "@/app/components/Header";
import { normalizeImageUrl } from "@/lib/utils/image-url";
import Image from "next/image";
import Link from "next/link";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// 動的レンダリングを強制
export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BlogSearchPage({ searchParams }: Props) {
  let currentUser: Awaited<ReturnType<typeof getCurrentUserAction>> | null =
    null;
  try {
    currentUser = await getCurrentUserAction();
  } catch {
    currentUser = null;
  }

  const sp = (await searchParams) ?? {};
  const artist = (first(sp.artist) ?? "").trim();
  const page = Number(first(sp.page) ?? "1") || 1;
  const limit = Number(first(sp.limit) ?? "10") || 10;

  const result = artist
    ? await searchBlogsByArtistAction(artist, page, limit)
    : null;

  type BlogCardItem = {
    id: number;
    title: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    author?: { displayName: string | null; profileImageUrl: string | null };
  };
  // 初期表示時（アーティスト未検索）はおすすめブログを表示（表示用の共通型で受け取り）
  let recommendedBlogs: BlogCardItem[] = [];
  if (!artist) {
    if (currentUser) {
      try {
        recommendedBlogs = await getInterestBlogsAction();
      } catch {
        recommendedBlogs = await getPublicRecommendedBlogsAction(50);
      }
    } else {
      recommendedBlogs = await getPublicRecommendedBlogsAction(50);
    }
  }
  const blogsToShow: BlogCardItem[] =
    artist && result ? result.data : recommendedBlogs;

  return (
    <>
      <Header user={currentUser} />
      <div className="container mx-auto p-4 font-sans">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-white px-6 py-12">
          <section className="space-y-4">
            <h1 className="text-xl font-semibold text-gray-700">ブログ検索</h1>

            <form
              className="flex flex-col gap-3"
              action="/blog/search"
              method="GET"
            >
              <div className="flex gap-2">
                <input
                  id="artist"
                  name="artist"
                  defaultValue={artist}
                  placeholder="アーティスト名で検索..."
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  検索
                </button>
              </div>
              <input type="hidden" name="page" value={String(page)} />
              <input type="hidden" name="limit" value={String(limit)} />
            </form>

            {!artist && (
              <p className="text-sm text-gray-500">
                アーティスト名を入力すると、そのアーティストに関連するブログを検索できます。
              </p>
            )}

            {blogsToShow.length > 0 ? (
              <div className="mt-8 space-y-4">
                <h2 className="text-sm font-semibold text-gray-600">
                  {artist ? "検索結果" : "おすすめのブログ"}
                </h2>
                <div className="space-y-3">
                  {blogsToShow.map((blog) => (
                    <Link
                      key={blog.id}
                      href={`/blog/${blog.id}`}
                      className="block rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                    >
                      {blog.thumbnailUrl ? (
                        <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                          <Image
                            src={normalizeImageUrl(blog.thumbnailUrl)}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 672px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-gray-100">
                          <span className="text-sm text-gray-400">画像なし</span>
                        </div>
                      )}
                      <div className="p-4">
                        <h2 className="text-base font-semibold text-gray-800">
                          {blog.title}
                        </h2>
                        {blog.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                            {blog.description}
                          </p>
                        ) : null}
                        <div className="mt-3 flex items-center gap-3">
                          {blog.author?.profileImageUrl ? (
                            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                              <Image
                                src={normalizeImageUrl(
                                  blog.author.profileImageUrl,
                                )}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                              <span className="text-xs text-gray-500">👤</span>
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700">
                            {blog.author?.displayName ?? "unknown"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : artist ? (
              <p className="text-sm text-gray-500">
                このアーティストに関連するブログは見つかりませんでした。
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                おすすめのブログはまだありません。
              </p>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
