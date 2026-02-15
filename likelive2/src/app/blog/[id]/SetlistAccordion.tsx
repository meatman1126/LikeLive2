"use client";

import { useState } from "react";

type SetlistTrack = { trackName?: string; trackNumber?: number };

type Props = {
  mainSetList: SetlistTrack[];
  encoreSections: SetlistTrack[][];
};

function trackToLabel(track: SetlistTrack): string {
  return String(track.trackName ?? "").trim();
}

function TrackList({
  tracks,
  className = "",
}: {
  tracks: SetlistTrack[];
  className?: string;
}) {
  const sorted = [...tracks].sort(
    (a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0),
  );
  return (
    <ol className={className}>
      {sorted.map((track, index) => (
        <li
          key={index}
          className="flex items-center gap-3 py-2.5 pl-1 text-sm transition-colors hover:bg-white/60 rounded-md -mx-1 px-2"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200/80 text-xs font-medium text-gray-500 tabular-nums">
            {track.trackNumber ?? index + 1}
          </span>
          <span className="text-gray-800 font-medium truncate">
            {trackToLabel(track) || "—"}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function SetlistAccordion({ mainSetList, encoreSections }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const totalTracks =
    mainSetList.length + encoreSections.reduce((sum, s) => sum + s.length, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-b from-gray-50 to-gray-100/50 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-all duration-200 hover:from-gray-100 hover:to-gray-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 rounded-2xl"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
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
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-gray-800">
              セットリスト
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{totalTracks}曲</p>
          </div>
        </div>
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-gray-500 shadow-sm transition-all duration-300 ${isOpen ? "rotate-180 bg-indigo-50 text-indigo-600" : ""}`}
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
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-200/80 bg-white/40 px-5 pb-6 pt-4">
            <div className="space-y-6">
              {mainSetList.length > 0 && (
                <div>
                  <TrackList tracks={mainSetList} />
                </div>
              )}
              {encoreSections.map(
                (section, sectionIndex) =>
                  section.length > 0 && (
                    <div key={sectionIndex}>
                      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600/90">
                        <span className="h-px flex-1 max-w-8 bg-amber-300/50 rounded" />
                        {encoreSections.length > 1
                          ? `アンコール ${sectionIndex + 1}`
                          : "アンコール"}
                      </h3>
                      <TrackList tracks={section} />
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
