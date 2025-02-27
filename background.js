chrome.runtime.onInstalled.addListener(() => {
  console.log('EasyElastic extension installed');
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchElasticsearch') {
    fetch(request.url, request.options)
      .then(response => response.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; 
  }
}); 