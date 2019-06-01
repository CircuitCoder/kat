function promisify(host, f) {
  return (...args) => new Promise(resolve => f.bind(host)(...args, resolve));
}

const sset = promisify(chrome.storage.local, chrome.storage.local.set);
const sget = promisify(chrome.storage.local, chrome.storage.local.get);
const bset = promisify(chrome.browserAction, chrome.browserAction.setBadgeText);
const bcset = promisify(chrome.browserAction, chrome.browserAction.setBadgeBackgroundColor);
const tsget = promisify(chrome.tabs, chrome.tabs.getSelected);
const tget = promisify(chrome.tabs, chrome.tabs.get);
const tupd = promisify(chrome.tabs, chrome.tabs.update);
const wupd = promisify(chrome.windows, chrome.windows.update);

async function tabSet(id, status) {
  await sset({ [`tab:${id}`]: status });
  return status;
}

async function tabGet(id) {
  const key = `tab:${id}`;
  return (await sget([key]))[key];
}

async function pendingAdd(id) {
  const now = (await sget(['pending'])).pending || [];
  if(now.includes(id)) return;

  const updated = [...now, id];

  await sset({ pending: updated });
  return updated;
}

async function pendingDrop(id) {
  const now = (await sget(['pending'])).pending || [];
  const index = now.indexOf(id);

  if(index === -1) return;
  const updated = [...now];
  updated.splice(index, 1);

  await sset({ pending: updated });
  return updated;
}

export async function applyDessert({ dessert, weight }, _id = null) {
  const id = _id || (await tsget()).id;
  const tab = await tget(id);

  await bset({
    text: dessert,
    tabId: id,
  });
  await bcset({ color: '#EEE', tabId: id });

  await pendingAdd(id);

  return await tabSet(id, {
    type: 'waiting',
    dessert,
    weight,
    title: tab.title,
    id,
  });
}

export async function cancelDessert(_id = null) {
  const id = _id || (await tsget()).id;

  await bset({
    text: '',
    tabId: id,
  });
  await bcset({ color: '#EEE' });

  await pendingDrop(id);

  return await tabSet(id, {
    type: 'idle',
  });
}

export async function getStatus(_id = null) {
  const id = _id || (await tsget()).id;
  const key = `tab:${id}`;
  return await tabGet(id) || await initTab(id);
}

export async function getAllPendings() {
  const list = (await sget(['pending'])).pending || [];
  const result = await Promise.all(list.map(tabGet));
  console.log(result);
  return result;
}

export async function initTab(id) {
  return await tabSet(id, {
    type: 'idle',
  });
}

export async function gotoTab(id) {
  const tab = await tget(id);
  await tupd(id, { active: true });
  await wupd(tab.windowId, { focused: true });
}

export async function getAllCats() {
  const cats = (await sget(['cats'])).cats || {};
  const list = Object.keys(cats).map(k => ({ ...cats[k], cat: k }));
  list.sort((a, b) => b.weight - a.weight);
  return list;
}

export async function setCatName(cat, name) {
  const cats = (await sget(['cats'])).cats || {};
  if(!(cat in cats)) return;
  cats[cat].name = name;
  await sset({ cats });
}
