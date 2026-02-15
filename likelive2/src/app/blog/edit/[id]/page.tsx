"use client";

import {
  deleteBlogAction,
  getBlogByIdAction,
  getMyArtistsAction,
  getPublicBlogArtistsAction,
  saveFileAction,
  unpublishBlogAction,
  updateBlogAction,
} from "@/app/actions";
import { ThumbnailCropper } from "@/app/components/ThumbnailCropper";
import TiptapEditor from "@/app/components/TiptapEditor";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

const categoryOptions = [
  { value: "DIARY" as const, label: "日記" },
  { value: "REPORT" as const, label: "レポート" },
  { value: "OTHER" as const, label: "その他" },
];

const categoryLabels: Record<string, string> = {
  DIARY: "日記",
  REPORT: "レポート",
  OTHER: "その他",
};

/** セットリストJSONを編集用の文字列配列に変換 */
function parseSetlistForEdit(setlist: unknown): {
  mainNames: string[];
  encoreNames: string[][];
} {
  if (setlist == null || typeof setlist !== "object") {
    return { mainNames: [], encoreNames: [] };
  }
  const o = setlist as Record<string, unknown>;
  const mainList: { trackName?: string }[] = Array.isArray(o.mainSetList)
    ? o.mainSetList
    : [];
  const rawEncores = Array.isArray(o.encoreSections) ? o.encoreSections : [];
  const encoreList: { trackName?: string }[][] = rawEncores.filter(
    (s): s is { trackName?: string }[] => Array.isArray(s)
  );
  const mainNames = mainList.map((t) => (t?.trackName != null ? String(t.trackName) : ""));
  const encoreNames = encoreList.map((section) =>
    section.map((t) => (t?.trackName != null ? String(t.trackName) : ""))
  );
  return { mainNames, encoreNames };
}

