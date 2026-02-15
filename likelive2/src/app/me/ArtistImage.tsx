"use client";

import { normalizeImageUrl } from "@/lib/utils/image-url";
import Image from "next/image";
import { useState } from "react";

type Props = {
  imageUrl: string | null;
  artistName: string | null;
};

export function ArtistImage({ imageUrl, artistName }: Props) {
  const [imageError, setImageError] = useState(false);

  if (imageUrl && !imageError) {
    return (
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
        <Image
          src={normalizeImageUrl(imageUrl)}
          alt={artistName || "Artist Image"}
          width={40}
          height={40}
          className="rounded-full object-cover"
          onError={() => {
            // 画像の読み込みに失敗した場合、デフォルトアイコンを表示
            setImageError(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
      <span className="text-lg">🎵</span>
    </div>
  );
}

