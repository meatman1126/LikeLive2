"use client";

import { saveFileAction } from "@/app/actions";
import { normalizeImageUrl } from "@/lib/utils/image-url";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faCode,
  faImage,
  faItalic,
  faListOl,
  faListUl,
  faMinus,
  faQuoteLeft,
  faStrikethrough,
  faUnderline,
} from "@fortawesome/free-solid-svg-icons";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapImage from "@tiptap/extension-image";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import type { EditorState } from "@tiptap/pm/state";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import "./tiptap.css";

type TiptapEditorProps = {
  content?: unknown;
  placeholder?: string;
};

/**
 * Tiptapリッチテキストエディタコンポーネント
 *
 * 固定ツールバー + BubbleMenu（テキスト選択時） + 画像アップロード機能を備えた
 * ブログ記事作成・編集用エディタです。
 *
 * 親コンポーネントから `ref` 経由でEditorインスタンスにアクセスでき、
 * `ref.current?.getJSON()` でTiptap JSON形式のコンテンツを取得できます。
 */
const TiptapEditor = forwardRef<Editor | null, TiptapEditorProps>(
  ({ content, placeholder = "本文を入力してください..." }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        TiptapUnderline,
        TiptapImage.configure({
          HTMLAttributes: {
            class: "tiptap-image",
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
      ],
      content: content || "",
      immediatelyRender: false,
    });

    // 親コンポーネントからeditorにアクセスできるようにする
    useImperativeHandle(ref, () => editor, [editor]);

    // content propが変更された場合にエディタのコンテンツを更新する
    useEffect(() => {
      if (editor && content) {
        editor.commands.setContent(content as Parameters<typeof editor.commands.setContent>[0]);
      }
    }, [content, editor]);

    // --- フォーマット操作 ---
    const toggleBold = useCallback(() => {
      editor?.chain().focus().toggleBold().run();
    }, [editor]);

    const toggleItalic = useCallback(() => {
      editor?.chain().focus().toggleItalic().run();
    }, [editor]);

    const toggleUnderline = useCallback(() => {
      editor?.chain().focus().toggleUnderline().run();
    }, [editor]);

    const toggleStrike = useCallback(() => {
      editor?.chain().focus().toggleStrike().run();
    }, [editor]);

    const toggleCode = useCallback(() => {
      editor?.chain().focus().toggleCode().run();
    }, [editor]);

    const toggleHeading = useCallback(
      (level: 1 | 2 | 3) => {
        editor?.chain().focus().toggleHeading({ level }).run();
      },
      [editor]
    );

    const toggleBulletList = useCallback(() => {
      editor?.chain().focus().toggleBulletList().run();
    }, [editor]);

    const toggleOrderedList = useCallback(() => {
      editor?.chain().focus().toggleOrderedList().run();
    }, [editor]);

    const toggleBlockquote = useCallback(() => {
      editor?.chain().focus().toggleBlockquote().run();
    }, [editor]);

    const setHorizontalRule = useCallback(() => {
      editor?.chain().focus().setHorizontalRule().run();
    }, [editor]);

    // --- 画像アップロード ---
    const handleImageInsert = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editor) return;

        setIsUploading(true);

        try {
          const formData = new FormData();
          formData.append("file", file);

          const result = await saveFileAction(formData);
          const imageUrl = result.url || `/api/public/files/${result.filename}`;
          const normalizedUrl = normalizeImageUrl(imageUrl);

          editor.chain().focus().setImage({ src: normalizedUrl }).run();
        } catch (error) {
          console.error("画像のアップロードに失敗しました:", error);
          alert("画像のアップロードに失敗しました");
        } finally {
          setIsUploading(false);
          // ファイル入力をリセット
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      },
      [editor]
    );

    const openImagePicker = useCallback(() => {
      fileInputRef.current?.click();
    }, []);

    if (!editor) {
      return (
        <div className="tiptap-editor-wrapper">
          <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
            <p className="text-sm text-gray-400">エディタを読み込み中...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="tiptap-editor-wrapper">
        {/* === 固定ツールバー === */}
        <div className="tiptap-toolbar">
          {/* テキストフォーマット */}
          <div className="tiptap-toolbar-group">
            <button
              type="button"
              className={`tiptap-toolbar-btn ${editor.isActive("bold") ? "is-active" : ""}`}
              onClick={toggleBold}
              title="太字"
            >
              <FontAwesomeIcon icon={faBold} size="sm" />
            </button>
            <button
              type="button"
              className={`tiptap-toolbar-btn ${editor.isActive("italic") ? "is-active" : ""}`}
              onClick={toggleItalic}
              title="斜体"
            >
              <FontAwesomeIcon icon={faItalic} size="sm" />
            </button>
            <button
              type="button"
              className={`tiptap-toolbar-btn ${editor.isActive("underline") ? "is-active" : ""}`}
              onClick={toggleUnderline}
              title="下線"
            >
              <FontAwesomeIcon icon={faUnderline} size="sm" />
            </button>
            <button
              type="button"
              className={`tiptap-toolbar-btn ${editor.isActive("strike") ? "is-active" : ""}`}
              onClick={toggleStrike}
              title="取り消し線"
            >
              <FontAwesomeIcon icon={faStrikethrough} size="sm" />
            </button>
            <button
              type="button"
              className={`tiptap-toolbar-btn ${editor.isActive("code") ? "is-active" : ""}`}
              onClick={toggleCode}
              title="インラインコード"
            >
              <FontAwesomeIcon icon={faCode} size="sm" />
            </button>
          </div>

          <div className="tiptap-toolbar-divider" />

          {/* 見出し */}
          <div className="tiptap-toolbar-group">
            <button
              type="button"
              className={`tiptap-toolbar-btn tiptap-heading-btn ${
                editor.isActive("heading", { level: 1 }) ? "is-active" : ""
              }`}
              onClick={() => toggleHeading(1)}
              title="大見出し"
            >
              H1
            </button>
            <button
              type="button"
              className={`tiptap-toolbar-btn tiptap-heading-btn ${
                editor.isActive("heading", { level: 2 }) ? "is-active" : ""
              }`}
              onClick={() => toggleHeading(2)}
              title="中見出し"
            >
              H2
            </button>
            <button
              type="button"
              className={`tiptap-toolbar-btn tiptap-heading-btn ${
                editor.isActive("heading", { level: 3 }) ? "is-active" : ""
              }`}
              onClick={() => toggleHeading(3)}
              title="小見出し"
            >
              H3
            </button>
          </div>

          <div className="tiptap-toolbar-divider" />

          {/* リスト */}
          <div className="tiptap-toolbar-group">
            <button
              type="button"
              className={`tiptap-toolbar-btn ${editor.isActive("bulletList") ? "is-active" : ""}`}
              onClick={toggleBulletList}
              title="箇条書き"
            >
              <FontAwesomeIcon icon={faListUl} size="sm" />
            </button>
            <button
              type="button"
              className={`tiptap-toolbar-btn ${editor.isActive("orderedList") ? "is-active" : ""}`}
              onClick={toggleOrderedList}
              title="番号付きリスト"
            >
              <FontAwesomeIcon icon={faListOl} size="sm" />
            </button>
          </div>

          <div className="tiptap-toolbar-divider" />

          {/* ブロック要素 */}
          <div className="tiptap-toolbar-group">
            <button
              type="button"
              className={`tiptap-toolbar-btn ${editor.isActive("blockquote") ? "is-active" : ""}`}
              onClick={toggleBlockquote}
              title="引用"
            >
              <FontAwesomeIcon icon={faQuoteLeft} size="sm" />
            </button>
            <button
              type="button"
              className="tiptap-toolbar-btn"
              onClick={setHorizontalRule}
              title="区切り線"
            >
              <FontAwesomeIcon icon={faMinus} size="sm" />
            </button>
          </div>

          <div className="tiptap-toolbar-divider" />

          {/* 画像 */}
          <div className="tiptap-toolbar-group">
            <button
              type="button"
              className="tiptap-toolbar-btn"
              onClick={openImagePicker}
              disabled={isUploading}
              title="画像を挿入"
            >
              {isUploading ? (
                <span className="text-xs animate-pulse">...</span>
              ) : (
                <FontAwesomeIcon icon={faImage} size="sm" />
              )}
            </button>
          </div>
        </div>

        {/* === BubbleMenu（テキスト選択時のフローティングメニュー） === */}
        <BubbleMenu
          pluginKey="bubbleMenuText"
          className="tiptap-bubble-menu"
          editor={editor}
          shouldShow={({ state }: { state: EditorState }) => {
            const { from, to } = state.selection;
            const node = state.doc.nodeAt(from);

            // 画像ノードの場合はバブルメニューを非表示
            if (node && node.type.name === "image") {
              return false;
            }

            // テキストが選択されている場合のみ表示
            return from !== to;
          }}
        >
          <button
            type="button"
            className={`tiptap-bubble-btn ${editor.isActive("bold") ? "is-active" : ""}`}
            onClick={toggleBold}
            title="太字"
          >
            <FontAwesomeIcon icon={faBold} size="sm" />
          </button>
          <button
            type="button"
            className={`tiptap-bubble-btn ${editor.isActive("italic") ? "is-active" : ""}`}
            onClick={toggleItalic}
            title="斜体"
          >
            <FontAwesomeIcon icon={faItalic} size="sm" />
          </button>
          <button
            type="button"
            className={`tiptap-bubble-btn ${editor.isActive("underline") ? "is-active" : ""}`}
            onClick={toggleUnderline}
            title="下線"
          >
            <FontAwesomeIcon icon={faUnderline} size="sm" />
          </button>
          <button
            type="button"
            className={`tiptap-bubble-btn ${editor.isActive("strike") ? "is-active" : ""}`}
            onClick={toggleStrike}
            title="取り消し線"
          >
            <FontAwesomeIcon icon={faStrikethrough} size="sm" />
          </button>
          <button
            type="button"
            className={`tiptap-bubble-btn ${editor.isActive("code") ? "is-active" : ""}`}
            onClick={toggleCode}
            title="インラインコード"
          >
            <FontAwesomeIcon icon={faCode} size="sm" />
          </button>
        </BubbleMenu>

        {/* === エディタ本体 === */}
        <EditorContent editor={editor} />

        {/* === 非表示のファイル入力 === */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageInsert}
          style={{ display: "none" }}
        />
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
