import {
  getCurrentUserAction,
  getInterestBlogsAction,
  getMyDraftsAction,
  getMyProfileAction,
  getRecommendedUsersAction,
} from "@/app/actions";
import { Header } from "@/app/components/Header";
import { DashboardClient } from "./DashboardClient";

// 動的レンダリングを強制
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // ミドルウェアで認証チェック済みのため、認証エラーは発生しない想定
  const [profile, currentUser] = await Promise.all([
    getMyProfileAction(),
    getCurrentUserAction(),
  ]);

  // 初回ログイン判定（updatedByが"System"の場合は初回ログイン）
  const isFirstLogin = currentUser.updatedBy === "System";

  const [interestBlogs, recommendedUsers, drafts] = await Promise.all([
    getInterestBlogsAction(),
    getRecommendedUsersAction(),
    getMyDraftsAction(),
  ]);

  return (
    <>
      <Header user={currentUser} />
      <DashboardClient
        isFirstLogin={isFirstLogin}
        initialUsername={profile.displayName}
        interestBlogs={interestBlogs}
        recommendedUsers={recommendedUsers}
        drafts={drafts}
      />
    </>
  );
}
