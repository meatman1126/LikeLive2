"use client";

import { normalizeImageUrl } from "@/lib/utils/image-url";
import Image from "next/image";
import { useState } from "react";

type Props = {
  thumbnailUrl: string | null;
  blogTitle: string;
};

export function BlogThumbnail({ thumbnailUrl, blogTitle }: Props) {
  const [imageError, setImageError] = useState(false);

  if (thumbnailUrl && !imageError) {
    return (
      <div className="relative h-48 w-full overflow-hidden rounded-lg">
        <Image
          src={normalizeImageUrl(thumbnailUrl)}
          alt={`${blogTitle}のサムネイル`}
          fill
          className="object-cover"
          onError={() => {
            // 画像の読み込みに失敗した場合、デフォルトアイコンを表示
            setImageError(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-48 w-full items-center justify-center rounded-lg bg-gray-200">
      <span className="text-4xl">📝</span>
    </div>
  );
}

