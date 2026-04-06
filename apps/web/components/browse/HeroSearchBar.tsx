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
      className="w-full mx-auto flex flex-col sm:flex-row items-stretch rounded-2xl sm:rounded-full bg-white shadow-2xl shadow-black/40 overflow-hidden"
      style={{ minHeight: "64px" }}
    >
      {/* Event / keyword input */}
      <div className="flex flex-col justify-center flex-1 px-5 py-3 sm:py-0 border-b sm:border-b-0 sm:border-r border-gray-200">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
          What
        </label>
        <input
          type="text"
          placeholder="Events, churches, revivals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 text-sm font-medium outline-none"
        />
      </div>

      {/* City input */}
      <div className="flex flex-col justify-center sm:w-52 flex-none px-5 py-3 sm:py-0 border-b sm:border-b-0 sm:border-r border-gray-200">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
          Where
        </label>
        <input
          type="text"
          placeholder="City or state"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 text-sm font-medium outline-none"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end p-2 sm:pl-3">
        <button
          type="submit"
          className="w-full sm:w-auto flex-none bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm px-7 py-3 rounded-full transition-colors whitespace-nowrap"
        >
          Search
        </button>
      </div>
    </form>
  );
}
