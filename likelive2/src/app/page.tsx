import { getCurrentUserAction } from "@/app/actions";
import { buildGoogleAuthUrl } from "@/lib/utils/auth-helper";
import Image from "next/image";
import Link from "next/link";
import Footer from "./components/Footer";
import { Header } from "./components/Header";

// 動的レンダリングを強制（ビルド時にデータベースに接続しないようにする）
export const dynamic = "force-dynamic";

export default async function Home() {
  let user: Awaited<ReturnType<typeof getCurrentUserAction>> | null = null;
  try {
    user = await getCurrentUserAction();
  } catch {
    // 未認証の場合はnullのまま
    user = null;
  }

  const authUrl = buildGoogleAuthUrl();

  return (
    <div className="Top">
      <div className="bg-black">
        {/* ヘッダー */}
        <div className="top-0 left-0 w-full z-10">
          <Header user={user} />
        </div>

        {/* タイトルセクション */}
        <section
          className="relative h-screen bg-cover bg-center border-b border-b-white"
          style={{ backgroundImage: "url(/top.png)" }}
        >
          {/* 左上のタイトル要素 */}
          <div className="absolute top-5 left-5 text-white pt-24">
            <h1 className="text-6xl font-bold">LikeLive</h1>
            <h1 className="text-5xl font-bold">「好きなもの」を語る場所</h1>
            <h5 className="mt-4 text-3xl pt-10 before:content-['•'] before:mr-2">
              アプリの役割
            </h5>
            <p className="mt-1 text-2xl">
              好きなアーティストについて発信するためのプラットフォームです
            </p>
            <p className="mt-1 text-2xl">
              あなたのニッチな趣味が刺さる人に向けて
            </p>
          </div>

          {/* 中央下部に配置されたボタン要素 */}
          {!user && (
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2">
              <Link
                href={authUrl}
                className="px-5 py-3 bg-teal-500 text-white rounded-full shadow-lg hover:bg-teal-600"
              >
                Google連携で始める
              </Link>
            </div>
          )}
        </section>

        {/* ブログセクション */}
        <section className="section-blog my-5 text-center border-b border-b-white">
          <h2 className="text-6xl font-bold mb-3 text-white text-left pl-2">
            ブログ
          </h2>
          {/* 画像を中央寄せ、左右に10%の余白、下に5%の余白 */}
          <div>
            <picture>
              {/* スマートフォン用画像 */}
              <source media="(max-width: 768px)" srcSet="/blog_small.jpeg" />
              {/* デスクトップ用画像 */}
              <source media="(min-width: 769px)" srcSet="/blog_large.jpeg" />

              {/* デフォルト画像（<img>タグのsrc属性） */}
              <Image
                src="/blog_small.jpeg"
                alt="ブログのイメージ"
                width={800}
                height={600}
                className="h-auto mx-auto w-4/5 mb-8"
              />
            </picture>
          </div>
        </section>

        {/* フォローセクション */}
        <section className="section-follow my-5 text-center border-b border-b-white">
          <h2 className="text-6xl font-bold mb-3 text-white text-left pl-2">
            フォロー
          </h2>
          <div>
            <picture>
              {/* スマートフォン用画像 */}
              <source media="(max-width: 768px)" srcSet="/follow_small.jpeg" />
              {/* デスクトップ用画像 */}
              <source media="(min-width: 769px)" srcSet="/follow_large.jpeg" />

              {/* デフォルト画像（<img>タグのsrc属性） */}
              <Image
                src="/follow_small.jpeg"
                alt="フォローのイメージ"
                width={800}
                height={600}
                className="h-auto mx-auto w-4/5 mb-8"
              />
            </picture>
          </div>
        </section>

        {/* 友達コンテンツ */}
        <section className="main-content text-white py-10 border-b border-b-white">
          {/* 見出し（左寄せ） */}
          <h2 className="text-4xl mb-5 pl-2 text-left font-bold">
            自己満足で繋がる
          </h2>

          {/* 横に2等分のコンテンツ（画像左、説明右） */}
          <div className="flex flex-col md:flex-row items-center p-5">
            {/* 画像部分（左側） */}
            <div className="w-full md:w-1/2 mb-5 md:mb-0">
              <Image
                src="/friend.png"
                alt="友達コンテンツ"
                width={400}
                height={400}
                className="w-4/5 mx-auto"
              />
            </div>

            {/* 説明部分（右側） */}
            <div className="w-full md:w-1/2 text-left md:pl-8">
              <p className="text-lg mb-3">オタク会話が通じる楽しさ</p>
              <p className="text-lg">
                LikeLiveは、音楽好きのための専用プラットフォームです。自分が好きな音楽、アーティストについて自由に発言できる場所と共感できるユーザとの交流を提供します。
              </p>
            </div>
          </div>
        </section>

        {/* フッター */}
        <Footer />
      </div>
    </div>
  );
}
