function promisify(host, f) {
  return (...args) => new Promise(resolve => f.bind(host)(...args, resolve));
}

const CATS = [
  '=^._.^= ∫',
  '(=^･ω･^=)',
  '(^・x・^)',
  '( ⓛ ω ⓛ *)',
  '/ᐠ｡ꞈ｡ᐟ❁ \\∫',
  '/ᐠ –ꞈ –ᐟ\\',
  '/ᐠ. ᴗ.ᐟ\\',
  '[^._.^]ﾉ彡',
  '=＾´• ⋏ •`＾=',
];

const DEFAULT_CAT_WEIGHT = 3000;
const CAT_INTERVAL = 1;
const DROP_WEIGHT_INTERVAL = 10;
const CAT_PROB = 0.5;
const DROP_RATE_MIN = 0.9;
const DROP_RATE_MAX = 0.975;

const sset = promisify(chrome.storage.local, chrome.storage.local.set);
const sget = promisify(chrome.storage.local, chrome.storage.local.get);
const tget = promisify(chrome.tabs, chrome.tabs.get);

async function pendingGC(id) {
  const now = (await sget(['pending'])).pending || [];
  const updated = [];

  for(const i of now)
    if(i !== id)
      if(await tget(i))
        updated.push(i);

  console.log('GC Result: ', updated);

  await sset({ pending: updated });
  return updated;
}

function randPick(arr) {
  const ind = Math.floor(Math.random() * arr.length);
  return arr[ind];
}

async function assignCat() {
  if(Math.random() > CAT_PROB) return;

  const pending = (await sget(['pending'])).pending || [];
  const waiting = [];
  for(const tab of pending) {
    const desc = (await sget([`tab:${tab}`]))[`tab:${tab}`];
    if(desc.type === 'waiting') waiting.push(desc);
  }

  if(waiting.length == 0) return;

  const desc = randPick(waiting);
  const cat = randPick(CATS);

  let name;
  const cats = (await sget('cats')).cats || {};
  if(!cats[cat]) {
    cats[cat] = {
      name: '喵喵',
      weight: DEFAULT_CAT_WEIGHT + desc.weight,
    };
    await sset({ cats });

    name = '喵喵';
  } else {
    name = cats[cat].name;
  }

  await sset({ [`tab:${desc.id}`]: {
    type: 'cat',
    id: desc.id,
    title: desc.title,
    cat,
    name,
  }});
}

async function dropWeight() {
  const cats = (await sget('cats')).cats || {};
  for(const cat in cats) {
    const weight = cats[cat].weight;

    const rate = Math.random() * (DROP_RATE_MAX - DROP_RATE_MIN) + DROP_RATE_MIN;

    const diff = weight - DEFAULT_CAT_WEIGHT;
    cats[cat].weight = DEFAULT_CAT_WEIGHT + diff * rate;
  }

  await sset({ cats });
}

chrome.runtime.onInstalled.addListener(() => {
  // TODO: initialize cat storage
  //
  chrome.tabs.onCreated.addListener(({ id }) => {
    chrome.storage.local.set({ [`tab:${id}`]: {
      type: 'idle',
    }});
  })

  chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
    console.log('Switching to: ', tabId);
    // TODO: switch icon
  });

  chrome.tabs.onRemoved.addListener(tabId => {
    console.log('Closed: ', tabId);
    pendingGC(tabId);
  });

  chrome.alarms.create('cat-pick', {
    periodInMinutes: CAT_INTERVAL,
  });

  chrome.alarms.create('drop-weight', {
    periodInMinutes: DROP_WEIGHT_INTERVAL,
  });

  chrome.alarms.onAlarm.addListener(alarm => {
    if(alarm.name === 'cat-pick')
      assignCat();
    else if(alarm.name === 'drop-weight')
      dropWeight();
  });
});
