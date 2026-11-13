import { wordBank } from "./wordBank";

describe("CET-4 priority vocabulary", () => {
  it("keeps unique usable headwords and exactly 1000 corpus candidates", () => {
    expect(wordBank.filter(w=>w.cetFrequency!==undefined).length).toBe(1000);
    expect(new Set(wordBank.map((entry) => entry.word.toLowerCase())).size).toBe(wordBank.length);
    expect(wordBank.every((entry) => entry.word.trim() && entry.meaning.trim())).toBe(true);
  });

  it("marks corpus ranks as corpus evidence rather than past-paper frequency", () => {
    const ranked = wordBank.filter((entry) => entry.sourceRank !== undefined);
    expect(ranked.length).toBe(440);
    expect(ranked.every((entry) => entry.note?.includes("不是四级历年真题考频"))).toBe(true);
  });
});
