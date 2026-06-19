import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the connection pool or create a new one
const sql = postgres(databaseUrl, { ssl: "require" });

export interface RegisterUserParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function registerUserInDb(params: RegisterUserParams): Promise<{ id: string }> {
  const { firstName, lastName, email, password } = params;
  const userId = crypto.randomUUID();
  const identityId = crypto.randomUUID();

  const rawUserMetaData = {
    firstName,
    lastName,
    role: "user",
    adminOf: [],
    email,
    email_verified: true,
    phone_verified: false
  };

  const rawAppMetaData = {
    provider: "email",
    providers: ["email"]
  };

  const identityData = {
    sub: userId,
    email,
    email_verified: true,
    phone_verified: false,
    firstName,
    lastName,
    role: "user",
    adminOf: []
  };

  // Perform both inserts inside a transaction
  await sql.begin(async (tx) => {
    const t = tx as any;
    // 1. Insert into auth.users (GoTrue compatibility requires empty strings instead of NULLs for token fields)
    await t`
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_sso_user,
        is_anonymous,
        aud,
        role,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        phone_change,
        phone_change_token,
        email_change_token_current,
        reauthentication_token
      ) VALUES (
        ${userId},
        '00000000-0000-0000-0000-000000000000',
        ${email},
        crypt(${password}, gen_salt('bf', 10)),
        now(),
        ${t.json(rawAppMetaData)},
        ${t.json(rawUserMetaData)},
        false,
        false,
        'authenticated',
        'authenticated',
        now(),
        now(),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      )
    `;

    // 2. Insert into auth.identities
    await t`
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at,
        provider_id
      ) VALUES (
        ${identityId},
        ${userId},
        ${t.json(identityData)},
        'email',
        now(),
        now(),
        now(),
        ${userId}
      )
    `;
  });

  return { id: userId };
}
