import type { ProfileViewDto } from "@/types/profile";
import { ProfileContentClient } from "./ProfileContentClient";

type Props = {
  profile: ProfileViewDto;
  isOwnProfile: boolean;
  currentUserId: number | null;
  isLoggedIn: boolean;
  drafts?: Array<{ id: number; title: string | null }>;
  archives?: Array<{ id: number; title: string | null }>;
};

export function ProfileContent({
  profile,
  isOwnProfile,
  currentUserId,
  isLoggedIn,
  drafts = [],
  archives = [],
}: Props) {
  return (
    <ProfileContentClient
      profile={profile}
      isOwnProfile={isOwnProfile}
      currentUserId={currentUserId}
      isLoggedIn={isLoggedIn}
      drafts={drafts}
      archives={archives}
    />
  );
}
