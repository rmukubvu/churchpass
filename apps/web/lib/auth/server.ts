import { createClient } from "@/lib/supabase/server";

export async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    userId: user?.id ?? null,
    sessionClaims: user
      ? {
          publicMetadata: user.user_metadata ?? {},
        }
      : null,
  };
}

export async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const phone = user.phone ?? metadata.phone ?? null;

  return {
    id: user.id,
    firstName: metadata.firstName ?? metadata.first_name ?? "",
    lastName: metadata.lastName ?? metadata.last_name ?? "",
    primaryEmailAddress: {
      emailAddress: user.email ?? "",
    },
    emailAddresses: [
      {
        emailAddress: user.email ?? "",
      },
    ],
    phoneNumbers: phone ? [{ phoneNumber: phone }] : [],
    publicMetadata: metadata,
  };
}
