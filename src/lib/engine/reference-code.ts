// =============================================================================
// ConMart — Human-Readable Reference Codes
// =============================================================================
// Codes are read aloud over the phone between a buyer, a supplier, and the
// ConMart desk, so the alphabet omits characters that sound or look alike
// (0/O, 1/I/L). Uniqueness is enforced by the unique constraint on the column,
// not by this generator.
// =============================================================================

/** Unambiguous alphabet: no 0, O, 1, I, or L. */
const CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const CODE_LENGTH = 6;

/** `PRF` for proformas, `ENQ` for enquiries, `DLT` for agent deal tickets. */
export const REFERENCE_PREFIXES = ["PRF", "ENQ", "DLT"] as const;
export type ReferencePrefix = (typeof REFERENCE_PREFIXES)[number];

/**
 * Draws `length` characters uniformly from CHARSET.
 *
 * Values in the final, incomplete block of the uint32 range are rejected and
 * redrawn; a plain modulo would make the first few characters of the alphabet
 * marginally more likely.
 */
function generateRandomCode(length: number): string {
  const limit = Math.floor(0xffffffff / CHARSET.length) * CHARSET.length;
  let code = "";

  while (code.length < length) {
    const batch = new Uint32Array(length);
    crypto.getRandomValues(batch);

    for (const value of batch) {
      if (value >= limit) continue;
      code += CHARSET[value % CHARSET.length];
      if (code.length === length) break;
    }
  }

  return code;
}

/** Builds a reference such as `PRF-8A3K9M` or `ENQ-QT47XZ`. */
export function generateReferenceCode(prefix: ReferencePrefix = "PRF"): string {
  return `${prefix}-${generateRandomCode(CODE_LENGTH)}`;
}

/** Async wrapper retained for existing call sites. */
export async function generateUniqueReferenceCode(): Promise<string> {
  return generateReferenceCode("PRF");
}

/**
 * Puts user input into canonical form: `  #prf-8a3k9m ` becomes `PRF-8A3K9M`.
 *
 * Trimming precedes the `#` strip because references are usually pasted from a
 * chat message or an SMS, where a leading space would otherwise anchor the
 * pattern away from the hash and leave it in place.
 */
function canonicalize(input: string): string {
  return input.trim().replace(/^#/, "").trim().toUpperCase();
}

/** True when `code` matches `<PREFIX>-XXXXXX` after normalization. */
export function isValidReferenceCode(
  code: string,
  prefix?: ReferencePrefix
): boolean {
  const prefixPattern = prefix ?? REFERENCE_PREFIXES.join("|");
  return new RegExp(`^(?:${prefixPattern})-[${CHARSET}]{${CODE_LENGTH}}$`).test(
    canonicalize(code)
  );
}

/**
 * Canonicalizes user input such as `#prf-8a3k9m` to `PRF-8A3K9M`.
 * Returns null when the input is not a well-formed reference.
 */
export function normalizeReferenceCode(
  input: string,
  prefix?: ReferencePrefix
): string | null {
  const normalized = canonicalize(input);
  return isValidReferenceCode(normalized, prefix) ? normalized : null;
}
