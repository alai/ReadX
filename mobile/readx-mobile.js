/**
 * ReadX Mobile - 完整版
 * 包含所有核心代码的单文件版本，适用于 Bookmarklet 和快捷指令
 *
 * 使用方法：
 * javascript:(function(){var s=document.createElement('script');s.src='https://your-domain.github.io/ReadX/mobile/readx-mobile.js';document.head.appendChild(s);})();
 */

(function () {
  "use strict";

  // 防止重复注入
  if (window.ReadXMobileActive) {
    if (window.readingModeManager) {
      window.readingModeManager.toggleReadingMode();
    }
    return;
  }
  window.ReadXMobileActive = true;

  console.log(
    "%c ReadX Mobile 🚀",
    "color: #1d9bf0; font-size: 16px; font-weight: bold"
  );

  // ==========================================
  // 核心代码：从 content.js 复制
  // ==========================================

  // 简化版的内容提取器类
  class ReadXExtractor {
    constructor() {
      this.selectors = {
        tweetContainers: [
          'article[data-testid="tweet"]',
          'article[role="article"]',
          "article[aria-labelledby]",
        ],
        tweetText: [
          'div[data-testid="tweetText"]',
          "[lang] > span",
          'article div[dir="auto"]',
        ],
        userInfo: {
          name: 'div[data-testid="User-Name"]',
          avatar: 'div[data-testid="Tweet-User-Avatar"] img',
          handle: 'a[role="link"][href^="/"]',
        },
        engagement: {
          likes: 'button[data-testid="like"]',
          retweets: 'button[data-testid="retweet"]',
          replies: 'button[data-testid="reply"]',
          bookmarks: 'button[data-testid="bookmark"]',
        },
        timestamp: "time[datetime]",
        media: 'div[data-testid="tweetPhoto"] img',
      };
    }

    findElementByPriority(selectors, context = document) {
      for (const selector of selectors) {
        const element = context.querySelector(selector);
        if (element) {
          return element;
        }
      }
      return null;
    }

    isArticlePage() {
      const articleView = document.querySelector(
        '[data-testid="twitterArticleRichTextView"]'
      );
      const draftEditor = document.querySelector(".DraftEditor-root");
      const contentBlocks = document.querySelectorAll('[data-block="true"]');

      return !!(articleView && draftEditor && contentBlocks.length > 0);
    }

    extractMainTweet() {
      if (this.isArticlePage()) {
        console.log("检测到 Article 页面");
        const articleExtractor = new ArticleExtractor();
        return articleExtractor.extract();
      }

      console.log("检测到普通推文页面");
      const tweetContainer = this.findElementByPriority(
        this.selectors.tweetContainers
      );
      if (!tweetContainer) {
        throw new Error("无法找到推文容器");
      }

      return {
        text: this.extractTweetText(tweetContainer),
        user: this.extractUserInfo(tweetContainer),
        engagement: this.extractEngagementData(tweetContainer),
        timestamp: this.extractTimestamp(tweetContainer),
        media: this.extractMedia(tweetContainer),
      };
    }

    extractTweetText(container) {
      const textElement = this.findElementByPriority(
        this.selectors.tweetText,
        container
      );
      if (!textElement) return null;

      return {
        text: textElement.textContent.trim(),
        html: textElement.innerHTML,
        language: textElement.getAttribute("lang") || "auto",
      };
    }

    extractUserInfo(container) {
      const userInfo = {};
      const nameElement = container.querySelector(this.selectors.userInfo.name);
      if (nameElement) {
        userInfo.name = nameElement.textContent.trim();
      }

      const avatarElement = container.querySelector(
        this.selectors.userInfo.avatar
      );
      if (avatarElement) {
        userInfo.avatar = avatarElement.src;
      }

      const handleElement = container.querySelector(
        this.selectors.userInfo.handle
      );
      if (handleElement) {
        const href = handleElement.getAttribute("href");
        userInfo.handle = href ? href.replace("/", "@") : null;
      }

      return userInfo;
    }

    extractEngagementData(container) {
      const engagement = {};
      for (const [type, selector] of Object.entries(
        this.selectors.engagement
      )) {
        const button = container.querySelector(selector);
        if (button) {
          const ariaLabel = button.getAttribute("aria-label") || "";
          const match = ariaLabel.match(/(\d+(?:,\d+)*)/);
          engagement[type] = match ? parseInt(match[1].replace(/,/g, "")) : 0;
        }
      }
      return engagement;
    }

    extractTimestamp(container) {
      const timeElement = container.querySelector(this.selectors.timestamp);
      if (!timeElement) return null;

      return {
        datetime: timeElement.getAttribute("datetime"),
        text: timeElement.textContent.trim(),
        timestamp: new Date(timeElement.getAttribute("datetime")),
      };
    }

    extractMedia(container) {
      const mediaElements = container.querySelectorAll(this.selectors.media);
      const media = [];
      mediaElements.forEach((img) => {
        media.push({
          type: "image",
          src: img.src,
          alt: img.alt || "",
        });
      });
      return media;
    }
  }

  // Article 内容提取器类
  class ArticleExtractor {
    constructor() {
      this.selectors = {
        articleView: '[data-testid="twitterArticleRichTextView"]',
        draftEditor: ".DraftEditor-root",
        contentBlocks: '[data-block="true"]',
        textSpans: 'span[data-text="true"]',
        title: '[data-testid="twitter-article-title"]',
        authorName: '[data-testid="User-Name"]',
        authorUsername: '[data-testid="User-Names"] a[href^="/"]',
        timestamp: "time[datetime]",
      };
    }

    extract() {
      return {
        type: "article",
        title: this.extractTitle(),
        user: this.extractAuthor(),
        content: this.extractContent(),
        timestamp: this.extractTimestamp(),
        text: null,
        engagement: {},
        media: [],
      };
    }

    extractTitle() {
      const titleElement = document.querySelector(this.selectors.title);
      return titleElement ? titleElement.textContent.trim() : "";
    }

    extractAuthor() {
      const author = {};
      const nameElement = document.querySelector(this.selectors.authorName);
      if (nameElement) {
        author.name = nameElement.textContent.trim();
      }

      const usernameElement = document.querySelector(
        this.selectors.authorUsername
      );
      if (usernameElement) {
        author.handle = usernameElement.textContent.trim();
        if (!author.handle.startsWith("@")) {
          author.handle = "@" + author.handle;
        }
      }

      return author;
    }

    extractTimestamp() {
      const timeElement = document.querySelector(this.selectors.timestamp);
      if (!timeElement) return null;

      return {
        datetime: timeElement.getAttribute("datetime"),
        text: timeElement.textContent.trim(),
        timestamp: new Date(timeElement.getAttribute("datetime")),
      };
    }

    extractContent() {
      const contentBlocks = document.querySelectorAll(
        this.selectors.contentBlocks
      );
      const content = [];

      contentBlocks.forEach((block, index) => {
        const blockData = this.extractBlock(block, index);
        if (blockData) {
          content.push(blockData);
        }
      });

      return content;
    }

    extractBlock(block, index) {
      const className = block.className;

      let type = "paragraph";
      if (className.includes("longform-header-two")) {
        type = "heading";
      } else if (className.includes("longform-blockquote")) {
        type = "quote";
      } else if (className.includes("longform-list-item")) {
        type = "list";
      } else if (block.querySelector("img")) {
        type = "image";
      }

      let text = "";
      if (type !== "image") {
        const textSpans = block.querySelectorAll(this.selectors.textSpans);
        text = Array.from(textSpans)
          .map((span) => span.textContent)
          .join("");
      }

      let image = null;
      if (type === "image") {
        const img = block.querySelector("img");
        if (img) {
          image = {
            src: img.src,
            alt: img.alt || "",
          };
        }
      }

      return {
        type,
        text,
        image,
        index,
      };
    }
  }

  // 阅读模式管理器（简化版，移动端优化）
  class ReadingModeManager {
    constructor() {
      this.extractor = new ReadXExtractor();
      this.isReadingModeActive = false;
      this.originalContent = null;
    }

    async toggleReadingMode() {
      if (this.isReadingModeActive) {
        this.exitReadingMode();
      } else {
        await this.enterReadingMode();
      }
    }

    async enterReadingMode() {
      try {
        console.log("进入阅读模式...");
        const extractedContent = this.extractor.extractMainTweet();
        console.log("提取的内容:", extractedContent);

        this.originalContent = document.body.innerHTML;
        await this.createReadingModePage(extractedContent);
        this.isReadingModeActive = true;
      } catch (error) {
        console.error("进入阅读模式失败:", error);
        alert("无法提取内容，请确保您在推文或 Article 页面上。");
      }
    }

    exitReadingMode() {
      if (!this.isReadingModeActive) return;
      console.log("退出阅读模式...");

      if (this.originalContent) {
        document.body.innerHTML = this.originalContent;
      }

      this.isReadingModeActive = false;
      this.originalContent = null;
    }

    async createReadingModePage(content) {
      const settings = {
        theme: "light",
        fontSize: 18,
        lineHeight: 1.7,
        maxWidth: 800,
        fontFamily: "system",
      };

      const html = this.generateHTML(content, settings);
      document.body.innerHTML = html;
      this.setupEventListeners();
      this.applyStyles(settings);
    }

    generateHTML(content, settings) {
      if (content.type === "article") {
        return this.generateArticleHTML(content, settings);
      }
      return this.generateTweetHTML(content, settings);
    }

    generateArticleHTML(content, settings) {
      const { title, user, content: articleContent, timestamp } = content;

      return `
        <div id="readx-reading-mode" class="readx-container" data-theme="${
          settings.theme
        }">
          <header class="readx-header">
            <div class="readx-header-main">
              <button id="readx-settings-toggle" class="readx-settings-btn">⚙️</button>
              <button id="readx-close" class="readx-close-btn">✕</button>
            </div>
            <div class="readx-controls" id="readx-controls-panel" style="display: none;">
              <div class="readx-control-group">
                <label>主题:</label>
                <select id="readx-theme">
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </div>
              <div class="readx-control-group">
                <label>字号:</label>
                <input type="range" id="readx-font-size" min="14" max="24" value="${
                  settings.fontSize
                }">
                <span id="readx-font-size-value">${settings.fontSize}px</span>
              </div>
            </div>
          </header>

          <main class="readx-content">
            <article class="readx-article-content">
              <h1 class="readx-article-title">${
                this.escapeHtml(title) || "未命名文章"
              }</h1>
              <div class="readx-article-meta">
                <span class="readx-author-name">${
                  this.escapeHtml(user.name) || "未知作者"
                }</span>
                <span class="readx-author-handle">${
                  this.escapeHtml(user.handle) || ""
                }</span>
                ${
                  timestamp
                    ? `<time datetime="${timestamp.datetime}">${timestamp.text}</time>`
                    : ""
                }
              </div>
              <div class="readx-article-body">
                ${this.renderArticleContent(articleContent)}
              </div>
            </article>
          </main>
        </div>
      `;
    }

    generateTweetHTML(content, settings) {
      const { text, user, engagement, timestamp, media } = content;

      return `
        <div id="readx-reading-mode" class="readx-container" data-theme="${
          settings.theme
        }">
          <header class="readx-header">
            <div class="readx-header-main">
              <button id="readx-settings-toggle" class="readx-settings-btn">⚙️</button>
              <button id="readx-close" class="readx-close-btn">✕</button>
            </div>
            <div class="readx-controls" id="readx-controls-panel" style="display: none;">
              <div class="readx-control-group">
                <label>主题:</label>
                <select id="readx-theme">
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </div>
              <div class="readx-control-group">
                <label>字号:</label>
                <input type="range" id="readx-font-size" min="14" max="24" value="${
                  settings.fontSize
                }">
                <span id="readx-font-size-value">${settings.fontSize}px</span>
              </div>
            </div>
          </header>

          <main class="readx-content">
            <article class="readx-tweet">
              <header class="readx-tweet-header">
                ${
                  user.avatar
                    ? `<img src="${user.avatar}" alt="头像" class="readx-avatar">`
                    : ""
                }
                <div class="readx-user-info">
                  <h1 class="readx-user-name">${
                    this.escapeHtml(user.name) || "未知用户"
                  }</h1>
                  <p class="readx-user-handle">${
                    this.escapeHtml(user.handle) || ""
                  }</p>
                  ${
                    timestamp
                      ? `<time datetime="${timestamp.datetime}" class="readx-timestamp">${timestamp.text}</time>`
                      : ""
                  }
                </div>
              </header>

              <div class="readx-tweet-text">${
                text ? text.html : "<p>无法提取推文内容</p>"
              }</div>

              ${
                media && media.length > 0
                  ? `
                <div class="readx-media">
                  ${media
                    .map(
                      (m) =>
                        `<img src="${m.src}" alt="${this.escapeHtml(
                          m.alt
                        )}" class="readx-media-image">`
                    )
                    .join("")}
                </div>
              `
                  : ""
              }

              ${
                engagement
                  ? `
                <footer class="readx-engagement">
                  <div class="readx-stats">
                    ${
                      engagement.likes
                        ? `<span class="readx-stat">❤️ ${engagement.likes.toLocaleString()}</span>`
                        : ""
                    }
                    ${
                      engagement.retweets
                        ? `<span class="readx-stat">🔄 ${engagement.retweets.toLocaleString()}</span>`
                        : ""
                    }
                    ${
                      engagement.replies
                        ? `<span class="readx-stat">💬 ${engagement.replies.toLocaleString()}</span>`
                        : ""
                    }
                  </div>
                </footer>
              `
                  : ""
              }
            </article>
          </main>
        </div>
      `;
    }

    renderArticleContent(content) {
      if (!content || content.length === 0) {
        return '<p class="readx-article-paragraph">无法提取文章内容</p>';
      }

      return content
        .map((block) => {
          switch (block.type) {
            case "heading":
              return `<h2 class="readx-article-heading">${this.escapeHtml(
                block.text
              )}</h2>`;
            case "quote":
              return `<blockquote class="readx-article-quote">${this.escapeHtml(
                block.text
              )}</blockquote>`;
            case "list":
              return `<li class="readx-article-list-item">${this.escapeHtml(
                block.text
              )}</li>`;
            case "image":
              if (block.image) {
                return `<figure class="readx-article-image">
                <img src="${block.image.src}" alt="${this.escapeHtml(
                  block.image.alt
                )}" />
                ${
                  block.image.alt
                    ? `<figcaption>${this.escapeHtml(
                        block.image.alt
                      )}</figcaption>`
                    : ""
                }
              </figure>`;
              }
              return "";
            case "paragraph":
            default:
              if (!block.text || block.text.trim() === "") {
                return "";
              }
              return `<p class="readx-article-paragraph">${this.escapeHtml(
                block.text
              )}</p>`;
          }
        })
        .join("\n");
    }

    escapeHtml(text) {
      if (!text) return "";
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }

    setupEventListeners() {
      const closeBtn = document.getElementById("readx-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => this.exitReadingMode());
      }

      const settingsBtn = document.getElementById("readx-settings-toggle");
      const controlsPanel = document.getElementById("readx-controls-panel");
      if (settingsBtn && controlsPanel) {
        settingsBtn.addEventListener("click", () => {
          const isVisible = controlsPanel.style.display !== "none";
          controlsPanel.style.display = isVisible ? "none" : "flex";
          settingsBtn.classList.toggle("active", !isVisible);
        });
      }

      const themeSelect = document.getElementById("readx-theme");
      if (themeSelect) {
        themeSelect.addEventListener("change", (e) => {
          const container = document.querySelector(".readx-container");
          if (container) {
            container.setAttribute("data-theme", e.target.value);
          }
        });
      }

      const fontSizeSlider = document.getElementById("readx-font-size");
      const fontSizeValue = document.getElementById("readx-font-size-value");
      if (fontSizeSlider && fontSizeValue) {
        fontSizeSlider.addEventListener("input", (e) => {
          const size = e.target.value;
          fontSizeValue.textContent = size + "px";
          const content = document.querySelector(".readx-content");
          if (content) {
            content.style.fontSize = size + "px";
          }
        });
      }
    }

    applyStyles(settings) {
      // 样式已通过 CSS 注入
    }
  }

  // ==========================================
  // 移动端 CSS 注入
  // ==========================================
  function injectCSS() {
    const cssId = "readx-mobile-styles";
    if (document.getElementById(cssId)) {
      return;
    }

    const link = document.createElement("link");
    link.id = cssId;
    link.rel = "stylesheet";
    link.href =
      "data:text/css;base64," +
      btoa(`
      /* 这里包含移动端优化的完整 CSS - 从 bookmarklet.js 复制 */
      ${getMobileCSS()}
    `);
    document.head.appendChild(link);
  }

  function getMobileCSS() {
    // 返回压缩的 CSS - 实际部署时从 bookmarklet.js 复制完整 CSS
    return `
      #readx-reading-mode * { box-sizing: border-box; }
      .readx-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #ffffff; z-index: 999999; overflow-y: auto; -webkit-overflow-scrolling: touch; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
      .readx-container[data-theme="dark"] { background: #15202b; color: #ffffff; }
      .readx-header { position: sticky; top: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #e1e8ed; padding: 12px 16px; z-index: 1000; }
      .readx-header-main { display: flex; justify-content: space-between; }
      .readx-settings-btn, .readx-close-btn { background: none; border: none; padding: 12px; border-radius: 50%; font-size: 20px; min-width: 48px; min-height: 48px; cursor: pointer; }
      .readx-controls { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
      .readx-control-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .readx-content { max-width: 800px; margin: 0 auto; padding: 24px 20px; }
      .readx-article-title { font-size: 28px; font-weight: 700; margin: 24px 0 20px; }
      .readx-article-paragraph { font-size: 17px; line-height: 1.7; margin: 0 0 1.5em; }
      .readx-article-heading { font-size: 22px; font-weight: 700; margin: 1.5em 0 0.75em; }
      .readx-article-quote { margin: 1.5em 0; padding: 16px 20px; border-left: 4px solid #1d9bf0; background: #f7f9fa; border-radius: 0 8px 8px 0; }
      .readx-article-image img, .readx-media-image { max-width: 100%; height: auto; border-radius: 12px; }
      select, input { font-size: 15px; padding: 10px; border-radius: 8px; min-height: 44px; }
    `;
  }

  // ==========================================
  // 初始化
  // ==========================================
  function init() {
    injectCSS();

    // 创建全局实例
    window.readingModeManager = new ReadingModeManager();

    // 等待一下再启动
    setTimeout(() => {
      window.readingModeManager.toggleReadingMode();
      console.log("✅ ReadX Mobile 已启动");
      
      // 通知快捷指令任务完成（如果在快捷指令环境中）
      if (typeof completion !== 'undefined') {
        completion({ success: true, message: 'ReadX Mobile 已启动' });
      }
    }, 300);
  }

  // 执行初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
