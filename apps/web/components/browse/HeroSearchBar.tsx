"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city.trim()) params.set("city", city.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0 rounded-2xl sm:rounded-full bg-white/5 border border-white/10 p-2 backdrop-blur-sm"
    >
      {/* Event / keyword input */}
      <div className="flex items-center gap-2.5 flex-1 px-3">
        <svg className="w-4 h-4 text-white/30 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          placeholder="Events, churches, conferences…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-white placeholder:text-white/30 text-sm py-2.5 outline-none"
        />
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px bg-white/10 my-1.5 flex-none" />

      {/* City input */}
      <div className="flex items-center gap-2.5 sm:w-48 flex-none px-3">
        <svg className="w-4 h-4 text-white/30 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          type="text"
          placeholder="City or country"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-transparent text-white placeholder:text-white/30 text-sm py-2.5 outline-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="flex-none bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm px-7 py-3 rounded-full transition-colors whitespace-nowrap"
      >
        Search
      </button>
    </form>
  );
}
