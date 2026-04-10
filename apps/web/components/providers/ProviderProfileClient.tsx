"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { InquiryForm } from "./InquiryForm";

interface Props {
  providerId: string;
  providerName: string;
}

export function ProviderProfileClient({ providerId, providerName }: Props) {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
      >
        Send inquiry →
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Send an inquiry</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>
            {isSignedIn ? (
              <InquiryForm
                providerId={providerId}
                providerName={providerName}
                onClose={() => setOpen(false)}
              />
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="text-4xl">🔒</div>
                <p className="text-white/60 text-sm">Sign in to send an inquiry to {providerName}.</p>
                <a
                  href="/sign-in"
                  className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                >
                  Sign in
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
