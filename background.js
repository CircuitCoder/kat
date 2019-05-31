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
  });
});
