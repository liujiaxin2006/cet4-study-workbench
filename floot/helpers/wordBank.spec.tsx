import { wordBank } from "./wordBank";

describe("CET-4 priority vocabulary", () => {
  it("contains exactly 600 unique headwords with usable meanings", () => {
    expect(wordBank.length).toBe(600);
    expect(new Set(wordBank.map((entry) => entry.word.toLowerCase())).size).toBe(600);
    expect(wordBank.every((entry) => entry.word.trim() && entry.meaning.trim())).toBe(true);
  });

  it("marks corpus ranks as corpus evidence rather than past-paper frequency", () => {
    const ranked = wordBank.filter((entry) => entry.sourceRank !== undefined);
    expect(ranked.length).toBe(440);
    expect(ranked.every((entry) => entry.note?.includes("不是四级历年真题考频"))).toBe(true);
  });
});
