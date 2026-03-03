type SharedDraft = {
  topic: string;
  items: string[];
  seed: number;
  round: 8 | 16 | 32;
  shuffleEnabled: boolean;
};

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const binary = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeShareDraft(draft: SharedDraft): string {
  return toBase64Url(JSON.stringify(draft));
}

export function decodeShareDraft(raw: string): SharedDraft | null {
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(raw));

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const candidate = parsed as Partial<SharedDraft>;

    if (
      typeof candidate.topic !== "string" ||
      !Array.isArray(candidate.items) ||
      typeof candidate.seed !== "number"
    ) {
      return null;
    }

    const round = candidate.round === 32 || candidate.round === 16 || candidate.round === 8 ? candidate.round : 16;
    const shuffleEnabled = typeof candidate.shuffleEnabled === "boolean" ? candidate.shuffleEnabled : true;

    return {
      topic: candidate.topic,
      items: candidate.items.filter((item): item is string => typeof item === "string"),
      seed: candidate.seed,
      round,
      shuffleEnabled,
    };
  } catch {
    return null;
  }
}
