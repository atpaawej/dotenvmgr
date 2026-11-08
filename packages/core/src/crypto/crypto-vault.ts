import { formatDotenv, parseDotenv, validateKeyName } from './dotenv.js';
import {
  CryptoVaultError,
  type CryptoVault,
  type EncryptedPayload,
} from './types.js';

const IV_BYTES = 12;
const TAG_BYTES = 16;
const TAG_BITS = TAG_BYTES * 8;
const HKDF_SALT = new TextEncoder().encode('dotenvmgr.cryptovault.v1.salt');
const HKDF_INFO = new TextEncoder().encode('dotenvmgr.cryptovault.v1.aes-256-gcm');
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(value: string, field: string): Uint8Array<ArrayBuffer> {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    throw new CryptoVaultError(`Encrypted payload has an invalid ${field}`);
  }
}

async function deriveEncryptionKey(masterSecret: string): Promise<CryptoKey> {
  if (masterSecret.length === 0) {
    throw new CryptoVaultError('Encryption master secret must not be empty');
  }

  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(masterSecret),
    'HKDF',
    false,
    ['deriveKey'],
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: HKDF_SALT,
      info: HKDF_INFO,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function createCryptoVault(masterSecret: string): Promise<CryptoVault> {
  const key = await deriveEncryptionKey(masterSecret);

  return {
    async encrypt(plaintext: string): Promise<EncryptedPayload> {
      const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
      const sealed = new Uint8Array(
        await globalThis.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv, tagLength: TAG_BITS },
          key,
          encoder.encode(plaintext),
        ),
      );
      const tagOffset = sealed.length - TAG_BYTES;

      return {
        ciphertext: toBase64(sealed.subarray(0, tagOffset)),
        iv: toBase64(iv),
        tag: toBase64(sealed.subarray(tagOffset)),
      };
    },

    async decrypt(payload: EncryptedPayload): Promise<string> {
      const ciphertext = fromBase64(payload.ciphertext, 'ciphertext');
      const iv = fromBase64(payload.iv, 'initialization vector');
      const tag = fromBase64(payload.tag, 'authentication tag');

      if (iv.length !== IV_BYTES) {
        throw new CryptoVaultError(
          `Encrypted payload requires a ${IV_BYTES * 8}-bit initialization vector`,
        );
      }
      if (tag.length !== TAG_BYTES) {
        throw new CryptoVaultError(
          `Encrypted payload requires a ${TAG_BITS}-bit authentication tag`,
        );
      }

      const sealed = new Uint8Array(ciphertext.length + tag.length);
      sealed.set(ciphertext, 0);
      sealed.set(tag, ciphertext.length);

      try {
        const plaintext = await globalThis.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv, tagLength: TAG_BITS },
          key,
          sealed,
        );
        return decoder.decode(plaintext);
      } catch {
        throw new CryptoVaultError(
          'Unable to decrypt payload: authentication failed',
        );
      }
    },

    parseDotenv,
    formatDotenv,
    validateKeyName,
  };
}