export default function BlogEditPage({ params }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [blogId, setBlogId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const editorRef = useRef<Editor | null>(null);
  const [contentJson, setContentJson] = useState<unknown>(null);
  const [category, setCategory] = useState<"DIARY" | "REPORT" | "OTHER">(
    "DIARY"
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
    "DRAFT"
  );
  const [relatedArtists, setRelatedArtists] = useState<any[]>([]);
  const [availableArtists, setAvailableArtists] = useState<any[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    null
  );
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(
    null
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // セットリスト（任意）
  const [mainSetList, setMainSetList] = useState<string[]>([]);
  const [encoreSections, setEncoreSections] = useState<string[][]>([]);
  const [isSetlistOpen, setIsSetlistOpen] = useState(false);

  // UI states
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isArtistDropdownOpen, setIsArtistDropdownOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const artistDropdownRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { id } = await params;
        const idNum = Number(id);
        setBlogId(idNum);

        const [blogData, artistsData, blogArtists] = await Promise.all([
          getBlogByIdAction(idNum),
          getMyArtistsAction(),
          getPublicBlogArtistsAction(idNum),
        ]);

        setTitle(blogData.title);

        if (blogData.content) {
          const contentObj =
            typeof blogData.content === "string"
              ? JSON.parse(blogData.content)
              : blogData.content;
          setContentJson(contentObj);
        }

        setCategory(blogData.category as "DIARY" | "REPORT" | "OTHER");
        setStatus(blogData.status as "DRAFT" | "PUBLISHED" | "ARCHIVED");
        setExistingThumbnail(blogData.thumbnailUrl);
        setRelatedArtists(blogArtists || []);
        setAvailableArtists(
          artistsData.filter(
            (a: { id: string }) =>
              !blogArtists?.some((ba: { id: string }) => ba.id === a.id)
          )
        );
        const { mainNames, encoreNames } = parseSetlistForEdit(blogData.setlist);
        setMainSetList(mainNames);
        setEncoreSections(encoreNames);
        const hasSetlist =
          mainNames.length > 0 || encoreNames.some((s) => s.length > 0);
        setIsSetlistOpen(hasSetlist);
        setIsLoading(false);
      } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
        router.push("/me");
      }
    };
    loadData();
  }, [params, router]);

  // Click outside handler for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(e.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (
        artistDropdownRef.current &&
        !artistDropdownRef.current.contains(e.target as Node)
      ) {
        setIsArtistDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Body scroll lock when settings panel is open
  useEffect(() => {
    if (isSettingsPanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSettingsPanelOpen]);

  // Auto-resize title textarea after data loads
  useEffect(() => {
    if (!isLoading && titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [isLoading, title]);

  const adjustTitleHeight = () => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setSelectedImage(imageUrl);
        setThumbnailPreview(null);
        setCroppedImageUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedUrl: string) => {
    setCroppedImageUrl(croppedUrl);
    setSelectedImage(null);
    setThumbnailPreview(croppedUrl);
  };

  const handleCancelCrop = () => {
    setSelectedImage(null);
    setCroppedImageUrl(null);
    setThumbnailPreview(null);
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null);
    setCroppedImageUrl(null);
    setSelectedImage(null);
    setThumbnailFile(null);
    setExistingThumbnail(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  };

  const handleAddArtist = (artistId: string) => {
    const artist = availableArtists.find((a) => a.id === artistId);
    if (artist && !relatedArtists.some((a) => a.id === artistId)) {
      setRelatedArtists([...relatedArtists, artist]);
      setAvailableArtists(availableArtists.filter((a) => a.id !== artistId));
    }
  };

  const handleRemoveArtist = (artistId: string) => {
    const artist = relatedArtists.find((a) => a.id === artistId);
    if (artist) {
      setRelatedArtists(relatedArtists.filter((a) => a.id !== artistId));
      setAvailableArtists([...availableArtists, artist]);
    }
  };

  /** 曲名配列を { trackName, trackNumber }[] に変換（空白はトリミングし空は除外） */
  const tracksToJson = (
    names: string[]
  ): { trackName: string; trackNumber: number }[] =>
    names
      .map((s) => s.trim())
      .filter(Boolean)
      .map((trackName, i) => ({ trackName, trackNumber: i + 1 }));

  const buildSetlistJson = (): unknown => {
    const main = tracksToJson(mainSetList);
    const encores = encoreSections
      .map(tracksToJson)
      .filter((arr) => arr.length > 0);
    if (main.length === 0 && encores.length === 0) return null;
    return { mainSetList: main, encoreSections: encores };
  };

  const handleAddMainTrack = () => {
    setMainSetList([...mainSetList, "", "", "", "", ""]);
  };

  const handleMainTrackChange = (index: number, value: string) => {
    const next = [...mainSetList];
    next[index] = value;
    setMainSetList(next);
  };

  const handleRemoveMainTrack = (index: number) => {
    setMainSetList(mainSetList.filter((_, i) => i !== index));
  };

  const handleAddEncoreSection = () => {
    setEncoreSections([...encoreSections, [""]]);
  };

  const handleRemoveEncoreSection = (sectionIndex: number) => {
    setEncoreSections(encoreSections.filter((_, i) => i !== sectionIndex));
  };

  const handleEncoreTrackChange = (
    sectionIndex: number,
    trackIndex: number,
    value: string
  ) => {
    const next = encoreSections.map((section, i) =>
      i !== sectionIndex
        ? section
        : section.map((v, j) => (j === trackIndex ? value : v))
    );
    setEncoreSections(next);
  };

  const handleAddEncoreTrack = (sectionIndex: number) => {
    const next = encoreSections.map((section, i) =>
      i === sectionIndex ? [...section, "", "", "", "", ""] : section
    );
    setEncoreSections(next);
  };

  const handleRemoveEncoreTrack = (sectionIndex: number, trackIndex: number) => {
    const next = encoreSections.map((section, i) =>
      i === sectionIndex
        ? section.filter((_, j) => j !== trackIndex)
        : section
    );
    setEncoreSections(next);
  };

  const handleSave = async (isDraft = false) => {
    if (!title.trim()) {
      alert("タイトルを入力してください");
      return;
    }

    if (!blogId) return;

    startTransition(async () => {
      try {
        let thumbnailUrl: string | null = existingThumbnail;

        if (croppedImageUrl) {
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          const file = new File([blob], "thumbnail.jpg", {
            type: "image/jpeg",
          });
          const formData = new FormData();
          formData.append("file", file);
          const result = await saveFileAction(formData);
          thumbnailUrl = result.url || `/api/public/files/${result.filename}`;
        } else if (thumbnailFile) {
          const formData = new FormData();
          formData.append("file", thumbnailFile);
          const result = await saveFileAction(formData);
          thumbnailUrl = result.url || `/api/public/files/${result.filename}`;
        }

        const updatedContentJson = editorRef.current?.getJSON();

        const setlistJson = buildSetlistJson();

        await updateBlogAction(blogId, {
          title: title.trim(),
          content: updatedContentJson
            ? JSON.stringify(updatedContentJson)
            : undefined,
          status: isDraft ? "DRAFT" : "PUBLISHED",
          category,
          thumbnailUrl,
          setlist: setlistJson,
          artistIds: relatedArtists.map((a) => a.id),
        });

        router.push(`/blog/${blogId}`);
      } catch (error) {
        console.error("ブログの更新に失敗しました:", error);
        alert("ブログの更新に失敗しました");
      }
    });
  };

  const handleUnpublish = async () => {
    if (!blogId) return;
    if (!confirm("ブログを非公開にしますか？")) return;

    startTransition(async () => {
      try {
        await unpublishBlogAction(blogId);
        router.push(`/blog/${blogId}`);
      } catch (error) {
        console.error("非公開処理に失敗しました:", error);
        alert("非公開処理に失敗しました");
      }
    });
  };

  const handleDelete = () => {
    if (!blogId) return;
    startTransition(async () => {
      try {
        await deleteBlogAction(blogId);
        router.push("/me");
      } catch (error) {
        console.error("ブログの削除に失敗しました:", error);
        alert("ブログの削除に失敗しました");
      } finally {
        setIsDeleteModalOpen(false);
      }
    });
  };

  // ヘッダーのメインボタンラベル
  const headerButtonLabel = status === "PUBLISHED" ? "更新" : "公開";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ===== ヘッダーバー ===== */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
        <Link
          href={`/blog/${blogId}`}
          className="flex items-center gap-1.5 text-gray-500 transition-colors hover:text-gray-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden text-sm md:inline">戻る</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isPending}
            className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            削除
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {isPending ? "保存中..." : "下書き保存"}
          </button>
          <button
            onClick={() => setIsSettingsPanelOpen(true)}
            className="rounded-full bg-green-600 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            {headerButtonLabel}
          </button>
        </div>
      </header>

      {/* ===== 削除確認モーダル ===== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isPending && setIsDeleteModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800">削除の確認</h3>
            <p className="mt-2 text-sm text-gray-600">
              このブログを削除しますか？この操作は取り消せません。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !isPending && setIsDeleteModalOpen(false)}
                disabled={isPending}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {isPending ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 執筆エリア ===== */}
      <main className="mx-auto max-w-3xl px-6 py-8 md:py-12">
        {/* サムネイル画像: 非表示ファイル入力 */}
        <input
          type="file"
          accept="image/*"
          ref={thumbnailInputRef}
          onChange={handleThumbnailChange}
          className="hidden"
        />

        {/* サムネイル: 未選択・未設定時はアイコンボタン */}
        {!selectedImage && !thumbnailPreview && !existingThumbnail && (
          <button
            type="button"
            onClick={() => thumbnailInputRef.current?.click()}
            className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-300 transition-colors hover:border-gray-400 hover:text-gray-400"
            title="サムネイル画像を追加"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}

        {/* サムネイル: クロップ中 */}
        {selectedImage && (
          <div className="mb-6 space-y-2">
            <ThumbnailCropper
              imageUrl={selectedImage}
              onCropComplete={handleCropComplete}
            />
            <button
              type="button"
              onClick={handleCancelCrop}
              className="w-full rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
            >
              キャンセル
            </button>
          </div>
        )}

        {/* サムネイル: クロップ済みプレビュー or 既存サムネイル */}
        {(thumbnailPreview || existingThumbnail) && !selectedImage && (
          <div className="relative mb-6">
            <img
              src={thumbnailPreview ?? existingThumbnail ?? ""}
              alt="サムネイル"
              className="h-48 w-full rounded-lg border border-gray-200 object-contain"
            />
            <button
              type="button"
              onClick={handleRemoveThumbnail}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              title="サムネイルを削除"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* タイトル */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            adjustTitleHeight();
          }}
          placeholder="タイトル"
          maxLength={50}
          rows={1}
          className="w-full resize-none overflow-hidden border-none bg-transparent text-2xl font-bold text-gray-900 placeholder-gray-300 outline-none md:text-3xl"
        />

        {/* 関連アーティスト */}
        <div className="mt-3">
          {relatedArtists.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {relatedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1 pr-3"
                >
                  {artist.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name || ""}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
                      <span className="text-xs text-gray-400">♪</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-700">{artist.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveArtist(artist.id)}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-600"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {availableArtists.length > 0 && (
            <div ref={artistDropdownRef} className="relative inline-block">
              <button
                type="button"
                onClick={() => setIsArtistDropdownOpen(!isArtistDropdownOpen)}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                アーティストを追加
              </button>
              {isArtistDropdownOpen && (
                <div className="absolute left-0 z-10 mt-1 max-h-48 w-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {availableArtists.map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => {
                        handleAddArtist(artist.id);
                        setIsArtistDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-800 transition-colors hover:bg-blue-50"
                    >
                      {artist.imageUrl ? (
                        <img
                          src={artist.imageUrl}
                          alt={artist.name || ""}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                          <span className="text-xs text-gray-400">♪</span>
                        </div>
                      )}
                      <span>{artist.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="my-6 h-px bg-gray-200" />
        <TiptapEditor ref={editorRef} content={contentJson} />

        {/* セットリスト（任意） */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm overflow-hidden">
          {!isSetlistOpen ? (
            <button
              type="button"
              onClick={() => setIsSetlistOpen(true)}
              className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-gray-100/80"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-gray-800">セットリストを追加する</span>
              <svg className="ml-auto h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <>
          <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </span>
              <h3 className="text-sm font-semibold text-gray-800">セットリスト（任意）</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsSetlistOpen(false)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              aria-label="閉じる"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="space-y-6 p-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  本編
                </span>
                <button
                  type="button"
                  onClick={handleAddMainTrack}
                  className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  曲を追加
                </button>
              </div>
              {mainSetList.length === 0 ? (
                <button
                  type="button"
                  onClick={handleAddMainTrack}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-6 text-sm text-gray-400 transition-colors hover:border-indigo-200 hover:text-indigo-500"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  本編の曲を追加
                </button>
              ) : (
                <ul className="space-y-2">
                  {mainSetList.map((name, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500 tabular-nums">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleMainTrackChange(index, e.target.value)}
                        placeholder="曲名を入力"
                        className="min-w-0 flex-1 border-0 bg-transparent py-0.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMainTrack(index)}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                        aria-label="この曲を削除"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={handleAddMainTrack}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-2.5 text-xs text-gray-500 transition-colors hover:border-indigo-200 hover:text-indigo-600"
                    >
                      ＋ 曲を追加
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {encoreSections.map((tracks, sectionIndex) => (
              <div
                key={sectionIndex}
                className="rounded-lg border border-amber-200/80 bg-amber-50/30 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-700/90">
                    アンコール{encoreSections.length > 1 ? ` ${sectionIndex + 1}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEncoreSection(sectionIndex)}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    このアンコールを削除
                  </button>
                </div>
                <ul className="space-y-2">
                  {tracks.map((name, trackIndex) => (
                    <li
                      key={trackIndex}
                      className="flex items-center gap-2 rounded-md border border-amber-100 bg-white px-3 py-2"
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700 tabular-nums">
                        {trackIndex + 1}
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) =>
                          handleEncoreTrackChange(sectionIndex, trackIndex, e.target.value)
                        }
                        placeholder="曲名を入力"
                        className="min-w-0 flex-1 border-0 bg-transparent py-0.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEncoreTrack(sectionIndex, trackIndex)}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                        aria-label="この曲を削除"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() => handleAddEncoreTrack(sectionIndex)}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-amber-200 py-2 text-xs text-amber-600/80 transition-colors hover:border-amber-300 hover:bg-amber-50/50"
                    >
                      ＋ 曲を追加
                    </button>
                  </li>
                </ul>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddEncoreSection}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-500 transition-colors hover:border-amber-200 hover:bg-amber-50/20 hover:text-amber-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              アンコールを追加
            </button>
          </div>
            </>
          )}
        </div>
      </main>

      {/* ===== 公開設定パネル: オーバーレイ ===== */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isSettingsPanelOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsSettingsPanelOpen(false)}
      />

      {/* ===== 公開設定パネル ===== */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full bg-white shadow-xl transition-transform duration-300 ease-in-out md:w-[420px] ${
          isSettingsPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* パネルヘッダー */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {status === "PUBLISHED" ? "更新設定" : "公開設定"}
            </h2>
            <button
              type="button"
              onClick={() => setIsSettingsPanelOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* パネルコンテンツ */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                カテゴリ
              </label>
              <div ref={categoryRef} className="relative mt-1">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2.5 text-left text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <span>{categoryLabels[category]}</span>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      isCategoryOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isCategoryOpen && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                    {categoryOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setCategory(opt.value);
                          setIsCategoryOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-3 text-sm transition-colors hover:bg-blue-50 ${
                          category === opt.value
                            ? "bg-blue-50 font-medium text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {category === opt.value ? (
                          <svg
                            className="mr-2 h-4 w-4 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span className="mr-2 inline-block w-4" />
                        )}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* パネルフッター: アクションボタン */}
          <div className="space-y-3 border-t border-gray-100 p-6">
            {status === "PUBLISHED" ? (
              <>
                <button
                  onClick={() => handleSave(false)}
                  disabled={isPending}
                  className="w-full rounded-full bg-green-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                >
                  {isPending ? "保存中..." : "更新する"}
                </button>
                <button
                  onClick={handleUnpublish}
                  disabled={isPending}
                  className="w-full rounded-full border border-red-300 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                >
                  {isPending ? "処理中..." : "公開を停止"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSave(false)}
                  disabled={isPending}
                  className="w-full rounded-full bg-green-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                >
                  {isPending ? "保存中..." : "公開する"}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={isPending}
                  className="w-full rounded-full border border-gray-300 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
                >
                  {isPending ? "保存中..." : "下書き保存"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
