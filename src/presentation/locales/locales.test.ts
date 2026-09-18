import { describe, expect, it } from '@jest/globals';
import en from './en.json';
import ptBR from './pt-BR.json';

type Messages = { [key: string]: string | Messages };

function keysOf(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keysOf(value, `${prefix}${key}.`)
  );
}

describe('locales', () => {
  it('en and pt-BR declare exactly the same keys', () => {
    expect(keysOf(ptBR).sort()).toEqual(keysOf(en).sort());
  });

  it.each([
    ['en', en],
    ['pt-BR', ptBR],
  ])('%s has no empty messages', (_, messages) => {
    const empty = keysOf(messages as Messages).filter((key) => {
      const value = key
        .split('.')
        .reduce<unknown>((node, part) => (node as Messages)[part], messages);
      return typeof value !== 'string' || value.trim() === '';
    });

    expect(empty).toEqual([]);
  });
});
