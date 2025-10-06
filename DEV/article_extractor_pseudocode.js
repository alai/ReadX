/**
 * X.com Article 页面内容提取器 - 伪代码实现方案
 *
 * 这个文件展示了如何为官方 Article 页面实现内容提取逻辑
 * 它将与现有的普通推文提取器并存，通过页面检测来决定使用哪个提取器
 */

// ============================================================================
// 1. Article 页面检测
// ============================================================================

/**
 * 检测当前页面是否为 X.com 官方 Article 页面
 * @returns {boolean} 如果是 Article 页面返回 true
 */
function isArticlePage() {
  // 方法 1: 检查特定的 data-testid
  const articleView = document.querySelector(
    '[data-testid="twitterArticleRichTextView"]'
  );

  // 方法 2: 检查 Draft.js 编辑器结构
  const draftEditor = document.querySelector(".DraftEditor-root");
  const hasContentBlocks =
    document.querySelectorAll('[data-block="true"]').length > 0;

  // 方法 3: 检查 URL 模式 (可选，作为辅助判断)
  const urlPattern = /\/article\/\d+/;
  const isArticleURL = urlPattern.test(window.location.pathname);

  // 综合判断
  return !!(articleView && draftEditor && hasContentBlocks);
}

// ============================================================================
// 2. Article 内容提取器类
// ============================================================================

class ArticleExtractor {
  constructor() {
    this.articleContainer = null;
    this.draftEditor = null;
  }

  /**
   * 初始化提取器，定位 Article 容器
   * @returns {boolean} 初始化是否成功
   */
  initialize() {
    this.articleContainer = document.querySelector(
      '[data-testid="twitterArticleRichTextView"]'
    );
    this.draftEditor =
      this.articleContainer?.querySelector(".DraftEditor-root");
    return !!(this.articleContainer && this.draftEditor);
  }

  /**
   * 提取文章标题
   * @returns {Object} { text: string, html: string }
   */
  extractTitle() {
    // 优先使用专用的标题选择器
    let titleElement = document.querySelector(
      '[data-testid="twitter-article-title"]'
    );

    // 备用：查找第一个大标题
    if (!titleElement) {
      titleElement = this.draftEditor.querySelector(".longform-header-two, h2");
    }

    if (!titleElement) {
      return { text: "未命名文章", html: "未命名文章" };
    }

    return {
      text: this.extractTextFromElement(titleElement),
      html: titleElement.innerHTML,
    };
  }

  /**
   * 提取文章作者信息
   * @returns {Object} { name: string, username: string, verified: boolean }
   */
  extractAuthor() {
    // 这部分逻辑可以复用现有的 extractAuthor 方法
    // 因为 Article 页面的作者信息区域结构与普通推文相同
    return {
      name:
        document
          .querySelector('[data-testid="User-Name"]')
          ?.textContent?.trim() || "",
      username:
        document
          .querySelector('[data-testid="User-Name"] a[href^="/"]')
          ?.getAttribute("href")
          ?.slice(1) || "",
      verified: !!document.querySelector('[data-testid="icon-verified"]'),
    };
  }

  /**
   * 从元素中提取纯文本
   * Draft.js 的文本存储在 span[data-text="true"] 中
   * @param {HTMLElement} element
   * @returns {string}
   */
  extractTextFromElement(element) {
    const textSpans = element.querySelectorAll('span[data-text="true"]');
    if (textSpans.length > 0) {
      return Array.from(textSpans)
        .map((span) => span.textContent)
        .join("");
    }
    return element.textContent.trim();
  }

  /**
   * 判断内容块的类型
   * @param {HTMLElement} block
   * @returns {string} 'paragraph' | 'heading' | 'quote' | 'list' | 'image' | 'unknown'
   */
  getBlockType(block) {
    const classList = Array.from(block.classList);

    // 段落
    if (classList.some((c) => c.includes("longform-unstyled"))) {
      return "paragraph";
    }

    // 标题
    if (classList.some((c) => c.includes("longform-header"))) {
      return "heading";
    }

    // 引用
    if (classList.some((c) => c.includes("longform-blockquote"))) {
      return "quote";
    }

    // 列表项
    if (
      classList.some(
        (c) =>
          c.includes("longform-list-item") ||
          c.includes("longform-unordered-list-item") ||
          c.includes("longform-ordered-list-item")
      )
    ) {
      return "list";
    }

    // 图片区块（section 标签）
    if (block.tagName === "SECTION" && block.querySelector("img")) {
      return "image";
    }

    return "unknown";
  }

