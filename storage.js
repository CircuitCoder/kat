function promisify(host, f) {
  return (...args) => new Promise(resolve => f.bind(host)(...args, resolve));
}

const sset = promisify(chrome.storage.local, chrome.storage.local.set);
const sget = promisify(chrome.storage.local, chrome.storage.local.get);
const bset = promisify(chrome.browserAction, chrome.browserAction.setBadgeText);
const bcset = promisify(chrome.browserAction, chrome.browserAction.setBadgeBackgroundColor);

async function tabSet(id, status) {
  await sset({ [`tab:${id}`]: status });
  return status;
}

async function tabGet(id) {
  const key = `tab:${id}`;
  return (await sget([key]))[key];
}

export async function applyDessert(dessert, _id = null) {
  const id = _id || (await promisify(chrome.tabs, chrome.tabs.getSelected)()).id;

  await bset({
    text: dessert,
    tabId: id,
  });
  await bcset({ color: '#EEE' });

  return await tabSet(id, {
    type: 'waiting',
    dessert,
  });
}

export async function cancelDessert(_id = null) {
  const id = _id || (await promisify(chrome.tabs, chrome.tabs.getSelected)()).id;

  await bset({
    text: '',
    tabId: id,
  });
  await bcset({ color: '#EEE' });

  return await tabSet(id, {
    type: 'idle',
  });
}

export async function getStatus(_id = null) {
  const id = _id || (await promisify(chrome.tabs, chrome.tabs.getSelected)()).id;
  const key = `tab:${id}`;
  return await tabGet(id) || await initTab(id);
}

export async function initTab(id) {
  return await tabSet(id, {
    type: 'idle',
  });
}
