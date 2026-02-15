"use client";

import {
  getGoogleAuthUrlAction,
  getUnreadNotificationsAction,
  logoutAction,
} from "@/app/actions";
import { normalizeImageUrl } from "@/lib/utils/image-url";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { NotificationList } from "./NotificationList";

type Props = {
  user: {
    id: number;
    displayName: string | null;
    profileImageUrl: string | null;
  } | null;
};

export function Header({ user }: Props) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [profileImageError, setProfileImageError] = useState(false);

  const navigatePage = (path: string) => {
    setIsMenuOpen(false);
    router.push(path);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleBlogModal = () => {
    setIsBlogModalOpen(!isBlogModalOpen);
  };

  const toggleUserModal = () => {
    setIsUserModalOpen(!isUserModalOpen);
  };

  const toggleNotificationMenu = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  // 通知データの取得
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const result = await getUnreadNotificationsAction();
          setNotifications(result);
        } catch (error) {
          console.error("通知データの取得に失敗しました:", error);
        }
      }
    };

    fetchNotifications();
  }, [user]);

  // ユーザーが変更されたらプロフィール画像エラーをリセット
  useEffect(() => {
    setProfileImageError(false);
  }, [user?.profileImageUrl]);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const handleLogout = async () => {
    startTransition(async () => {
      await logoutAction();
      setIsMenuOpen(false);
      router.push("/");
      router.refresh();
    });
  };

  const handleLogin = async () => {
    startTransition(async () => {
      const authUrl = await getGoogleAuthUrlAction();
      window.location.href = authUrl;
    });
  };

  return (
    <div>
      <header className="bg-black text-white px-4 md:px-8 py-2 flex items-center justify-between border-b border-b-white">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/icon_header.png"
            alt="LikeLiveロゴ"
            width={40}
            height={40}
            className="mr-3"
          />
          <h5 className="text-sm font-bold font-sans">
            {user ? "LikeLive" : "音楽好きのためのSNS"}
          </h5>
        </div>

        <div className="flex space-x-7 items-center">
          {/* 未認証の場合ログインボタンを表示 */}
          {!user && (
            <button
              onClick={handleLogin}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-transparent border border-white rounded-md hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              サインイン
            </button>
          )}

          {/* 通知アイコン (認証済みの場合のみ) */}
          {user && (
            <div className="relative">
              <button
                className="px-2 py-1 rounded-3xl bg-yellow-300"
                onClick={toggleNotificationMenu}
              >
                <span className="text-white cursor-pointer">🔔</span>
              </button>
              {unreadCount > 0 && (
                <div className="inline">
                  <span className="text-sm text-red-100 bg-red-600 px-1 rounded">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                </div>
              )}
              {/* NotificationListコンポーネントを呼び出し */}
              <NotificationList
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
              />
            </div>
          )}

          {/* ユーザアイコンの表示 (認証済みの場合のみ) */}
          {user && (
            <>
              {user.profileImageUrl && !profileImageError ? (
                <button
                  className="px-2 py-1 w-13 h-13 rounded-full"
                  onClick={() => router.push("/me")}
                >
                  <Image
                    src={normalizeImageUrl(user.profileImageUrl)}
                    alt="Profile Image"
                    width={36}
                    height={36}
                    className="rounded-full"
                    onError={() => {
                      // 画像の読み込みに失敗した場合、デフォルトアイコンを表示
                      setProfileImageError(true);
                    }}
                  />
                </button>
              ) : (
                <button
                  className="px-2 py-1 w-13 h-13 rounded-full bg-white"
                  onClick={() => router.push("/me")}
                >
                  <span className="text-black cursor-pointer">👤</span>
                </button>
              )}
            </>
          )}

          {user && (
            <button
              onClick={toggleMenu}
              type="button"
              className={isMenuOpen ? "z-20 space-y-2 pb-6" : "z-20 space-y-2"}
            >
              <div
                className={
                  isMenuOpen
                    ? "w-8 h-0.5 bg-gray-600 translate-y-2.5 rotate-45 transition duration-500 ease-in-out"
                    : "w-8 h-0.5 bg-gray-300 transition duration-500 ease-in-out"
                }
              />
              <div
                className={
                  isMenuOpen
                    ? "opacity-0 transition duration-500 ease-in-out"
                    : "w-8 h-0.5 bg-gray-300 transition duration-500 ease-in-out"
                }
              />
              <div
                className={
                  isMenuOpen
                    ? "w-8 h-0.5 bg-gray-600 -rotate-45 transition duration-500 ease-in-out"
                    : "w-8 h-0.5 bg-gray-300 transition duration-500 ease-in-out"
                }
              />
            </button>
          )}
        </div>

        {/* nav */}
        <nav
          className={
            isMenuOpen
              ? "z-10 text-left fixed right-0 top-0 sm:w-5/12 w-7/12 h-screen flex flex-col justify-start ease-linear duration-300 bg-green-50"
              : "fixed right-[-100%] ease-linear duration-300"
          }
        >
          <ul className="mt-12 text-black">
            <li
              className="p-2 hover:text-blue-500 cursor-pointer flex justify-between items-center"
              onClick={() => navigatePage("/dashboard")}
            >
              <span className="py-2 inline-block">ダッシュボード</span>
              <span className="text-blue-500 ml-auto mr-2 text-lg">{">"}</span>
            </li>
            <li
              className="p-2 hover:text-blue-500 cursor-pointer flex justify-between items-center"
              onClick={toggleBlogModal}
            >
              <span className="py-2 inline-block">ブログ</span>
              <span className="text-blue-500 ml-auto mr-2 text-lg">
                {isBlogModalOpen ? "-" : "+"}
              </span>
            </li>
            {isBlogModalOpen && (
              <ul className="pl-4 bg-gray-50">
                <li
                  className="p-2 hover:text-blue-500 cursor-pointer flex justify-between items-center"
                  onClick={() => navigatePage("/blog/create")}
                >
                  <span className="py-2 inline-block">ブログを書く</span>
                  <span className="text-blue-500 ml-auto mr-2 text-lg">
                    {">"}
                  </span>
                </li>
                <li
                  className="p-2 hover:text-blue-500 cursor-pointer flex justify-between items-center"
                  onClick={() => navigatePage("/blog/search")}
                >
                  <span className="py-2 inline-block">ブログを検索する</span>
                  <span className="text-blue-500 ml-auto mr-2 text-lg">
                    {">"}
                  </span>
                </li>
              </ul>
            )}
            <li
              className="p-2 hover:text-blue-500 cursor-pointer flex justify-between items-center"
              onClick={toggleUserModal}
            >
              <span className="py-2 inline-block">ユーザ管理</span>
              <span className="text-blue-500 ml-auto mr-2 text-lg">
                {isUserModalOpen ? "-" : "+"}
              </span>
            </li>
            {isUserModalOpen && (
              <ul className="pl-4 bg-gray-50">
                <li
                  className="p-2 hover:text-blue-500 cursor-pointer flex justify-between items-center"
                  onClick={() => navigatePage("/me")}
                >
                  <span className="py-2 inline-block">プロフィール管理</span>
                  <span className="text-blue-500 ml-auto mr-2 text-lg">
                    {">"}
                  </span>
                </li>
                <li
                  className="p-2 hover:text-blue-500 cursor-pointer flex justify-between items-center"
                  onClick={() => navigatePage("/user/search")}
                >
                  <span className="py-2 inline-block">ユーザを検索する</span>
                  <span className="text-blue-500 ml-auto mr-2 text-lg">
                    {">"}
                  </span>
                </li>
              </ul>
            )}
            {user && (
              <li
                className="p-2 hover:text-blue-500 cursor-pointer flex justify-between items-center"
                onClick={handleLogout}
              >
                <span className="py-2 inline-block">ログアウト</span>
                <span className="text-blue-500 ml-auto mr-2 text-lg">
                  {">"}
                </span>
              </li>
            )}
          </ul>
        </nav>
      </header>
    </div>
  );
}
