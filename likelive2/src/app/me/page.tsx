import {
  getCurrentUserAction,
  getMyArchivesAction,
  getMyDraftsAction,
  getMyProfileAction,
} from "@/app/actions";
import { Header } from "@/app/components/Header";
import { ProfileContent } from "@/app/components/ProfileContent";

// 動的レンダリングを強制
export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  // ミドルウェアで認証チェック済みのため、認証エラーは発生しない想定
  const profile = await getMyProfileAction();
  const user = await getCurrentUserAction();

  const [drafts, archives] = await Promise.all([
    getMyDraftsAction(),
    getMyArchivesAction(),
  ]);

  return (
    <div>
      <Header user={user} />
      <ProfileContent
        profile={profile}
        isOwnProfile={true}
        currentUserId={user?.id ?? null}
        isLoggedIn={user !== null}
        drafts={drafts}
        archives={archives}
      />
    </div>
  );
}
