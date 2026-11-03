import { formatPersonName, parsePersonName } from '../../src/utils/personName';
import { GrdmPersonName } from '../../src/types/project-metadata';

describe('formatPersonName', () => {
  const fullName: GrdmPersonName = { last: 'Yamada', middle: 'Q.', first: 'Taro' };

  it('should order parts as "last middle first" for ja', () => {
    expect(formatPersonName(fullName, 'ja')).toBe('Yamada Q. Taro');
  });

  it('should order parts as "first middle last" for en', () => {
    expect(formatPersonName(fullName, 'en')).toBe('Taro Q. Yamada');
  });

  it('should skip empty parts without leaving extra spaces', () => {
    expect(formatPersonName({ last: '山田', middle: '', first: '太郎' }, 'ja')).toBe('山田 太郎');
    expect(formatPersonName({ last: 'Yamada', middle: '', first: 'Taro' }, 'en')).toBe('Taro Yamada');
  });

  it('should return the full name stored only in last', () => {
    expect(formatPersonName({ last: '山田太郎', middle: '', first: '' }, 'ja')).toBe('山田太郎');
    expect(formatPersonName({ last: 'Taro Yamada', middle: '', first: '' }, 'en')).toBe('Taro Yamada');
  });

  it('should trim whitespace around each part', () => {
    expect(formatPersonName({ last: ' Yamada ', middle: ' ', first: ' Taro' }, 'en')).toBe('Taro Yamada');
  });

  it('should return an empty string when all parts are empty', () => {
    expect(formatPersonName({ last: '', middle: '', first: '' }, 'ja')).toBe('');
  });

  it('should return an empty string for null and undefined', () => {
    expect(formatPersonName(null, 'ja')).toBe('');
    expect(formatPersonName(undefined, 'en')).toBe('');
  });

  it('should return a legacy string value trimmed as-is', () => {
    expect(formatPersonName('  山田 太郎 ', 'ja')).toBe('山田 太郎');
    expect(formatPersonName('Taro Yamada', 'en')).toBe('Taro Yamada');
  });
});

describe('parsePersonName', () => {
  it('should return empty parts for an empty or blank string', () => {
    const empty: GrdmPersonName = { last: '', middle: '', first: '' };
    expect(parsePersonName('', 'ja')).toEqual(empty);
    expect(parsePersonName('  　 ', 'en')).toEqual(empty);
  });

  it('should put a single token into last', () => {
    expect(parsePersonName('山田太郎', 'ja')).toEqual({ last: '山田太郎', middle: '', first: '' });
    expect(parsePersonName('Yamada', 'en')).toEqual({ last: 'Yamada', middle: '', first: '' });
  });

  it('should split two tokens as "last first" for ja', () => {
    expect(parsePersonName('山田 太郎', 'ja')).toEqual({ last: '山田', middle: '', first: '太郎' });
  });

  it('should split two tokens as "first last" for en', () => {
    expect(parsePersonName('Taro Yamada', 'en')).toEqual({ last: 'Yamada', middle: '', first: 'Taro' });
  });

  it('should put all tokens after the first into first for ja', () => {
    expect(parsePersonName('山田 太郎 次郎', 'ja')).toEqual({ last: '山田', middle: '', first: '太郎 次郎' });
  });

  it('should put inner tokens into middle for en', () => {
    expect(parsePersonName('John Q. Public', 'en')).toEqual({ last: 'Public', middle: 'Q.', first: 'John' });
    expect(parsePersonName('Christopher D. M. Hutchison', 'en')).toEqual({
      last: 'Hutchison',
      middle: 'D. M.',
      first: 'Christopher',
    });
  });

  it('should treat full-width spaces and repeated whitespace as one separator', () => {
    expect(parsePersonName('山田　太郎', 'ja')).toEqual({ last: '山田', middle: '', first: '太郎' });
    expect(parsePersonName('  Taro \t  Yamada  ', 'en')).toEqual({ last: 'Yamada', middle: '', first: 'Taro' });
  });

  it('should always set all three keys', () => {
    const name = parsePersonName('Yamada', 'en');
    expect(Object.keys(name).sort()).toEqual(['first', 'last', 'middle']);
  });
});

describe('formatPersonName / parsePersonName round trip', () => {
  const cases: Array<[GrdmPersonName, 'ja' | 'en']> = [
    [{ last: '山田', middle: '', first: '太郎' }, 'ja'],
    [{ last: '山田太郎', middle: '', first: '' }, 'ja'],
    [{ last: 'Yamada', middle: '', first: 'Taro' }, 'en'],
    [{ last: 'Public', middle: 'Q.', first: 'John' }, 'en'],
    [{ last: '', middle: '', first: '' }, 'en'],
  ];

  it.each(cases)('should restore %j (%s)', (name, lang) => {
    expect(parsePersonName(formatPersonName(name, lang), lang)).toEqual(name);
  });

  // GRDM often stores a whole English name in `last`. Re-parsing such a value splits it,
  // so consumers must send the original object back when the user did not edit the name.
  it('should split a multi-word name stored only in last (not an identity)', () => {
    const storedByGrdm: GrdmPersonName = { last: 'Taro Yamada', middle: '', first: '' };
    expect(parsePersonName(formatPersonName(storedByGrdm, 'en'), 'en')).toEqual({
      last: 'Yamada',
      middle: '',
      first: 'Taro',
    });
  });
});