  /**
   * 提取图片信息
   * @param {HTMLElement} block
   * @returns {Object} { url: string, alt: string }
   */
  extractImageFromBlock(block) {
    const img = block.querySelector("img");
    if (!img) return null;

    return {
      url: img.src,
      alt: img.alt || "",
    };
  }

  /**
   * 提取文章正文内容
   * @returns {Array} 内容块数组
   */
  extractContent() {
    const contentBlocks = this.draftEditor.querySelectorAll(
      '[data-block="true"]'
    );
    const extractedBlocks = [];

    contentBlocks.forEach((block) => {
      const blockType = this.getBlockType(block);

      if (blockType === "image") {
        // 图片块
        const imageInfo = this.extractImageFromBlock(block);
        if (imageInfo) {
          extractedBlocks.push({
            type: "image",
            url: imageInfo.url,
            alt: imageInfo.alt,
          });
        }
      } else {
        // 文本块
        const text = this.extractTextFromElement(block);
        if (text.trim()) {
          extractedBlocks.push({
            type: blockType,
            text: text,
            html: block.innerHTML,
          });
        }
      }
    });

    return extractedBlocks;
  }

  /**
   * 提取完整的 Article 数据
   * @returns {Object} 包含标题、作者、内容等的完整数据
   */
  extract() {
    if (!this.initialize()) {
      throw new Error("Failed to initialize ArticleExtractor");
    }

    const title = this.extractTitle();
    const author = this.extractAuthor();
    const contentBlocks = this.extractContent();

    return {
      type: "article",
      title: title,
      author: author,
      content: contentBlocks,
      // 可以添加更多元数据
      timestamp: this.extractTimestamp(),
      stats: this.extractStats(),
    };
  }

  /**
   * 提取发布时间
   * @returns {string}
   */
  extractTimestamp() {
    const timeElement = document.querySelector("time[datetime]");
    return timeElement?.getAttribute("datetime") || "";
  }

  /**
   * 提取统计信息（点赞、转发等）
   * @returns {Object}
   */
  extractStats() {
    // 复用现有的统计信息提取逻辑
    return {
      likes: 0,
      retweets: 0,
      views: 0,
      bookmarks: 0,
    };
  }
}

// ============================================================================
// 3. 内容渲染器
// ============================================================================

class ArticleRenderer {
  /**
   * 将提取的 Article 数据渲染为 HTML
   * @param {Object} articleData - ArticleExtractor.extract() 返回的数据
   * @returns {string} 渲染后的 HTML 字符串
   */
  render(articleData) {
    let html = "";

    // 渲染标题
    html += `<h1 class="readx-article-title">${articleData.title.text}</h1>`;

    // 渲染作者信息（可选）
    html += this.renderAuthor(articleData.author);

    // 渲染内容块
    articleData.content.forEach((block) => {
      html += this.renderBlock(block);
    });

    return html;
  }

  /**
   * 渲染作者信息
   * @param {Object} author
   * @returns {string}
   */
  renderAuthor(author) {
    return `
            <div class="readx-article-author">
                <span class="author-name">${author.name}</span>
                ${
                  author.verified ? '<span class="verified-badge">✓</span>' : ""
                }
                <span class="author-username">@${author.username}</span>
            </div>
        `;
  }

  /**
   * 渲染单个内容块
   * @param {Object} block
   * @returns {string}
   */
  renderBlock(block) {
    switch (block.type) {
      case "heading":
        return `<h2 class="readx-heading">${block.text}</h2>`;

      case "quote":
        return `<blockquote class="readx-quote">${block.text}</blockquote>`;

      case "list":
        return `<li class="readx-list-item">${block.text}</li>`;

      case "image":
        return `<figure class="readx-image"><img src="${block.url}" alt="${block.alt}"></figure>`;

      case "paragraph":
      default:
        return `<p class="readx-paragraph">${block.text}</p>`;
    }
  }
}

// ============================================================================
// 4. 集成到现有系统
// ============================================================================

/**
 * 修改现有的 ReadXExtractor 类，添加 Article 支持
 */
