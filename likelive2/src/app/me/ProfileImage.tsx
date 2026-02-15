"use client";

import { normalizeImageUrl } from "@/lib/utils/image-url";
import Image from "next/image";
import { useState } from "react";

type Props = {
  profileImageUrl: string | null;
};

export function ProfileImage({ profileImageUrl }: Props) {
  const [imageError, setImageError] = useState(false);

  if (profileImageUrl && !imageError) {
    return (
      <div className="relative h-12 w-12 overflow-hidden rounded-full">
        <Image
          src={normalizeImageUrl(profileImageUrl)}
          alt="Profile Image"
          width={48}
          height={48}
          className="rounded-full"
          onError={() => {
            // 画像の読み込みに失敗した場合、デフォルトアイコンを表示
            setImageError(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
      <span className="text-black text-xl">👤</span>
    </div>
  );
}

