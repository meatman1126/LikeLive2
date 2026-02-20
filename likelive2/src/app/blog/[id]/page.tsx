import {
  getBlogByIdAction,
  getCurrentUserAction,
  getPublicBlogArtistsAction,
  getPublicBlogCommentsAction,
  isBlogLikedAction,
} from "@/app/actions";
import { BlogContentRenderer } from "@/app/components/BlogContentRenderer";
import { Header } from "@/app/components/Header";
import { ArtistImage } from "@/app/me/ArtistImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogInteractions } from "./BlogInteractions";
import { BlogLikeButton } from "./BlogLikeButton";
import { CommentList } from "./CommentList";
import { SetlistAccordion } from "./SetlistAccordion";

// 動的レンダリングを強制
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

type SetlistTrack = { trackName?: string; trackNumber?: number };

/** mainSetList / encoreSections 形式のセットリストJSONをパースする */
function parseSetlist(setlist: unknown): {
  mainSetList: SetlistTrack[];
  encoreSections: SetlistTrack[][];
} | null {
  if (setlist == null || typeof setlist !== "object") return null;
  const o = setlist as Record<string, unknown>;
  const mainSetList: SetlistTrack[] = Array.isArray(o.mainSetList)
    ? o.mainSetList
    : [];
  const rawEncores = Array.isArray(o.encoreSections) ? o.encoreSections : [];
  const encoreSections: SetlistTrack[][] = rawEncores.filter(
    (s): s is SetlistTrack[] => Array.isArray(s),
  );
  const hasMain = mainSetList.length > 0;
  const hasEncores = encoreSections.some((s) => s.length > 0);
  if (!hasMain && !hasEncores) return null;
  return { mainSetList, encoreSections };
}

export default async function BlogDetailPage({ params }: Props) {
  const { id } = await params;
  const blogId = Number(id);

  // 1. ログイン状態を先にチェック
  let isLoggedIn = false;
  let currentUser = null;
  try {
    currentUser = await getCurrentUserAction();
    isLoggedIn = true;
  } catch {
    isLoggedIn = false;
  }

  // 2. ブログ取得（ステータス不問）
  const blog = await getBlogByIdAction(blogId);

  // 3. 非公開ブログは著者本人のみ閲覧可能
  const isPublished = blog.status === "PUBLISHED";
  if (!isPublished && (!isLoggedIn || blog.authorId !== currentUser?.id)) {
    notFound();
  }

  // 4. 関連データ取得
  const [comments, artists, initialLiked] = await Promise.all([
    getPublicBlogCommentsAction(blogId),
    getPublicBlogArtistsAction(blogId),
    isLoggedIn ? isBlogLikedAction(blogId) : Promise.resolve(false),
  ]);

  const isAuthor =
    isLoggedIn && currentUser != null && blog.authorId === currentUser.id;
  const setlistData = parseSetlist(blog.setlist);
  const hasSetlist =
    setlistData != null &&
    (setlistData.mainSetList.length > 0 ||
      setlistData.encoreSections.some((s) => s.length > 0));

  return (
    <>
      <Header user={currentUser} />
      <div className="container mx-auto p-4 font-sans">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-white px-6 py-12">
          {/* 下書き・非公開の但し書きバナー */}
          {!isPublished && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-sm text-amber-700">
                {blog.status === "DRAFT"
                  ? "この記事は下書きです。公開されるまで他のユーザーには表示されません。"
                  : "この記事は非公開です。他のユーザーには表示されません。"}
              </p>
            </div>
          )}

          {/* 編集ボタン（著者のみ・サムネイルの上） */}
          {isAuthor && (
            <div className="flex justify-end">
              <Link
                href={`/blog/edit/${blogId}`}
                className="flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                編集
              </Link>
            </div>
          )}

          {/* サムネイル画像（タイトルより上） */}
          {blog.thumbnailUrl ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <img
                src={blog.thumbnailUrl}
                alt=""
                className="aspect-video w-full object-cover"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-700">
              {blog.title}
            </h1>
            {isPublished && (
              <div className="pt-1">
                <BlogLikeButton
                  blogId={blogId}
                  initialLiked={initialLiked}
                  initialLikeCount={blog.likeCount ?? 0}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            )}
          </div>

          {artists.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-700 mb-4">
                本ブログに関連するアーティスト
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center gap-3 rounded-lg bg-gray-100 p-3 shadow-md"
                  >
                    <ArtistImage
                      imageUrl={artist.imageUrl}
                      artistName={artist.name}
                    />
                    <p className="text-sm font-medium text-gray-700">
                      {artist.name}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <article className="prose prose-zinc max-w-none">
            <BlogContentRenderer content={blog.content} />
          </article>

          {hasSetlist && setlistData && (
            <SetlistAccordion
              mainSetList={setlistData.mainSetList}
              encoreSections={setlistData.encoreSections}
            />
          )}

          {isPublished && (
            <BlogInteractions blogId={blogId} isLoggedIn={isLoggedIn} />
          )}

          {isPublished && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-700">Comments</h2>
              {comments.length === 0 ? (
                <p className="text-sm text-gray-700">
                  まだコメントはありません。
                </p>
              ) : (
                <CommentList
                  comments={comments}
                  blogId={blogId}
                  isLoggedIn={isLoggedIn}
                  currentUserId={currentUser?.id ?? null}
                />
              )}
            </section>
          )}
        </main>
      </div>
    </>
  );
}
