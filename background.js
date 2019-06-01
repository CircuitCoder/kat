function promisify(host, f) {
  return (...args) => new Promise(resolve => f.bind(host)(...args, resolve));
}

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
});
