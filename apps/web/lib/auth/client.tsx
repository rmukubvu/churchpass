"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoaded: false,
  isSignedIn: false,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoaded(true);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoaded(true);

      // Trigger router refresh on sign in / sign out to update Server Components
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const refreshUser = async () => {
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    setUser(freshUser);
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    setSession(freshSession);
  };

  const isSignedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, session, isLoaded, isSignedIn, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useContext(AuthContext);
  const supabase = createClient();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return {
    isSignedIn,
    userId: user?.id ?? null,
    isLoaded,
    signOut,
  };
}

export function useUser() {
  const { user, isLoaded, isSignedIn, refreshUser } = useContext(AuthContext);

  const mappedUser = user ? {
    id: user.id,
    firstName: user.user_metadata?.firstName ?? user.user_metadata?.first_name ?? "",
    lastName: user.user_metadata?.lastName ?? user.user_metadata?.last_name ?? "",
    primaryEmailAddress: {
      emailAddress: user.email ?? "",
    },
    emailAddresses: [
      { emailAddress: user.email ?? "" }
    ],
    publicMetadata: user.user_metadata ?? {},
    reload: refreshUser,
  } : null;

  return {
    isSignedIn,
    isLoaded,
    user: mappedUser,
  };
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useContext(AuthContext);
  if (!isLoaded || !isSignedIn) return null;
  return <>{children}</>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useContext(AuthContext);
  if (!isLoaded || isSignedIn) return null;
  return <>{children}</>;
}

export function SignInButton({ children }: { children?: React.ReactNode; mode?: "modal" | "redirect" }) {
  const router = useRouter();
  
  if (children) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: () => router.push("/sign-in"),
    });
  }

  return (
    <button 
      onClick={() => router.push("/sign-in")}
      className="text-sm font-medium hover:underline text-indigo-400"
    >
      Sign In
    </button>
  );
}

function UserDropdownMenu() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!user) return null;

  const initials = ((user.firstName?.charAt(0) ?? "") + (user.lastName?.charAt(0) ?? "")).toUpperCase() || user.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase() || "?";
  const name = user.firstName ? `${user.firstName} ${user.lastName}` : user.primaryEmailAddress?.emailAddress;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0f0f0f]"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/5 rounded-xl shadow-xl py-1.5 z-50 text-left">
          <div className="px-4 py-2 border-b border-white/5">
            <p className="text-xs text-white/40 font-medium">Signed in as</p>
            <p className="text-sm font-semibold text-white truncate mt-0.5">{name}</p>
            <p className="text-[11px] text-white/30 truncate mt-0.5">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
          <div className="p-1 space-y-0.5">
            <Link
              href="/my-events"
              onClick={() => setOpen(false)}
              className="flex w-full px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              My Events
            </Link>
            {user.publicMetadata?.adminOf?.[0] && (
              <Link
                href={`/${user.publicMetadata.adminOf[0]}/admin`}
                onClick={() => setOpen(false)}
                className="flex w-full px-3 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                My Church
              </Link>
            )}
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserButton({ appearance }: { appearance?: any }) {
  return <UserDropdownMenu />;
}
