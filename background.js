// background.js 是新文件，需要创建
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggleDialog" });
});