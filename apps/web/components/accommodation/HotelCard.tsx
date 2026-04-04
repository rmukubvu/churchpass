import type { NearbyHotel } from "@/lib/google-places";
import { hotelPhotoUrl } from "@/lib/google-places";

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 flex-none ${
            i < full
              ? "text-amber-400"
              : half && i === full
              ? "text-amber-400/50"
              : "text-white/15"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </span>
  );
}

export function HotelCard({ hotel }: { hotel: NearbyHotel }) {
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${hotel.placeId}`;
  const distanceLabel =
    hotel.distanceKm < 1
      ? `${Math.round(hotel.distanceKm * 1000)} m away`
      : `${hotel.distanceKm.toFixed(1)} km away`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      // Fixed total height so every card is identical regardless of name length
      className="group flex-none w-72 h-[360px] rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/8 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 flex flex-col"
    >
      {/* Photo — fixed height */}
      <div className="relative h-48 flex-none bg-[#252525] overflow-hidden">
        {hotel.photoRef ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hotelPhotoUrl(hotel.photoRef)}
            alt={hotel.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            suppressHydrationWarning
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-[#252525] to-purple-900/30" />
        )}
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
        {/* Distance badge */}
        <span className="absolute top-3 left-3 text-xs font-bold bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-full border border-white/15 tracking-wide">
          {distanceLabel}
        </span>
      </div>

      {/* Info — fills remaining height, flexes to push button to bottom */}
      <div className="flex flex-col flex-1 p-4 gap-2 min-h-0">
        {/* Name — 2-line clamp so long names don't push layout */}
        <p className="text-[15px] font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-200 transition-colors">
          {hotel.name}
        </p>

        {/* Stars + rating */}
        {hotel.rating !== null && (
          <div className="flex items-center gap-2">
            <StarRating rating={hotel.rating} />
            <span className="text-sm font-semibold text-amber-400">
              {hotel.rating.toFixed(1)}
            </span>
            {hotel.userRatingsTotal ? (
              <span className="text-xs text-white/35">
                ({hotel.userRatingsTotal.toLocaleString()})
              </span>
            ) : null}
          </div>
        )}

        {/* Address — single line */}
        <p className="text-xs text-white/40 truncate">{hotel.vicinity}</p>

        {/* CTA pinned to bottom */}
        <div className="mt-auto pt-2">
          <span className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-semibold group-hover:bg-indigo-600/35 group-hover:border-indigo-400/50 group-hover:text-indigo-200 transition-all">
            View on Google Maps
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}
