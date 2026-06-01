type CookieReader = {
  get: (name: string) => { value?: string } | undefined;
};

export const SESSION_COOKIE_NAMES = [
  "pos_session",
  "pos-session",
  "session",
] as const;

export function getSessionToken(cookieStore: CookieReader): string | undefined {
  for (const cookieName of SESSION_COOKIE_NAMES) {
    const token = cookieStore.get(cookieName)?.value;

    if (token) {
      return token;
    }
  }

  return undefined;
}
