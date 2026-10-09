/** Accept the token itself or a complete reset link pasted from the email. */
export function parseResetToken(value: string): string | null {
  let token = value.trim();
  if (/^https?:\/\//i.test(token)) {
    try {
      token = new URL(token).searchParams.get("token") ?? "";
    } catch {
      return null;
    }
  }
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}
