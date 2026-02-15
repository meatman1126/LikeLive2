"use client";

import { Slider } from "@mui/material";
import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/utils/cropImageToCanvas";

type Props = {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
};

export function ProfileImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
}: Props) {
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
      onCropComplete(croppedImage);
    } catch (error) {
      console.error("画像の切り取りに失敗しました:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-lg">
        <div className="relative w-full h-64 mb-4">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="round"
          />
        </div>
        <div className="space-y-4">
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
          <div className="flex gap-2">
            <button
              onClick={handleCrop}
              className="flex-1 rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              画像を切り取る
            </button>
            <button
              onClick={onCancel}
              className="flex-1 rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

