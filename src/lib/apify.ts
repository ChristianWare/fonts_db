// Thin Apify client wrapper. Used for starting actor runs and
// fetching their dataset items in one synchronous call.

const APIFY_BASE_URL = "https://api.apify.com/v2";

interface RunActorOptions {
  actorId: string; // e.g., "santamaria-automations/eventbrite-scraper"
  input: object; // Actor-specific input payload
  timeoutSecs?: number; // Run timeout (default 240)
  memoryMbytes?: number; // Allocated memory (default 1024)
}

/**
 * Runs an Apify actor synchronously and returns the dataset items.
 * Blocks for up to `timeoutSecs` waiting for the run to finish.
 */
export async function runActorSync<T = unknown>({
  actorId,
  input,
  timeoutSecs = 240,
  memoryMbytes = 1024,
}: RunActorOptions): Promise<T[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN is not set");

  // Apify URLs use ~ instead of / between username and actor name.
  const urlSafeActorId = actorId.replace("/", "~");

  const url = new URL(
    `${APIFY_BASE_URL}/acts/${urlSafeActorId}/run-sync-get-dataset-items`,
  );
  url.searchParams.set("token", token);
  url.searchParams.set("timeout", String(timeoutSecs));
  url.searchParams.set("memory", String(memoryMbytes));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify run failed (${res.status}): ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as T[];
  return Array.isArray(data) ? data : [];
}
