"use client";

import { Slider } from "@mui/material";
import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/utils/cropImageToCanvas";

type Props = {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
};

export function ThumbnailCropper({ imageUrl, onCropComplete }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback(
    (
      _: { x: number; y: number },
      croppedAreaPixels: { x: number; y: number; width: number; height: number }
    ) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = async () => {
    if (!croppedAreaPixels) {
      console.error("クロップ領域が設定されていません");
      return;
    }

    try {
      const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
      onCropComplete(croppedImage); // 親コンポーネントに切り取られた画像を渡す
    } catch (error) {
      console.error("画像の切り取りに失敗しました:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full h-96 bg-black">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9} // 固定アスペクト比
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
        />
      </div>
      <div className="space-y-2">
        <div className="px-4">
          <label className="block text-sm font-medium mb-2">ズーム</label>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, value) => setZoom(value as number)}
            valueLabelDisplay="auto"
          />
        </div>
        <button
          onClick={handleCrop}
          className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          切り取りを保存
        </button>
      </div>
    </div>
  );
}

