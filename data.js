const emoji = new EmojiConvertor();
emoji.init_env();
emoji.replace_mode = 'unified';
emoji.allow_native = true;

export const DESSERTS = [
  ':tangerine:',
  ':peach:',
  ':strawberry:',
  ':ice_cream:',
  ':doughnut:',
].map(e => emoji.replace_colons(e));

function randPick(arr) {
  const ind = Math.floor(Math.random() * arr.length);
  return arr[ind];
}

export function randDessert() {
  return randPick(DESSERTS);
}
