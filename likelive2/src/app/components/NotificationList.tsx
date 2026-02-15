"use client";

import {
  getUnreadNotificationsAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Notification = {
  id: number;
  notificationType: string;
  isRead: boolean;
  triggerUser: {
    id: number;
    displayName: string | null;
  } | null;
  relatedBlog: {
    id: number;
  } | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function NotificationList({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await getUnreadNotificationsAction();
      setNotifications(result);
    } catch (error) {
      console.error("通知の取得に失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNotificationMessage = (notification: Notification) => {
    switch (notification.notificationType) {
      case "BLOG_CREATED":
        return `${notification.triggerUser?.displayName || "ユーザー"}が新規でブログを作成しました。`;
      case "COMMENT":
        return `${notification.triggerUser?.displayName || "ユーザー"}があなたのブログにコメントしました。`;
      case "FOLLOW":
        return `${notification.triggerUser?.displayName || "ユーザー"}があなたをフォローしました。`;
      default:
        return "不明な通知タイプです。";
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.isRead) return;

    startTransition(async () => {
      try {
        await markNotificationAsReadAction(notification.id);

        // 通知タイプに基づいて遷移
        switch (notification.notificationType) {
          case "BLOG_CREATED":
            if (notification.relatedBlog) {
              router.push(`/blog/${notification.relatedBlog.id}`);
            }
            break;
          case "FOLLOW":
            if (notification.triggerUser) {
              router.push(`/user/${notification.triggerUser.id}`);
            }
            break;
          case "COMMENT":
            if (notification.relatedBlog) {
              router.push(`/blog/${notification.relatedBlog.id}`);
            }
            break;
        }
        onClose();
      } catch (error) {
        console.error("通知処理でエラーが発生しました:", error);
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    startTransition(async () => {
      try {
        await markAllNotificationsAsReadAction();
        await loadNotifications();
      } catch (error) {
        console.error("全て既読にする処理に失敗しました:", error);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div 
        className="fixed z-50 mt-2 bg-white shadow-lg rounded-md overflow-hidden" 
        style={{ 
          width: 'min(320px, calc(100vw - 2rem))',
          maxHeight: 'calc(100vh - 4rem)',
          right: '1rem',
          top: 'calc(3.5rem + 0.5rem)'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between bg-green-100 p-2 flex-shrink-0">
        <h3 className="text-lg font-bold text-black">未読通知リスト</h3>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="rounded-md bg-blue-400 px-2 py-1 text-xs text-white hover:underline disabled:opacity-60"
            >
              全て既読にする
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            ×
          </button>
        </div>
      </div>

      {/* 通知リスト */}
      {isLoading ? (
        <div className="p-4 text-center text-sm text-gray-500">
          読み込み中...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          新しい通知はありません
        </div>
      ) : (
        <ul className="max-h-[calc(100vh-250px)] space-y-0 overflow-y-auto text-sm">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`cursor-pointer border-b border-black px-4 py-2 ${
                notification.isRead
                  ? "bg-gray-300"
                  : "bg-white font-bold text-black hover:bg-gray-100"
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              {generateNotificationMessage(notification)}
            </li>
          ))}
        </ul>
      )}
    </div>
    </>
  );
}

