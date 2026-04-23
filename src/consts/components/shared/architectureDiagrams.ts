const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const toAlphaOrdinal = (index: number) => {
  let value = Math.max(0, index);
  let result = "";

  do {
    result = ALPHABET[value % 26] + result;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return result;
};

export const stripOrdinalPrefix = (text?: string) =>
  (text ?? "").replace(/^\s*[A-Za-z0-9]+\.\s*/, "").trim();
