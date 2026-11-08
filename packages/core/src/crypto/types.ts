export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
}

export interface CryptoVault {
  encrypt(plaintext: string): Promise<EncryptedPayload>;
  decrypt(payload: EncryptedPayload): Promise<string>;
  parseDotenv(content: string): Record<string, string>;
  formatDotenv(entries: Record<string, string>): string;
  validateKeyName(key: string): boolean;
}

export class CryptoVaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoVaultError';
  }
}
