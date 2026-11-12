import { getStore } from "@netlify/blobs";

const NF_NOT_PATCHED_FETCH = Symbol.for("nf-not-patched-fetch");

type PatchedFetch = typeof fetch & { _nextOriginalFetch?: typeof fetch };

/**
 * Returns a fetch function that bypasses Next.js's Data Cache patch, avoiding
 * recursive hangs when @netlify/blobs is called inside Next.js server handlers.
 */
export function getUnpatchedFetch(): typeof fetch {
  const g = globalThis as unknown as Record<symbol, typeof fetch | undefined>;
  const nfFetch = g[NF_NOT_PATCHED_FETCH];
  if (typeof nfFetch === "function") {
    return nfFetch;
  }

  const currentFetch = globalThis.fetch as PatchedFetch;
  const rawFetch = currentFetch._nextOriginalFetch ?? currentFetch;
  return (input, init) =>
    rawFetch(input, {
      ...init,
      next: { internal: true },
    } as RequestInit);
}

export function isBlobsRuntime(): boolean {
  const g = globalThis as unknown as { netlifyBlobsContext?: string };
  return Boolean(
    g.netlifyBlobsContext ||
      process.env.NETLIFY_BLOBS_CONTEXT ||
      process.env.NETLIFY === "true"
  );
}

export function getEvokaBlobStore(name: string, strong = true) {
  return getStore({
    name,
    ...(strong ? { consistency: "strong" as const } : {}),
    fetch: getUnpatchedFetch(),
  });
}
