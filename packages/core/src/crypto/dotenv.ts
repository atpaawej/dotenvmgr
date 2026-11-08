import { CryptoVaultError } from './types.js';

const KEY_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SAFE_UNQUOTED_VALUE = /^[A-Za-z0-9_./:@%+,\-=]*$/;

export function validateKeyName(key: string): boolean {
  return KEY_NAME_PATTERN.test(key);
}

function isHorizontalWhitespace(character: string | undefined): boolean {
  return character === ' ' || character === '\t';
}

function skipLine(source: string, index: number): number {
  const newline = source.indexOf('\n', index);
  return newline === -1 ? source.length : newline + 1;
}

function decodeDoubleQuoteEscape(
  source: string,
  index: number,
): { text: string; nextIndex: number } {
  const escaped = source[index + 1];
  if (escaped === undefined) {
    return { text: '\\', nextIndex: index + 1 };
  }

  switch (escaped) {
    case '\n':
      return { text: '', nextIndex: index + 2 };
    case 'n':
      return { text: '\n', nextIndex: index + 2 };
    case 'r':
      return { text: '\r', nextIndex: index + 2 };
    case 't':
      return { text: '\t', nextIndex: index + 2 };
    case '"':
    case "'":
    case '\\':
    case '$':
    case '#':
    case '`':
    case ' ':
      return { text: escaped, nextIndex: index + 2 };
    default:
      return { text: `\\${escaped}`, nextIndex: index + 2 };
  }
}

export function parseDotenv(content: string): Record<string, string> {
  const entries: Record<string, string> = {};
  const source = content.replace(/\r\n?/g, '\n');
  let index = 0;

  while (index < source.length) {
    while (isHorizontalWhitespace(source[index])) index++;

    if (index >= source.length) break;
    if (source[index] === '\n') {
      index++;
      continue;
    }
    if (source[index] === '#') {
      index = skipLine(source, index);
      continue;
    }

    if (
      source.startsWith('export', index) &&
      isHorizontalWhitespace(source[index + 'export'.length])
    ) {
      index += 'export'.length;
      while (isHorizontalWhitespace(source[index])) index++;
    }

    const keyStart = index;
    while (index < source.length && /[A-Za-z0-9_.-]/.test(source[index]!)) index++;
    const key = source.slice(keyStart, index);

    while (isHorizontalWhitespace(source[index])) index++;

    if (!key || !validateKeyName(key) || source[index] !== '=') {
      index = skipLine(source, index);
      continue;
    }

    index++; // consume '='
    while (isHorizontalWhitespace(source[index])) index++;

    const quote = source[index];
    if (quote === '"' || quote === "'") {
      index++;
      let value = '';

      while (index < source.length) {
        const character = source[index]!;

        if (character === '\\') {
          if (quote === '"') {
            const escape = decodeDoubleQuoteEscape(source, index);
            value += escape.text;
            index = escape.nextIndex;
            continue;
          }

          const escaped = source[index + 1];
          if (escaped === "'" || escaped === '\\') {
            value += escaped;
            index += 2;
            continue;
          }
        }

        if (character === quote) {
          index++;
          break;
        }

        value += character;
        index++;
      }

      while (isHorizontalWhitespace(source[index])) index++;
      if (source[index] === '#') {
        index = skipLine(source, index);
      } else if (index < source.length && source[index] !== '\n') {
        index = skipLine(source, index);
      } else if (source[index] === '\n') {
        index++;
      }

      entries[key] = value;
      continue;
    }

    let value = '';
    while (index < source.length && source[index] !== '\n') {
      const character = source[index]!;

      if (character === '\\' && source[index + 1] === '\n') {
        index += 2;
        continue;
      }

      if (
        character === '#' &&
        (value.length === 0 || /\s/.test(value[value.length - 1]!))
      ) {
        break;
      }

      value += character;
      index++;
    }

    value = value.replace(/[ \t]+$/, '');
    if (source[index] === '#') index = skipLine(source, index);
    if (source[index] === '\n') index++;

    entries[key] = value;
  }

  return entries;
}

function formatValue(value: string): string {
  if (SAFE_UNQUOTED_VALUE.test(value) && !value.startsWith('#')) {
    return value;
  }

  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')}"`;
}

export function formatDotenv(entries: Record<string, string>): string {
  return Object.keys(entries)
    .sort()
    .map((key) => {
      if (!validateKeyName(key)) {
        throw new CryptoVaultError(`Invalid environment variable name: ${key}`);
      }
      return `${key}=${formatValue(entries[key]!)}`;
    })
    .join('\n');
}
