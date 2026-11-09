const items = Object.freeze(["Phone", "Mouse", "Book"]);
const objectThreshold = 0.85;
const objectFramesRequired = 3;

class ItemFeed {
  constructor() {
    this.reset();
  }

  reset() {
    this.counts = Object.fromEntries(items.map(item => [item, 0]));
    this.unlocked = new Set();
    this.candidate = null;
    this.streak = 0;
    this.generation = (this.generation || 0) + 1;
  }

  observe(item, confidence) {
    if (!items.includes(item) || !Number.isFinite(confidence) || confidence < objectThreshold) {
      this.candidate = null;
      this.streak = 0;
      return null;
    }
    this.streak = item === this.candidate ? this.streak + 1 : 1;
    this.candidate = item;
    if (this.streak < objectFramesRequired) return null;
    this.unlocked.add(item);
    return item;
  }

  select(item) {
    if (this.unlocked.has(item)) this.counts[item]++;
  }

  distribution() {
    const eligible = items.filter(item => this.unlocked.has(item));
    if (!eligible.length) return [[null, 1]];
    const weighted = eligible.map(item => [
      item, Math.min(12, 1 + 0.85 * this.counts[item] ** 1.2)
    ]);
    const total = weighted.reduce((sum, [, weight]) => sum + weight, 0);
    const share = eligible.length === 1 ? 0.78 : 1;
    const probabilities = weighted.map(([item, weight]) => [item, share * weight / total]);
    if (share < 1) probabilities.push([null, 1 - share]);
    return probabilities;
  }

  choose(sample) {
    const probabilities = this.distribution();
    for (const [item, probability] of probabilities) {
      sample -= probability;
      if (sample < 0) return item;
    }
    return probabilities[probabilities.length - 1][0];
  }
}

if (typeof module !== "undefined") module.exports = { ItemFeed, items };

