type SharedDraft = {
  topic: string;
  items: string[];
  seed: number;
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

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as SharedDraft).topic !== "string" ||
      !Array.isArray((parsed as SharedDraft).items) ||
      typeof (parsed as SharedDraft).seed !== "number"
    ) {
      return null;
    }

    return {
      topic: (parsed as SharedDraft).topic,
      items: (parsed as SharedDraft).items.filter((item): item is string => typeof item === "string"),
      seed: (parsed as SharedDraft).seed,
    };
  } catch {
    return null;
  }
}

