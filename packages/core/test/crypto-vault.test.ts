import { describe, expect, it } from 'vitest';
import {
  createCryptoVault,
  CryptoVaultError,
  type EncryptedPayload,
} from '../src/index.js';

const MASTER_SECRET = 'a long-lived integration master secret';

describe('CryptoVault encryption', () => {
  it('roundtrips plaintext with a 96-bit IV and 128-bit tag', async () => {
    const vault = await createCryptoVault(MASTER_SECRET);
    const plaintext = 'postgres://user:password@localhost:5432/database';

    const payload = await vault.encrypt(plaintext);

    expect(payload.ciphertext).not.toContain(plaintext);
    expect(Buffer.from(payload.iv, 'base64')).toHaveLength(12);
    expect(Buffer.from(payload.tag, 'base64')).toHaveLength(16);
    await expect(vault.decrypt(payload)).resolves.toBe(plaintext);
  });

  it('uses a fresh IV for every encryption', async () => {
    const vault = await createCryptoVault(MASTER_SECRET);

    const first = await vault.encrypt('same plaintext');
    const second = await vault.encrypt('same plaintext');

    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it('rejects tampered ciphertext, tags, and IVs', async () => {
    const vault = await createCryptoVault(MASTER_SECRET);
    const payload = await vault.encrypt('integrity matters');

    const tamperedCiphertext: EncryptedPayload = {
      ...payload,
      ciphertext: flipByte(payload.ciphertext),
    };
    const tamperedTag: EncryptedPayload = {
      ...payload,
      tag: flipByte(payload.tag),
    };
    const tamperedIv: EncryptedPayload = {
      ...payload,
      iv: flipByte(payload.iv),
    };

    await expect(vault.decrypt(tamperedCiphertext)).rejects.toBeInstanceOf(
      CryptoVaultError,
    );
    await expect(vault.decrypt(tamperedTag)).rejects.toBeInstanceOf(
      CryptoVaultError,
    );
    await expect(vault.decrypt(tamperedIv)).rejects.toBeInstanceOf(
      CryptoVaultError,
    );
  });

  it('rejects payloads from a different master secret', async () => {
    const writer = await createCryptoVault(MASTER_SECRET);
    const reader = await createCryptoVault('a different master secret');
    const payload = await writer.encrypt('not for you');

    await expect(reader.decrypt(payload)).rejects.toBeInstanceOf(
      CryptoVaultError,
    );
  });
});

describe('CryptoVault dotenv grammar', () => {
  it('parses comments, export prefixes, quoting, escapes, and multiline values', async () => {
    const vault = await createCryptoVault(MASTER_SECRET);
    const content = [
      '# leading comment',
      '',
      'export SIMPLE=value',
      'SPACED = padded   ',
      "SINGLE='literal value # not a comment'",
      'DOUBLE="line one\\nline two"',
      'MULTILINE="first',
      'second"',
      'ESCAPED="quote: \\" slash: \\\\ tab:\\t"',
      'INLINE=hello # trailing comment',
      'HASH=abc#123',
      "SQUOTE='it\\'s fine'",
      'EMPTY=',
    ].join('\n');

    expect(vault.parseDotenv(content)).toEqual({
      SIMPLE: 'value',
      SPACED: 'padded',
      SINGLE: 'literal value # not a comment',
      DOUBLE: 'line one\nline two',
      MULTILINE: 'first\nsecond',
      ESCAPED: 'quote: " slash: \\ tab:\t',
      INLINE: 'hello',
      HASH: 'abc#123',
      SQUOTE: "it's fine",
      EMPTY: '',
    });
  });

  it('formats records canonically and roundtrips through the parser', async () => {
    const vault = await createCryptoVault(MASTER_SECRET);
    const entries = {
      Z_LAST: 'last',
      A_SIMPLE: 'simple',
      MULTILINE: 'line one\nline two',
      HASH: '#hash',
      SPACED: ' padded ',
      QUOTED: 'say "hello"',
      PATH: 'C:\\temp\\file',
      EMPTY: '',
    };

    const formatted = vault.formatDotenv(entries);

    expect(formatted).toBe(
      [
        'A_SIMPLE=simple',
        'EMPTY=',
        'HASH="#hash"',
        'MULTILINE="line one\\nline two"',
        'PATH="C:\\\\temp\\\\file"',
        'QUOTED="say \\"hello\\""',
        'SPACED=" padded "',
        'Z_LAST=last',
      ].join('\n'),
    );
    expect(vault.parseDotenv(formatted)).toEqual(entries);
  });

  it('validates POSIX environment variable names', async () => {
    const vault = await createCryptoVault(MASTER_SECRET);

    expect(vault.validateKeyName('DATABASE_URL')).toBe(true);
    expect(vault.validateKeyName('_PRIVATE')).toBe(true);
    expect(vault.validateKeyName('1INVALID')).toBe(false);
    expect(vault.validateKeyName('WITH-DASH')).toBe(false);
    expect(vault.validateKeyName('WITH SPACE')).toBe(false);
  });
});

function flipByte(base64: string): string {
  const bytes = Buffer.from(base64, 'base64');
  bytes[0] = bytes[0]! ^ 0xff;
  return bytes.toString('base64');
}
