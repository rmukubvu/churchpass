"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  imageUrl: string;
  onUploaded: (url: string) => void;
};

export function AdImageUpload({ imageUrl, onUploaded }: Props) {
  const [preview, setPreview] = useState<string | null>(imageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError(null);
    setWarning(null);
    setUploading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload/ad", { method: "POST", body: form });
      const body = (await res.json()) as {
        url?: string;
        error?: string;
        warnings?: string[];
      };

      if (!res.ok || !body.url) {
        throw new Error(body.error ?? `Upload failed (${res.status})`);
      }

      setPreview(body.url);
      onUploaded(body.url);
      if (body.warnings?.[0]) setWarning(body.warnings[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const f = files[0];
    if (f) uploadFile(f);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    setWarning(null);
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative w-full aspect-[3/1] rounded-xl border-2 border-dashed transition-colors overflow-hidden cursor-pointer",
          dragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/10 bg-[#0a0a0f] hover:border-indigo-500/50"
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Ad banner preview" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Spinner />
              </div>
            )}
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white text-sm font-bold"
                aria-label="Remove image"
              >
                ×
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center select-none pointer-events-none">
            {uploading ? (
              <Spinner />
            ) : (
              <>
                <UploadIcon />
                <p className="text-sm text-white/40">
                  Drag &amp; drop or <span className="text-indigo-400">browse</span>
                </p>
                <p className="text-xs text-white/25">1200×400px · 3:1 ratio · max 5 MB</p>
              </>
            )}
          </div>
        )}
      </div>

      {warning && <p className="text-xs text-amber-400/90">{warning}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-6 h-6 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      className="w-8 h-8 text-white/20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      <polyline points="16 8 12 4 8 8" />
      <line x1="12" y1="4" x2="12" y2="16" />
    </svg>
  );
}
