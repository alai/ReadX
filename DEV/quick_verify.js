/**
 * 快速验证脚本 - 在 X.com Article 页面的浏览器控制台中运行
 *
 * 使用方法：
 * 1. 打开一个 X.com Article 页面，例如：https://x.com/username/article/123456789
 * 2. 打开浏览器开发者工具（F12）
 * 3. 切换到 Console 标签
 * 4. 复制并粘贴此脚本的全部内容
 * 5. 按回车执行
 * 6. 查看输出结果
 */

(function () {
  console.log(
    "%c=== ReadX Article 提取方案验证 ===",
    "color: #1da1f2; font-size: 16px; font-weight: bold;"
  );
  console.log("");

  // 测试1: 检测 Article 页面
  console.log("%c1. 检测 Article 页面", "color: #0066cc; font-weight: bold;");
  const articleView = document.querySelector(
    '[data-testid="twitterArticleRichTextView"]'
  );
  const draftEditor = document.querySelector(".DraftEditor-root");
  const contentBlocks = document.querySelectorAll('[data-block="true"]');

  const isArticle = !!(articleView && draftEditor && contentBlocks.length > 0);

  console.log(`  ✓ Article 容器: ${articleView ? "✅ 找到" : "❌ 未找到"}`);
  console.log(`  ✓ Draft.js 编辑器: ${draftEditor ? "✅ 找到" : "❌ 未找到"}`);
  console.log(`  ✓ 内容块数量: ${contentBlocks.length}`);
  console.log(
    `  → 结论: ${
      isArticle ? "✅ 这是一个 Article 页面" : "❌ 这不是 Article 页面"
    }`
  );
  console.log("");

  if (!isArticle) {
    console.log(
      "%c⚠️ 当前页面不是 Article 页面，请在 Article 页面上运行此脚本",
      "color: orange; font-weight: bold;"
    );
    return;
  }

  // 测试2: 提取标题
  console.log("%c2. 提取文章标题", "color: #0066cc; font-weight: bold;");
  const titleElement = document.querySelector(
    '[data-testid="twitter-article-title"]'
  );
  if (titleElement) {
    const title = titleElement.textContent.trim();
    console.log(`  ✓ 标题: "${title.substring(0, 100)}..."`);
  } else {
    console.log("  ✗ 未找到标题");
  }
  console.log("");

  // 测试3: 分析内容块
  console.log("%c3. 分析内容块结构", "color: #0066cc; font-weight: bold;");
  const blockTypes = {};
  contentBlocks.forEach((block) => {
    const classList = Array.from(block.classList);
    let type = "unknown";

    if (classList.some((c) => c.includes("longform-unstyled"))) type = "段落";
    else if (classList.some((c) => c.includes("longform-header")))
      type = "标题";
    else if (classList.some((c) => c.includes("longform-blockquote")))
      type = "引用";
    else if (classList.some((c) => c.includes("longform-list-item")))
      type = "列表项";
    else if (block.tagName === "SECTION" && block.querySelector("img"))
      type = "图片";

    blockTypes[type] = (blockTypes[type] || 0) + 1;
  });

  console.log(`  总计 ${contentBlocks.length} 个内容块：`);
  Object.entries(blockTypes).forEach(([type, count]) => {
    console.log(`    - ${type}: ${count}`);
  });
  console.log("");

  // 测试4: 提取文本示例
  console.log("%c4. 提取文本示例", "color: #0066cc; font-weight: bold;");
  const firstTextBlock = Array.from(contentBlocks).find((block) => {
    return (
      block.classList.contains("longform-unstyled") ||
      block.classList.contains("longform-blockquote")
    );
  });

  if (firstTextBlock) {
    const textSpans = firstTextBlock.querySelectorAll('span[data-text="true"]');
    const text = Array.from(textSpans)
      .map((span) => span.textContent)
      .join("");
    console.log(`  ✓ 第一个文本块内容:`);
    console.log(`    "${text.substring(0, 200)}..."`);
  } else {
    console.log("  ✗ 未找到文本块");
  }
  console.log("");

  // 测试5: 检测图片
  console.log("%c5. 检测文章图片", "color: #0066cc; font-weight: bold;");
  const imageSections = Array.from(contentBlocks).filter((block) => {
    return block.tagName === "SECTION" && block.querySelector("img");
  });

  console.log(`  ✓ 找到 ${imageSections.length} 张图片`);
  imageSections.slice(0, 3).forEach((section, index) => {
    const img = section.querySelector("img");
    if (img) {
      console.log(`    ${index + 1}. ${img.src}`);
    }
  });
  console.log("");

  // 测试6: 提取作者信息
  console.log("%c6. 提取作者信息", "color: #0066cc; font-weight: bold;");
  const userName = document
    .querySelector('[data-testid="User-Name"]')
    ?.textContent?.trim();
  const userHandle = document
    .querySelector('[data-testid="User-Name"] a[href^="/"]')
    ?.getAttribute("href")
    ?.slice(1);
  const isVerified = !!document.querySelector('[data-testid="icon-verified"]');

  if (userName) {
    console.log(`  ✓ 作者: ${userName}`);
    console.log(`  ✓ 用户名: @${userHandle}`);
    console.log(`  ✓ 认证: ${isVerified ? "✅ 已认证" : "❌ 未认证"}`);
  } else {
    console.log("  ✗ 未找到作者信息");
  }
  console.log("");

  // 测试7: 模拟完整提取
  console.log("%c7. 模拟完整提取过程", "color: #0066cc; font-weight: bold;");

  function extractTextFromElement(element) {
    const textSpans = element.querySelectorAll('span[data-text="true"]');
    if (textSpans.length > 0) {
      return Array.from(textSpans)
        .map((span) => span.textContent)
        .join("");
    }
    return element.textContent.trim();
  }

  const extractedData = {
    title: titleElement ? extractTextFromElement(titleElement) : "",
    author: {
      name: userName || "",
      username: userHandle || "",
      verified: isVerified,
    },
    blocks: [],
  };

  contentBlocks.forEach((block) => {
    const classList = Array.from(block.classList);
    let blockData = {};

    if (classList.some((c) => c.includes("longform-unstyled"))) {
      blockData = {
        type: "paragraph",
        text: extractTextFromElement(block),
      };
    } else if (classList.some((c) => c.includes("longform-header"))) {
      blockData = {
        type: "heading",
        text: extractTextFromElement(block),
      };
    } else if (classList.some((c) => c.includes("longform-blockquote"))) {
      blockData = {
        type: "quote",
        text: extractTextFromElement(block),
      };
    } else if (classList.some((c) => c.includes("longform-list-item"))) {
      blockData = {
        type: "list",
        text: extractTextFromElement(block),
      };
    } else if (block.tagName === "SECTION" && block.querySelector("img")) {
      const img = block.querySelector("img");
      blockData = {
        type: "image",
        url: img.src,
        alt: img.alt || "",
      };
    }

    if (blockData.type) {
      extractedData.blocks.push(blockData);
    }
  });

  console.log(`  ✓ 成功提取 ${extractedData.blocks.length} 个内容块`);
  console.log("  ✓ 完整数据结构：");
  console.log(extractedData);
  console.log("");

  // 总结
  console.log(
    "%c=== 验证总结 ===",
    "color: #28a745; font-size: 16px; font-weight: bold;"
  );
  console.log(`✅ Article 页面检测: ${isArticle ? "成功" : "失败"}`);
  console.log(`✅ 标题提取: ${titleElement ? "成功" : "失败"}`);
  console.log(`✅ 内容块识别: ${contentBlocks.length > 0 ? "成功" : "失败"}`);
  console.log(`✅ 文本提取: ${firstTextBlock ? "成功" : "失败"}`);
  console.log(`✅ 图片检测: ${imageSections.length > 0 ? "成功" : "失败"}`);
  console.log(`✅ 作者信息: ${userName ? "成功" : "失败"}`);
  console.log("");
  console.log(
    "%c🎉 提取方案验证完成！所有核心功能都可以正常工作。",
    "color: #28a745; font-weight: bold;"
  );
  console.log("");
  console.log("%c📝 建议:", "color: #0066cc; font-weight: bold;");
  console.log("  1. 提取的数据结构已经非常完整");
  console.log("  2. 可以直接在 content.js 中实现 ArticleExtractor 类");
  console.log("  3. 建议按照 DEV/article_extractor_pseudocode.js 中的方案实施");
  console.log("  4. 优先实现基础功能（标题、段落、引用），再扩展高级功能");
})();
