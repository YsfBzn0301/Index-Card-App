// Tolerant matching for spoken answers: speech recognition rarely reproduces a sentence word for word.

const MIN_SIGNIFICANT_LENGTH = 4;
const FULL_MATCH_TOKEN_LIMIT = 2;
const PARTIAL_MATCH_THRESHOLD = 0.6;

export function normalizeAnswer(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function editDistance(a: string, b: string) {
  if (a === b) {
    return 0;
  }

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }

  return previous[b.length];
}

function tokenMatches(expected: string, spokenTokens: string[]) {
  const allowedErrors = expected.length >= 8 ? 2 : expected.length >= 5 ? 1 : 0;

  return spokenTokens.some((spoken) => editDistance(expected, spoken) <= allowedErrors);
}

// Short answers must be matched completely; longer answers pass when most of their key words were said.
export function isAnswerMatch(spoken: string, expected: string) {
  const expectedTokens = normalizeAnswer(expected).split(' ').filter(Boolean);
  const spokenTokens = normalizeAnswer(spoken).split(' ').filter(Boolean);

  if (expectedTokens.length === 0 || spokenTokens.length === 0) {
    return false;
  }

  const significant = expectedTokens.filter((token) => token.length >= MIN_SIGNIFICANT_LENGTH);
  const keyTokens = significant.length > 0 ? significant : expectedTokens;
  const matched = keyTokens.filter((token) => tokenMatches(token, spokenTokens)).length;
  const required = keyTokens.length <= FULL_MATCH_TOKEN_LIMIT ? 1 : PARTIAL_MATCH_THRESHOLD;

  return matched / keyTokens.length >= required;
}
