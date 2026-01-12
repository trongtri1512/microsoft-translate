document.getElementById('toggle-translator').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('meet.google.com')) {
    alert('Please open a Google Meet call first!');
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: 'toggleTranslator' }, (response) => {
    if (response && response.status === 'success') {
      updateStatus('Translator activated!');
    }
  });
});

document.getElementById('open-app').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000' });
});

function updateStatus(message) {
  document.getElementById('status-text').textContent = message;
}
