/**
 * Server-side Cloudflare Turnstile verification.
 *
 * Setup (free, ~5 minutes): Cloudflare dashboard → Turnstile → Add site →
 * choose "Managed" mode → add your domains (localhost + fontsandfooters.com).
 * Then add both keys to .env:
 *
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY=...   (used by the register form widget)
 *   TURNSTILE_SECRET_KEY=...             (used here, server-only)
 *
 * If TURNSTILE_SECRET_KEY is not set, verification is skipped with a console
 * warning so local dev keeps working without keys. Once the key is set,
 * verification is enforced and fails closed.
 */
export async function verifyTurnstileToken(
  token?: string,
): Promise<{ success: boolean; skipped?: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.warn(
      "[turnstile] TURNSTILE_SECRET_KEY not set — skipping bot verification.",
    );
    return { success: true, skipped: true };
  }

  if (!token) return { success: false };

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return { success: !!data.success };
  } catch (err) {
    console.error("[turnstile] Verification request failed:", err);
    // Fail closed — if Cloudflare is unreachable, we'd rather momentarily
    // block a signup than let bots through.
    return { success: false };
  }
}
