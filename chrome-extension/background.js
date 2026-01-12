chrome.runtime.onInstalled.addListener(() => {
  console.log('Google Meet Translator extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('meet.google.com')) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleTranslator' });
  }
});
