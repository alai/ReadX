/**
 * 简化版验证脚本 - 直接在控制台逐步运行
 *
 * 使用方法：
 * 1. 打开一个 X.com Article 页面
 * 2. 打开浏览器控制台（F12）
 * 3. 逐个复制粘贴下面的命令块（以空行分隔）
 * 4. 或者一次性复制全部内容执行
 */

console.log(
  "%c=== ReadX Article 验证开始 ===",
  "color: #1da1f2; font-size: 16px; font-weight: bold;"
);

// 第1步：检测 Article 页面
console.log(
  "\n%c【步骤1】检测 Article 页面",
  "color: #0066cc; font-weight: bold;"
);
var articleView = document.querySelector(
  '[data-testid="twitterArticleRichTextView"]'
);
var draftEditor = document.querySelector(".DraftEditor-root");
var contentBlocks = document.querySelectorAll('[data-block="true"]');
console.log("Article 容器:", articleView ? "✅ 找到" : "❌ 未找到");
console.log("Draft.js 编辑器:", draftEditor ? "✅ 找到" : "❌ 未找到");
console.log("内容块数量:", contentBlocks.length);
console.log(
  "结论:",
  articleView && draftEditor && contentBlocks.length > 0
    ? "✅ 这是 Article 页面"
    : "❌ 不是 Article 页面"
);

// 第2步：提取标题
console.log("\n%c【步骤2】提取标题", "color: #0066cc; font-weight: bold;");
var titleElement = document.querySelector(
  '[data-testid="twitter-article-title"]'
);
if (titleElement) {
  console.log("标题:", titleElement.textContent.trim());
} else {
  console.log("❌ 未找到标题");
}

// 第3步：分析内容块类型
console.log(
  "\n%c【步骤3】分析内容块类型",
  "color: #0066cc; font-weight: bold;"
);
var blockTypes = {};
contentBlocks.forEach(function (block) {
  var blockClass = block.className;
  var type = "unknown";

  if (blockClass.includes("longform-unstyled")) type = "paragraph";
  else if (blockClass.includes("longform-header-two")) type = "heading";
  else if (blockClass.includes("longform-blockquote")) type = "quote";
  else if (blockClass.includes("longform-list-item")) type = "list";
  else if (block.querySelector("img")) type = "image";

  blockTypes[type] = (blockTypes[type] || 0) + 1;
});
console.log("内容块统计:", blockTypes);

// 第4步：提取文本内容（前3块）
console.log(
  "\n%c【步骤4】提取文本内容（前3块）",
  "color: #0066cc; font-weight: bold;"
);
var textBlocks = Array.from(contentBlocks).slice(0, 3);
textBlocks.forEach(function (block, index) {
  var textSpans = block.querySelectorAll('span[data-text="true"]');
  var text = Array.from(textSpans)
    .map(function (span) {
      return span.textContent;
    })
    .join("");

  var blockClass = block.className;
  var type = "paragraph";
  if (blockClass.includes("longform-header-two")) type = "heading";
  else if (blockClass.includes("longform-blockquote")) type = "quote";
  else if (blockClass.includes("longform-list-item")) type = "list";

  console.log(
    "块" + (index + 1) + " [" + type + "]:",
    text.substring(0, 100) + (text.length > 100 ? "..." : "")
  );
});

// 第5步：检测图片
console.log("\n%c【步骤5】检测图片", "color: #0066cc; font-weight: bold;");
var imageBlocks = Array.from(contentBlocks).filter(function (block) {
  return block.querySelector("img");
});
console.log("图片数量:", imageBlocks.length);
imageBlocks.slice(0, 3).forEach(function (block, index) {
  var img = block.querySelector("img");
  if (img) {
    console.log("图片" + (index + 1) + " src:", img.src);
    console.log("图片" + (index + 1) + " alt:", img.alt || "(无)");
  }
});

// 第6步：提取作者信息
console.log("\n%c【步骤6】提取作者信息", "color: #0066cc; font-weight: bold;");
var authorNameElement = document.querySelector('[data-testid="User-Name"]');
var authorUsernameElement = document.querySelector(
  '[data-testid="User-Names"] a[href^="/"]'
);
if (authorNameElement) {
  console.log("作者名称:", authorNameElement.textContent.trim());
}
if (authorUsernameElement) {
  console.log("作者用户名:", authorUsernameElement.textContent.trim());
}

// 第7步：完整提取模拟
console.log("\n%c【步骤7】完整提取模拟", "color: #0066cc; font-weight: bold;");
var extractedData = {
  title: titleElement ? titleElement.textContent.trim() : "",
  author: {
    name: authorNameElement ? authorNameElement.textContent.trim() : "",
    username: authorUsernameElement
      ? authorUsernameElement.textContent.trim()
      : "",
  },
  contentBlockCount: contentBlocks.length,
  blockTypes: blockTypes,
  imageCount: imageBlocks.length,
  firstParagraph: "",
};

// 获取第一个段落文本
var firstParagraph = Array.from(contentBlocks).find(function (block) {
  return block.className.includes("longform-unstyled");
});
if (firstParagraph) {
  var textSpans = firstParagraph.querySelectorAll('span[data-text="true"]');
  extractedData.firstParagraph = Array.from(textSpans)
    .map(function (span) {
      return span.textContent;
    })
    .join("")
    .substring(0, 200);
}

console.log("完整数据结构:");
console.log(extractedData);

console.log(
  "\n%c=== 验证完成 ✅ ===",
  "color: #17bf63; font-size: 16px; font-weight: bold;"
);
console.log(
  "%c如果上面的数据都正确提取，说明我们的选择器方案是可行的！",
  "color: #17bf63;"
);
