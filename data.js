const emoji = new EmojiConvertor();
emoji.init_env();
emoji.replace_mode = 'unified';
emoji.allow_native = true;

export const DESSERTS = [
  [':tangerine:', 10],
  [':peach:', 15],
  [':strawberry:', 20],
  [':ice_cream:', 400],
  [':doughnut:', 400],
  [':cake:', 800],
].map(([e, w]) => [emoji.replace_colons(e), w]);

function randPick(arr) {
  const ind = Math.floor(Math.random() * arr.length);
  return arr[ind];
}

function rangeRatioDist(center, ratio, cutoff = 100) {
  const width = center * ratio;
  const value = center + Math.random() * width - width/2;

  return Math.round(value * cutoff) / cutoff;
}

export function randDessert() {
  const [dessert, weight] = randPick(DESSERTS);
  return {
    dessert,
    weight: rangeRatioDist(weight, 0.2),
  };
}
