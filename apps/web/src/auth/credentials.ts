export interface AdminCredentials {
  username: string;
  password: string;
}

const encoder = new TextEncoder();

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(value)),
  );
}

function constantTimeEqual(candidate: Uint8Array, expected: Uint8Array): boolean {
  let difference = candidate.length ^ expected.length;

  for (let index = 0; index < candidate.length; index++) {
    difference |= candidate[index]! ^ (expected[index] ?? 0);
  }

  return difference === 0;
}

/**
 * Compares submitted credentials against the instance admin credentials.
 *
 * Both fields are always compared so a wrong username does not short-circuit
 * the password check and leak which half of the credential pair was invalid.
 * Values are hashed first so comparisons are fixed-length and timing-safe.
 */
export async function verifyAdminCredentials(
  candidate: AdminCredentials,
  expected: AdminCredentials,
): Promise<boolean> {
  const configured = expected.username.length > 0 && expected.password.length > 0;
  const [candidateUsername, expectedUsername, candidatePassword, expectedPassword] =
    await Promise.all([
      digest(candidate.username),
      digest(expected.username),
      digest(candidate.password),
      digest(expected.password),
    ]);

  return (
    configured &&
    constantTimeEqual(candidateUsername, expectedUsername) &&
    constantTimeEqual(candidatePassword, expectedPassword)
  );
}
