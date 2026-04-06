"use client";

import { useEffect, useRef, useState } from "react";

type Prediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Search for a location…",
  className,
}: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setPredictions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(value)}`
        );
        if (res.ok) {
          const data = (await res.json()) as { predictions: Prediction[] };
          setPredictions(data.predictions ?? []);
          setOpen((data.predictions ?? []).length > 0);
          setHighlighted(-1);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function selectPrediction(p: Prediction) {
    onChange(p.description);
    setPredictions([]);
    setOpen(false);
    setHighlighted(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      const prediction = predictions[highlighted];
      if (prediction) selectPrediction(prediction);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const inputClass =
    className ??
    "w-full bg-[#252525] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors";

  // When className is provided it comes from the form as the standard class without pin padding.
  // Ensure pin padding is applied by overriding if we are using the default.
  const resolvedInputClass = className
    ? className.replace(/\bpx-4\b/, "pl-10 pr-10")
    : inputClass;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Map pin icon */}
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (predictions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={resolvedInputClass}
      />

      {/* Spinner */}
      {loading && (
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}

      {/* Dropdown */}
      {open && predictions.length > 0 && (
        <ul className="absolute top-full left-0 w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
          {predictions.map((p, i) => (
            <li
              key={p.placeId}
              onMouseDown={() => selectPrediction(p)}
              onMouseEnter={() => setHighlighted(i)}
              className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                i === highlighted ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <p className="text-white font-medium leading-snug">{p.mainText}</p>
              {p.secondaryText && (
                <p className="text-white/40 text-xs mt-0.5">{p.secondaryText}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
