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
const tupd = promisify(chrome.tabs, chrome.tabs.update);
const wupd = promisify(chrome.windows, chrome.windows.update);
const bset = promisify(chrome.browserAction, chrome.browserAction.setBadgeText);
const bcset = promisify(chrome.browserAction, chrome.browserAction.setBadgeBackgroundColor);

const notifMapper = new Map();

async function pendingGC(id) {
  const now = (await sget(['pending'])).pending || [];
  const updated = [];

  for(const i of now)
    if(i !== id)
      if(await tget(i))
        updated.push(i);

  console.log('GC Result: ', updated);

  if(updated.length !== now.length) {
    await sset({ pending: updated });
    chrome.runtime.sendMessage({
      msg: 'reload',
    });
  }
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
  const occupiedCats = new Set();
  for(const tab of pending) {
    const desc = (await sget([`tab:${tab}`]))[`tab:${tab}`];
    if(desc.type === 'waiting') waiting.push(desc);
    else occupiedCats.add(desc.cat);
  }

  if(waiting.length == 0) return;

  const availableCats = CATS.filter(e => !occupiedCats.has(e));
  if(availableCats.length == 0) return;

  const desc = randPick(waiting);
  const cat = randPick(availableCats);

  let name;
  let newCat = false;
  const cats = (await sget('cats')).cats || {};
  if(!cats[cat]) {
    cats[cat] = {
      name: '喵喵',
      weight: DEFAULT_CAT_WEIGHT + desc.weight,
    };
    await sset({ cats });

    name = '喵喵';
    newCat = true;
  } else {
    cats[cat].weight += desc.weight;
    await sset({ cats });
    name = cats[cat].name;
  }

  await sset({ [`tab:${desc.id}`]: {
    type: 'cat',
    id: desc.id,
    title: desc.title,
    cat,
    name,
  }});

  await bset({
    text: '喵~',
    tabId: desc.id,
  });
  await bcset({ color: '#c99134', tabId: desc.id });

  chrome.runtime.sendMessage({
    msg: 'reload',
  });

  const message = newCat ? `${cat} 一只新猫咪出现了! 吃掉了 ${desc.dessert}` : `${cat} : ${name} 吃掉了 ${desc.dessert}`;

  chrome.notifications.create({
    type: 'basic',
    title: '喵~',
    message,
    iconUrl: 'img/default_icon.png',
    priority: 2,
  }, id => notifMapper.set(id, desc.id));
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

  chrome.runtime.sendMessage({
    msg: 'reload',
  });
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

  chrome.notifications.onClicked.addListener(async nid => {
    if(notifMapper.has(nid)) {
      const id = notifMapper.get(nid);

      const tab = await tget(id);
      await tupd(id, { active: true });
      await wupd(tab.windowId, { focused: true });
    }
  });
});
