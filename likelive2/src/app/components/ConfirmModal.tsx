"use client";

import { useEffect, useState } from "react";

export type AnimationType =
  | "fade"
  | "scale"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "zoom"
  | "bounce";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: "red" | "blue" | "gray";
  isLoading?: boolean;
  animationType?: AnimationType;
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "確認",
  cancelText = "キャンセル",
  confirmButtonColor = "red",
  isLoading = false,
  animationType = "scale",
}: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // アニメーションのために少し遅延させて表示
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const confirmButtonClass =
    confirmButtonColor === "red"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : confirmButtonColor === "blue"
      ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
      : "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500";

  // アニメーションクラスを取得
  const getAnimationClasses = () => {
    const baseClasses = "transition-all duration-300";
    const visibleClasses = "opacity-100";
    const hiddenClasses = "opacity-0";

    switch (animationType) {
      case "fade":
        return {
          container: `${baseClasses} ${
            isVisible ? visibleClasses : hiddenClasses
          }`,
          modal: `${baseClasses} ${isVisible ? visibleClasses : hiddenClasses}`,
        };
      case "scale":
        return {
          container: `${baseClasses} ${
            isVisible ? visibleClasses : hiddenClasses
          }`,
          modal: `${baseClasses} ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`,
        };
      case "slide-up":
        return {
          container: `${baseClasses} ${
            isVisible ? visibleClasses : hiddenClasses
          }`,
          modal: `${baseClasses} ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`,
        };
      case "slide-down":
        return {
          container: `${baseClasses} ${
            isVisible ? visibleClasses : hiddenClasses
          }`,
          modal: `${baseClasses} ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`,
        };
      case "slide-left":
        return {
          container: `${baseClasses} ${
            isVisible ? visibleClasses : hiddenClasses
          }`,
          modal: `${baseClasses} ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          }`,
        };
      case "slide-right":
        return {
          container: `${baseClasses} ${
            isVisible ? visibleClasses : hiddenClasses
          }`,
          modal: `${baseClasses} ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
          }`,
        };
      case "zoom":
        return {
          container: `${baseClasses} ${
            isVisible ? visibleClasses : hiddenClasses
          }`,
          modal: `${baseClasses} ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`,
        };
      case "bounce":
        return {
          container: `${baseClasses} ${
            isVisible ? visibleClasses : hiddenClasses
          }`,
          modal: `${baseClasses} ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`,
        };
      default:
        return {
          container: `${baseClasses} ${
            isVisible ? visibleClasses : hiddenClasses
          }`,
          modal: `${baseClasses} ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`,
        };
    }
  };

  const animationClasses = getAnimationClasses();

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30 ${animationClasses.container}`}
      onClick={handleCancel}
    >
      <div
        className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 ${animationClasses.modal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${confirmButtonClass}`}
          >
            {isLoading ? "処理中..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
