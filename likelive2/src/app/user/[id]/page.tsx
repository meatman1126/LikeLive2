import { getCurrentUserAction, getUserProfileAction } from "@/app/actions";
import { Header } from "@/app/components/Header";
import { ProfileContent } from "@/app/components/ProfileContent";
import { redirect } from "next/navigation";

// 動的レンダリングを強制
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  const targetUserId = Number(id);

  // ミドルウェアで認証チェック済みのため、認証エラーは発生しない想定
  const user = await getCurrentUserAction();
  const isLoggedIn = true;
  const currentUserId = user.id;

  const profile = await getUserProfileAction(targetUserId);

  // 自分自身のプロフィールを見に来た場合は /me へ
  if (currentUserId === profile.userId) {
    redirect("/me");
  }

  return (
    <div>
      <Header user={user} />
      <ProfileContent
        profile={profile}
        isOwnProfile={false}
        currentUserId={currentUserId}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
