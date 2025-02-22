chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    const originalText = request.text;
    // 模拟API请求，返回模拟的翻译结果
    const translatedText = `[模拟翻译] ${originalText}`;
    chrome.runtime.sendMessage({
      action: 'showPopup',
      originalText: originalText,
      translatedText: translatedText
    });
  }
});