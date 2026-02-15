"use client";

import type { ReactNode } from "react";

type Props = {
  content: unknown;
};

/**
 * TiptapのJSON形式のコンテンツをレンダリングします。
 *
 * 対応ノードタイプ:
 * - paragraph, heading (h1-h3), text
 * - image, hardBreak, horizontalRule
 * - bulletList, orderedList, listItem
 * - blockquote, codeBlock
 *
 * 対応マーク:
 * - bold, italic, underline, strike, code
 */
export function BlogContentRenderer({ content }: Props) {
  if (!content) {
    return <p className="text-sm text-gray-700">コンテンツがありません。</p>;
  }

  // JSON文字列の場合はパース
  const contentObj =
    typeof content === "string" ? JSON.parse(content) : content;

  if (!contentObj || !(contentObj as any).content) {
    return <p className="text-sm text-gray-700">コンテンツがありません。</p>;
  }

  return (
    <div className="prose prose-zinc max-w-none">
      {(contentObj as any).content.map((node: any, index: number) =>
        renderNode(node, index)
      )}
    </div>
  );
}

/**
 * Tiptap JSONノードを再帰的にReact要素にレンダリングします
 */
function renderNode(node: any, index: number): ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={index} className="mb-4 text-gray-700">
          {node.content
            ? node.content.map((child: any, i: number) => renderNode(child, i))
            : null}
        </p>
      );

    case "heading": {
      const level = node.attrs?.level || 1;
      const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
      const headingClasses: Record<number, string> = {
        1: "text-2xl font-bold mt-8 mb-3 text-gray-800",
        2: "text-xl font-bold mt-6 mb-2 text-gray-800",
        3: "text-lg font-semibold mt-4 mb-2 text-gray-800",
      };
      return (
        <HeadingTag
          key={index}
          className={headingClasses[level] || "font-bold mb-2 mt-4 text-gray-800"}
        >
          {node.content
            ? node.content.map((child: any, i: number) => renderNode(child, i))
            : null}
        </HeadingTag>
      );
    }

    case "text":
      return renderTextNode(node, index);

    case "image":
      return (
        <img
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt || ""}
          className="my-4 mx-auto block max-w-[80%] rounded-lg"
        />
      );

    case "hardBreak":
      return <br key={index} />;

    case "horizontalRule":
      return <hr key={index} className="my-6 border-t-2 border-gray-200" />;

    case "bulletList":
      return (
        <ul key={index} className="mb-4 list-disc pl-6 text-gray-700">
          {node.content
            ? node.content.map((child: any, i: number) => renderNode(child, i))
            : null}
        </ul>
      );

    case "orderedList":
      return (
        <ol
          key={index}
          className="mb-4 list-decimal pl-6 text-gray-700"
          start={node.attrs?.start || 1}
        >
          {node.content
            ? node.content.map((child: any, i: number) => renderNode(child, i))
            : null}
        </ol>
      );

    case "listItem":
      return (
        <li key={index} className="mb-1">
          {node.content
            ? node.content.map((child: any, i: number) => renderNode(child, i))
            : null}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={index}
          className="my-4 border-l-4 border-gray-300 pl-4 italic text-gray-600"
        >
          {node.content
            ? node.content.map((child: any, i: number) => renderNode(child, i))
            : null}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre
          key={index}
          className="my-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100"
        >
          <code>
            {node.content
              ? node.content.map((child: any, i: number) =>
                  child.type === "text" ? child.text : renderNode(child, i)
                )
              : null}
          </code>
        </pre>
      );

    default:
      // 未知のノードタイプは子要素があればレンダリング
      if (node.content) {
        return node.content.map((child: any, i: number) =>
          renderNode(child, i)
        );
      }
      return null;
  }
}

/**
 * テキストノードにマーク（bold, italic等）を適用してレンダリングします
 */
function renderTextNode(node: any, index: number): ReactNode {
  let element: ReactNode = node.text || "";

  if (node.marks && node.marks.length > 0) {
    // マークを外側から内側へ適用
    for (const mark of node.marks) {
      switch (mark.type) {
        case "bold":
          element = <strong key={`${index}-bold`}>{element}</strong>;
          break;
        case "italic":
          element = <em key={`${index}-italic`}>{element}</em>;
          break;
        case "underline":
          element = <u key={`${index}-underline`}>{element}</u>;
          break;
        case "strike":
          element = <s key={`${index}-strike`}>{element}</s>;
          break;
        case "code":
          element = (
            <code
              key={`${index}-code`}
              className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-red-600 font-mono"
            >
              {element}
            </code>
          );
          break;
        case "link":
          element = (
            <a
              key={`${index}-link`}
              href={mark.attrs?.href}
              target={mark.attrs?.target || "_blank"}
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              {element}
            </a>
          );
          break;
      }
    }
  }

  return element;
}
