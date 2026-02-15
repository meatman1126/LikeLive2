import { getMyArtistsAction, getMyProfileAction } from "@/app/actions";
import { ProfileEditForm } from "./ProfileEditForm";

// 動的レンダリングを強制
export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  // ミドルウェアで認証チェック済みのため、認証エラーは発生しない想定
  const [profile, artists] = await Promise.all([
    getMyProfileAction(),
    getMyArtistsAction(),
  ]);

  return (
    <ProfileEditForm
      initialProfile={profile}
      initialArtists={artists.map((a) => ({
        id: a.id,
        name: a.name,
        imageUrl: a.imageUrl,
      }))}
    />
  );
}
