"use client";

import { initialUpdateUserAction } from "@/app/actions";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  initialUsername: string | null;
  isOpen: boolean;
  onClose: () => void;
};

type Artist = {
  id: string;
  name: string;
  images: Array<{ url: string }>;
};

export function UserRegistrationModal({
  initialUsername,
  isOpen,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState(initialUsername || "");
  const [searchArtistName, setSearchArtistName] = useState("");
  const [artistSuggestions, setArtistSuggestions] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  const handleSelectArtist = (artist: Artist) => {
    const isAlreadySelected = selectedArtists.some(
      (selected) => selected.id === artist.id
    );

    if (!isAlreadySelected) {
      setSelectedArtists((prevArtists) => [...prevArtists, artist]);
      setArtistSuggestions((prevSuggestions) =>
        prevSuggestions.filter((suggestion) => suggestion.id !== artist.id)
      );
    }
  };

  const handleRemoveArtist = (artistId: string) => {
    setSelectedArtists((prevArtists) =>
      prevArtists.filter((artist) => artist.id !== artistId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const artistList = selectedArtists.map((artist) => ({
          id: artist.id,
          name: artist.name,
          imageUrl: artist.images[0]?.url || null,
        }));

        await initialUpdateUserAction({
          userName: username,
          artistList: artistList.length > 0 ? artistList : undefined,
        });

        onClose();
        router.refresh();
      } catch (error) {
        console.error("ユーザ情報の更新に失敗しました:", error);
        alert("ユーザ情報の更新に失敗しました");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative bg-white p-6 rounded-lg shadow-lg z-10 max-w-lg w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">
          ユーザ情報登録
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2 text-gray-700">
              ユーザ名
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="ユーザ名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2 text-gray-700">
              好きなアーティスト
            </label>

            <ul className="mb-2">
              {selectedArtists.map((artist) => (
                <li
                  key={artist.id}
                  className="p-2 bg-gray-100 rounded-md mb-1 flex justify-between items-center"
                >
                  <div className="flex items-center space-x-4">
                    {artist.images.length > 0 && (
                      <Image
                        src={artist.images[0].url}
                        alt={artist.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    )}
                    <span className="text-gray-700">{artist.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveArtist(artist.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex">
              <input
                className="shadow appearance-none border rounded-l w-10/12 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                disabled={isSearching}
              />
              <button
                type="button"
                onClick={handleArtistSearch}
                disabled={isSearching || !searchArtistName.trim()}
                className="bg-blue-500 hover:bg-blue-700 w-2/12 text-white font-bold py-2 px-4 rounded-r focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? "検索中..." : "検索"}
              </button>
            </div>

            {/* エラーメッセージ */}
            {searchError && (
              <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-gray-700">{searchError}</p>
              </div>
            )}

            {/* 検索結果 */}
            {hasSearched && !isSearching && (
              <div className="mt-2">
                {artistSuggestions.length > 0 ? (
                  <ul className="bg-white border border-gray-300 rounded w-full max-h-72 overflow-y-auto">
                    {artistSuggestions.map((artist) => (
                      <li
                        key={artist.id}
                        className="p-2 cursor-pointer hover:bg-gray-200 flex items-center space-x-4"
                        onClick={() => handleSelectArtist(artist)}
                      >
                        {artist.images.length > 0 ? (
                          <Image
                            src={artist.images[0].url}
                            alt={artist.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-700 text-xl">🎵</span>
                          </div>
                        )}
                        <h3 className="text-gray-700">{artist.name}</h3>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center">
                    <p className="text-sm text-gray-700">
                      検索結果がありません
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-center mt-5 space-x-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full disabled:opacity-60"
            >
              {isPending ? "登録中..." : "登録"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