class ReadXExtractor {
  constructor() {
    this.articleExtractor = new ArticleExtractor();
    // ... 现有的属性
  }

  /**
   * 统一的提取接口
   * 自动检测页面类型并使用相应的提取器
   */
  extract() {
    // 检测是否为 Article 页面
    if (isArticlePage()) {
      console.log("检测到 Article 页面，使用 ArticleExtractor");
      return this.articleExtractor.extract();
    }

    // 否则使用现有的普通推文提取逻辑
    console.log("使用普通推文提取器");
    return this.extractTweet(); // 现有方法
  }

  /**
   * 现有的推文提取方法（保持不变）
   */
  extractTweet() {
    // ... 现有代码
  }
}

/**
 * 修改 ReadingModeManager 类，支持渲染 Article
 */
class ReadingModeManager {
  // ... 现有属性和方法

  /**
   * 根据内容类型选择渲染器
   */
  renderContent(data) {
    if (data.type === "article") {
      const renderer = new ArticleRenderer();
      return renderer.render(data);
    } else {
      // 使用现有的推文渲染逻辑
      return this.renderTweet(data); // 现有方法
    }
  }
}

// ============================================================================
// 5. CSS 样式调整
// ============================================================================

/*
需要在 content.css 中添加的样式：

.readx-article-title {
    font-size: 32px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 20px;
}

.readx-article-author {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.readx-heading {
    font-size: 24px;
    font-weight: 600;
    margin-top: 30px;
    margin-bottom: 15px;
    line-height: 1.4;
}

.readx-quote {
    border-left: 4px solid rgba(255, 255, 255, 0.3);
    padding-left: 20px;
    margin: 20px 0;
    font-style: italic;
    color: rgba(255, 255, 255, 0.8);
}

.readx-list-item {
    margin: 10px 0;
    padding-left: 20px;
}

.readx-image {
    margin: 30px 0;
    text-align: center;
}

.readx-image img {
    max-width: 100%;
    border-radius: 8px;
}

.readx-paragraph {
    margin: 15px 0;
    line-height: inherit;
}
*/

// ============================================================================
// 6. 使用示例
// ============================================================================

/*
// 在 content.js 中的使用：

// 当用户触发阅读模式时
function activateReadingMode() {
    const extractor = new ReadXExtractor();
    
    try {
        // 自动检测页面类型并提取
        const data = extractor.extract();
        
        // 渲染内容
        const manager = new ReadingModeManager();
        const html = manager.renderContent(data);
        
        // 显示阅读模式
        manager.show(html);
        
    } catch (error) {
        console.error('提取内容失败:', error);
        alert('无法提取当前页面的内容');
    }
}
*/

// ============================================================================
// 7. 测试清单
// ============================================================================

/*
测试项目：

1. ✅ 页面检测
   - 在普通推文页面上不应该被识别为 Article
   - 在 Article 页面上应该正确识别

2. ✅ 标题提取
   - 提取正确的标题文本
   - 处理标题不存在的情况

3. ✅ 内容块识别
   - 正确识别段落、标题、引用、列表
   - 保持块的原始顺序

4. ✅ 文本提取
   - 从 Draft.js 结构中正确提取文本
   - 处理富文本格式（斜体、粗体等）

5. ✅ 图片提取
   - 提取图片 URL
   - 提取 alt 文本

6. ✅ 渲染效果
   - 标题、段落、引用样式正确
   - 图片正确显示
   - 整体可读性良好

7. ✅ 边界情况
   - 极短的 Article（只有标题和一段）
   - 极长的 Article（大量内容块）
   - 包含特殊字符的内容
   - 包含内嵌推文的 Article
*/

// ============================================================================
// 8. 未来优化方向
// ============================================================================

/*
1. 支持内嵌推文
   - 检测并提取 Article 中引用的其他推文
   - 以卡片形式展示

2. 支持代码块
   - 如果 Article 中有代码，使用代码高亮

3. 支持表格
   - 检测表格结构并正确渲染

4. 目录生成
   - 根据标题层级自动生成文章目录
   - 提供快速跳转功能

5. 进度追踪
   - 显示阅读进度
   - 记住上次阅读位置

6. 导出功能
   - 支持导出为 Markdown
   - 支持导出为 PDF
*/
