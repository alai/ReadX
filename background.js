/**
 * ReadX Chrome Extension - Background Script
 * 处理插件的后台逻辑和消息传递
 */

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log("ReadX 插件已安装");

  // 设置默认配置
  chrome.storage.sync.set({
    theme: "light",
    fontSize: 18,
    lineHeight: 1.8,
    maxWidth: 700,
    fontFamily: "system",
  });
});

// 监听工具栏图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
  // 确保是在 X.com 页面上
  if (!tab.url.includes("x.com") && !tab.url.includes("twitter.com")) {
    console.log("不在 X.com 页面上");
    return;
  }

  try {
    // 向 content script 发送消息，触发阅读模式
    await chrome.tabs.sendMessage(tab.id, {
      action: "toggleReadingMode",
    });
  } catch (error) {
    console.error("发送消息失败:", error);

    // 如果 content script 未加载，尝试注入
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      // 重试发送消息
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: "toggleReadingMode",
          });
        } catch (retryError) {
          console.error("重试发送消息失败:", retryError);
        }
      }, 100);
    } catch (injectError) {
      console.error("注入 content script 失败:", injectError);
    }
  }
});

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "extractedContent":
      console.log("收到提取的内容:", request.data);
      sendResponse({ success: true });
      break;

    case "errorOccurred":
      console.error("Content script 错误:", request.error);
      sendResponse({ success: false });
      break;

    default:
      console.log("未知消息类型:", request.action);
      sendResponse({ success: false });
  }

  return true; // 保持消息通道开放
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log("存储设置已更新:", changes);

  // 可以在这里处理设置变化的逻辑
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(`设置 ${key} 从 ${oldValue} 变更为 ${newValue}`);
  }
});

// 错误处理
chrome.runtime.onStartup.addListener(() => {
  console.log("ReadX 插件已启动");
});

// 插件卸载时的清理（开发时有用）
chrome.runtime.onSuspend.addListener(() => {
  console.log("ReadX 插件即将挂起");
});
