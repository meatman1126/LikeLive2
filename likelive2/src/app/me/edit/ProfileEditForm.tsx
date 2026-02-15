"use client";

import { saveFileAction, updateUserAction } from "@/app/actions";
import { ProfileImageCropper } from "@/app/components/ProfileImageCropper";
import { normalizeImageUrl } from "@/lib/utils/image-url";
import type { ProfileViewDto } from "@/types/profile";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Artist = {
  id: string;
  name: string | null;
  imageUrl: string | null;
};

type Props = {
  initialProfile: ProfileViewDto;
  initialArtists: Artist[];
};

export function ProfileEditForm({ initialProfile, initialArtists }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profile, setProfile] = useState<any>(initialProfile);
  const [availableArtists, setAvailableArtists] =
    useState<Artist[]>(initialArtists);
  const [searchArtistName, setSearchArtistName] = useState("");
  const [artistSuggestions, setArtistSuggestions] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleArtistSearch = async () => {
    if (!searchArtistName.trim()) {
      setArtistSuggestions([]);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      // Spotify APIを使用してアーティストを検索
      const tokenResponse = await fetch("/api/spotify/get-token");

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        setSearchError(
          errorData.error?.message || "Spotify認証情報が設定されていません"
        );
        setArtistSuggestions([]);
        setIsSearching(false);
        return;
      }

      const tokenData = await tokenResponse.json();

      if (!tokenData.success || !tokenData.data) {
        setSearchError("Spotifyアクセストークンの取得に失敗しました");
        setArtistSuggestions([]);
        setIsSearching(false);
        return;
      }

      const spotifyAccessToken = tokenData.data.access_token;

      if (!spotifyAccessToken) {
        setSearchError("Spotifyアクセストークンが取得できませんでした");
        setArtistSuggestions([]);
        setIsSearching(false);
        return;
      }

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          searchArtistName
        )}&type=artist&limit=3`,
        {
          headers: {
            Authorization: `Bearer ${spotifyAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const items = data.artists?.items || [];
      setArtistSuggestions(items);
      setSearchError(null);
    } catch (error) {
      console.error("アーティスト検索エラー:", error);
      setSearchError(
        error instanceof Error ? error.message : "不明なエラーが発生しました"
      );
      setArtistSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addFavoriteArtist = (artist: any) => {
    const newArtist: Artist = {
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url || null,
    };
    setProfile((prev: any) => ({
      ...prev,
      favoriteArtistList: [...(prev.favoriteArtistList || []), newArtist],
    }));
    setArtistSuggestions((prev) =>
      prev.filter((suggestion) => suggestion.id !== artist.id)
    );
    setSearchArtistName("");
  };

  const removeArtist = (artistId: string) => {
    setProfile((prev: any) => ({
      ...prev,
      favoriteArtistList: (prev.favoriteArtistList || []).filter(
        (a: Artist) => a.id !== artistId
      ),
    }));
  };

  const handleProfileImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setSelectedImage(imageUrl);
        setCroppedImageUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setCroppedImageUrl(croppedImageUrl);
    setSelectedImage(null);
  };

  const handleCancelCrop = () => {
    setSelectedImage(null);
    setCroppedImageUrl(null);
  };

  const handleSave = async () => {
    if (!profile) return;

    startTransition(async () => {
      try {
        let profileImageUrl: string | null = profile.profileImageUrl || null;

        // プロフィール画像をアップロード
        if (croppedImageUrl) {
          // blob URLからblobを取得
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

          const formData = new FormData();
          formData.append("file", file);
          const result = await saveFileAction(formData);
          // Supabase Storageの場合はURL、ローカルストレージの場合はパスを返す
          profileImageUrl =
            result.url || `/api/public/files/${result.filename}`;
        }

        // favoriteArtistListがundefinedの場合は空配列として扱う
        const favoriteArtistList = profile.favoriteArtistList || [];

        await updateUserAction({
          displayName: profile.displayName,
          selfIntroduction: profile.selfIntroduction,
          favoriteArtistList,
          profileImageUrl,
        });

        // router.pushだけで十分（refreshは不要）
        router.push("/me");
      } catch (error) {
        console.error("プロフィールの更新に失敗しました:", error);
        alert("プロフィールの更新に失敗しました");
      }
    });
  };

  const handleCancel = () => {
    router.push("/me");
  };

  return (
    <div className="container mx-auto p-4 font-sans">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-white px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            プロフィール編集
          </h1>
        </div>

        <div className="space-y-6">
          {/* プロフィール画像と自己紹介 */}
          <section className="rounded-lg border border-black/[.08] bg-white p-6 text-sm shadow-lg dark:border-white/[.145]">
            <div className="flex flex-col md:flex-row md:items-start mb-6">
              <div className="mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                  id="profileImageInput"
                />
                {selectedImage && (
                  <ProfileImageCropper
                    imageUrl={selectedImage}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCancelCrop}
                  />
                )}
                {croppedImageUrl && !selectedImage && (
                  <div
                    className="relative w-32 h-32 cursor-pointer"
                    onClick={() =>
                      document.getElementById("profileImageInput")?.click()
                    }
                  >
                    <Image
                      src={croppedImageUrl}
                      alt="プロフィール画像プレビュー"
                      width={128}
                      height={128}
                      className="rounded-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faCamera}
                        className="text-white text-3xl"
                      />
                    </div>
                  </div>
                )}
                {!croppedImageUrl &&
                  !selectedImage &&
                  profile.profileImageUrl && (
                    <div
                      className="relative w-32 h-32 cursor-pointer"
                      onClick={() =>
                        document.getElementById("profileImageInput")?.click()
                      }
                    >
                      <Image
                        src={normalizeImageUrl(profile.profileImageUrl)}
                        alt="現在のプロフィール画像"
                        width={128}
                        height={128}
                        className="rounded-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faCamera}
                          className="text-white text-3xl"
                        />
                      </div>
                    </div>
                  )}
                {!croppedImageUrl &&
                  !selectedImage &&
                  !profile.profileImageUrl && (
                    <div
                      className="relative w-32 h-32 cursor-pointer bg-gray-200 rounded-full flex items-center justify-center"
                      onClick={() =>
                        document.getElementById("profileImageInput")?.click()
                      }
                    >
                      <span className="text-6xl text-gray-400">👤</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faCamera}
                          className="text-gray-600 text-3xl"
                        />
                      </div>
                    </div>
                  )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-900"
                    htmlFor="displayName"
                  >
                    表示名
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={profile.displayName || ""}
                    onChange={handleChange}
                    placeholder="ユーザ名を入力"
                    className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-900"
                    htmlFor="selfIntroduction"
                  >
                    自己紹介
                  </label>
                  <textarea
                    id="selfIntroduction"
                    name="selfIntroduction"
                    value={profile.selfIntroduction || ""}
                    onChange={handleChange}
                    placeholder="プロフィールを入力"
                    rows={4}
                    className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 好きなアーティスト */}
          <section className="rounded-lg border border-black/[.08] bg-white p-6 text-sm shadow-lg dark:border-white/[.145]">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Favorite Artists
            </h2>

            {/* アーティスト検索 */}
            <div className="mb-4 flex gap-2 min-w-0">
              <input
                type="text"
                placeholder="アーティスト名を入力"
                value={searchArtistName}
                onChange={(e) => {
                  setSearchArtistName(e.target.value);
                  setSearchError(null);
                  setHasSearched(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleArtistSearch();
                  }
                }}
                className="flex-1 min-w-0 rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                disabled={isSearching}
              />
              <button
                type="button"
                onClick={handleArtistSearch}
                disabled={isSearching || !searchArtistName.trim()}
                className="flex-shrink-0 whitespace-nowrap rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? "検索中..." : "検索"}
              </button>
            </div>

            {/* エラーメッセージ */}
            {searchError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{searchError}</p>
              </div>
            )}

            {/* 検索結果 */}
            {hasSearched && !isSearching && (
              <div className="mb-4">
                {artistSuggestions.length > 0 ? (
                  <ul className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-black/[.08] bg-white dark:border-white/[.145]">
                    {artistSuggestions.map((artist) => (
                      <li
                        key={artist.id}
                        className="flex cursor-pointer items-center gap-4 p-3 hover:bg-gray-100 transition-colors rounded-md"
                        onClick={() => addFavoriteArtist(artist)}
                      >
                        {artist.images && artist.images.length > 0 ? (
                          <Image
                            src={artist.images[0].url}
                            alt={artist.name || "アーティスト"}
                            width={48}
                            height={48}
                            className="rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-500 text-xl">🎵</span>
                          </div>
                        )}
                        <h3 className="font-medium text-gray-900 flex-1">
                          {artist.name}
                        </h3>
                        <span className="text-blue-500 text-sm">追加</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center">
                    <p className="text-sm text-gray-600">
                      検索結果がありません
                    </p>
                  </div>
                )}
              </div>
            )}

            {profile.favoriteArtistList &&
              profile.favoriteArtistList.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  {profile.favoriteArtistList.map((artist: Artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center gap-3 rounded-lg border border-black/[.08] bg-gray-100 p-3 text-sm shadow-lg transition-shadow hover:shadow-xl dark:border-white/[.145]"
                    >
                      {artist.imageUrl && (
                        <Image
                          src={artist.imageUrl}
                          alt={artist.name || ""}
                          width={48}
                          height={48}
                          className="rounded-full flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 font-medium text-gray-900">
                        {artist.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeArtist(artist.id)}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        aria-label="アーティストを削除"
                      >
                        <span className="text-xl leading-none">×</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </section>

          {/* ボタン */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-md bg-green-500 px-8 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-md bg-gray-500 px-8 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-60"
            >
              キャンセル
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
