/**
 * X.com 主贴内容提取器
 * 用于Chrome插件的内容提取逻辑测试
 */

class XTweetExtractor {
  constructor() {
    // 定义优先级选择器
    this.selectors = {
      // 主推文容器选择器（按优先级排序）
      tweetContainers: [
        'article[data-testid="tweet"]',
        'article[role="article"]',
        "article[aria-labelledby]",
      ],

      // 推文文本选择器
      tweetText: [
        'div[data-testid="tweetText"]',
        "[lang] > span", // 备选：带语言属性的文本
        'article div[dir="auto"]', // 更广泛的文本选择器
      ],

      // 用户信息选择器
      userInfo: {
        name: 'div[data-testid="User-Name"]',
        avatar: 'div[data-testid="Tweet-User-Avatar"] img',
        handle: 'a[role="link"][href^="/"][href*="_"]',
      },

      // 互动数据选择器
      engagement: {
        likes: 'button[data-testid="like"]',
        retweets: 'button[data-testid="retweet"]',
        replies: 'button[data-testid="reply"]',
        bookmarks: 'button[data-testid="bookmark"]',
      },

      // 时间戳选择器
      timestamp: "time[datetime]",

      // 媒体内容选择器
      media: 'div[data-testid="tweetPhoto"] img',
    };
  }

  /**
   * 使用优先级选择器找到元素
   */
  findElementByPriority(selectors, context = document) {
    for (const selector of selectors) {
      const element = context.querySelector(selector);
      if (element) {
        console.log(`✅ 找到元素: ${selector}`);
        return element;
      }
    }
    console.warn(`⚠️ 未找到匹配元素: ${selectors.join(", ")}`);
    return null;
  }

  /**
   * 提取推文的主要内容
   */
  extractMainTweet(htmlContent = null) {
    // 如果提供了HTML内容，创建临时DOM
    let doc = document;
    if (htmlContent) {
      const parser = new DOMParser();
      doc = parser.parseFromString(htmlContent, "text/html");
    }

    // 找到主推文容器
    const tweetContainer = this.findElementByPriority(
      this.selectors.tweetContainers,
      doc
    );
    if (!tweetContainer) {
      throw new Error("无法找到推文容器");
    }

    // 提取各部分内容
    const extraction = {
      container: tweetContainer,
      text: this.extractTweetText(tweetContainer),
      user: this.extractUserInfo(tweetContainer),
      engagement: this.extractEngagementData(tweetContainer),
      timestamp: this.extractTimestamp(tweetContainer),
      media: this.extractMedia(tweetContainer),
      metadata: this.extractMetadata(tweetContainer),
    };

    return extraction;
  }

  /**
   * 提取推文文本内容
   */
  extractTweetText(container) {
    const textElement = this.findElementByPriority(
      this.selectors.tweetText,
      container
    );
    if (!textElement) return null;

    return {
      element: textElement,
      text: textElement.textContent.trim(),
      html: textElement.innerHTML,
      language: textElement.getAttribute("lang") || "auto",
    };
  }

  /**
   * 提取用户信息
   */
  extractUserInfo(container) {
    const userInfo = {};

    // 用户名
    const nameElement = container.querySelector(this.selectors.userInfo.name);
    if (nameElement) {
      userInfo.name = nameElement.textContent.trim();
    }

    // 头像
    const avatarElement = container.querySelector(
      this.selectors.userInfo.avatar
    );
    if (avatarElement) {
      userInfo.avatar = avatarElement.src;
    }

    // 用户句柄（@username）
    const handleElement = container.querySelector(
      this.selectors.userInfo.handle
    );
    if (handleElement) {
      const href = handleElement.getAttribute("href");
      userInfo.handle = href ? href.replace("/", "@") : null;
    }

    return userInfo;
  }

  /**
   * 提取互动数据
   */
  extractEngagementData(container) {
    const engagement = {};

    for (const [type, selector] of Object.entries(this.selectors.engagement)) {
      const button = container.querySelector(selector);
      if (button) {
        const ariaLabel = button.getAttribute("aria-label") || "";
        const match = ariaLabel.match(/(\d+(?:,\d+)*)/);
        engagement[type] = match ? parseInt(match[1].replace(/,/g, "")) : 0;
      }
    }

    return engagement;
  }

  /**
   * 提取时间戳
   */
  extractTimestamp(container) {
    const timeElement = container.querySelector(this.selectors.timestamp);
    if (!timeElement) return null;

    return {
      datetime: timeElement.getAttribute("datetime"),
      text: timeElement.textContent.trim(),
      timestamp: new Date(timeElement.getAttribute("datetime")),
    };
  }

  /**
   * 提取媒体内容
   */
  extractMedia(container) {
    const mediaElements = container.querySelectorAll(this.selectors.media);
    const media = [];

    mediaElements.forEach((img) => {
      media.push({
        type: "image",
        src: img.src,
        alt: img.alt || "",
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    });

    return media;
  }

  /**
   * 提取元数据
   */
  extractMetadata(container) {
    return {
      isThread: this.isPartOfThread(container),
      isRetweet: this.isRetweet(container),
      hasQuote: this.hasQuoteTweet(container),
      verified: this.isVerifiedUser(container),
    };
  }

  /**
   * 检查是否为线程的一部分
   */
  isPartOfThread(container) {
    // 简单检查：看是否有"Show this thread"链接或线程连接线
    return !!(
      container.querySelector('[href*="/thread"]') ||
      container.querySelector('div[aria-label*="thread"]')
    );
  }

  /**
   * 检查是否为转推
   */
  isRetweet(container) {
    return !!container.querySelector('[data-testid="socialContext"]');
  }

  /**
   * 检查是否有引用推文
   */
  hasQuoteTweet(container) {
    return !!container.querySelector('[data-testid="quoteTweet"]');
  }

  /**
   * 检查用户是否为认证用户
   */
  isVerifiedUser(container) {
    return !!container.querySelector('svg[data-testid="icon-verified"]');
  }

  /**
   * 为阅读模式生成清洁的HTML
   */
  generateReadingModeHTML(extraction) {
    const { text, user, engagement, timestamp, media } = extraction;

    if (!text) {
      throw new Error("无法提取推文文本内容");
    }

    const html = `
            <article class="reading-mode-tweet">
                <header class="tweet-header">
                    ${
                      user.avatar
                        ? `<img src="${user.avatar}" alt="用户头像" class="user-avatar">`
                        : ""
                    }
                    <div class="user-info">
                        <h3 class="user-name">${user.name || "未知用户"}</h3>
                        <p class="user-handle">${user.handle || ""}</p>
                        ${
                          timestamp
                            ? `<time datetime="${timestamp.datetime}">${timestamp.text}</time>`
                            : ""
                        }
                    </div>
                </header>
                
                <main class="tweet-content">
                    <div class="tweet-text" lang="${text.language}">
                        ${text.html}
                    </div>
                    
                    ${
                      media.length > 0
                        ? `
                        <div class="tweet-media">
                            ${media
                              .map(
                                (m) =>
                                  `<img src="${m.src}" alt="${m.alt}" class="media-image">`
                              )
                              .join("")}
                        </div>
                    `
                        : ""
                    }
                </main>
                
                <footer class="tweet-footer">
                    <div class="engagement-stats">
                        ${
                          engagement.likes
                            ? `<span class="stat">❤️ ${engagement.likes.toLocaleString()}</span>`
                            : ""
                        }
                        ${
                          engagement.retweets
                            ? `<span class="stat">🔄 ${engagement.retweets.toLocaleString()}</span>`
                            : ""
                        }
                        ${
                          engagement.replies
                            ? `<span class="stat">💬 ${engagement.replies.toLocaleString()}</span>`
                            : ""
                        }
                    </div>
                </footer>
            </article>
        `;

    return html;
  }

  /**
   * 生成阅读模式的CSS样式
   */
  generateReadingModeCSS() {
    return `
            .reading-mode-tweet {
                max-width: 650px;
                margin: 0 auto;
                padding: 24px;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                line-height: 1.6;
            }

            .tweet-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid #e1e8ed;
            }

            .user-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                margin-right: 12px;
            }

            .user-info {
                flex: 1;
            }

            .user-name {
                margin: 0 0 4px 0;
                font-size: 18px;
                font-weight: 700;
                color: #14171a;
            }

            .user-handle {
                margin: 0 0 4px 0;
                color: #657786;
                font-size: 14px;
            }

            .tweet-content {
                margin-bottom: 20px;
            }

            .tweet-text {
                font-size: 18px;
                line-height: 1.8;
                color: #14171a;
                word-wrap: break-word;
            }

            .tweet-text span[class*="r-b88u0q"] {
                font-weight: 600;
            }

            .tweet-media {
                margin-top: 16px;
            }

            .media-image {
                width: 100%;
                border-radius: 8px;
                margin-bottom: 8px;
            }

            .tweet-footer {
                padding-top: 16px;
                border-top: 1px solid #e1e8ed;
            }

            .engagement-stats {
                display: flex;
                gap: 20px;
            }

            .stat {
                color: #657786;
                font-size: 14px;
                font-weight: 500;
            }

            time {
                color: #657786;
                font-size: 14px;
            }

            /* 深色模式支持 */
            @media (prefers-color-scheme: dark) {
                .reading-mode-tweet {
                    background: #192734;
                    color: #ffffff;
                }

                .user-name {
                    color: #ffffff;
                }

                .tweet-text {
                    color: #ffffff;
                }

                .tweet-header,
                .tweet-footer {
                    border-color: #38444d;
                }
            }
        `;
  }
}

// 测试用例和演示代码
class XTweetExtractorTest {
  constructor() {
    this.extractor = new XTweetExtractor();
  }

  /**
   * 测试提取功能（使用提供的HTML文件）
   */
  async testExtraction() {
    console.log("🧪 开始测试 X.com 推文提取功能...");

    try {
      // 这里应该加载 ex_article.html 的内容
      // 在实际的Chrome插件中，会直接操作当前页面的DOM
      console.log("📄 模拟从当前页面提取内容...");

      const extraction = this.extractor.extractMainTweet();
      console.log("✅ 提取结果:", extraction);

      // 生成阅读模式HTML
      const readingHTML = this.extractor.generateReadingModeHTML(extraction);
      console.log("📖 阅读模式HTML已生成");

      return {
        success: true,
        extraction,
        readingHTML,
      };
    } catch (error) {
      console.error("❌ 提取失败:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 测试选择器的有效性
   */
  testSelectors() {
    console.log("🎯 测试选择器有效性...");

    const results = {};

    // 测试推文容器选择器
    results.tweetContainers = this.extractor.selectors.tweetContainers.map(
      (selector) => {
        const found = !!document.querySelector(selector);
        console.log(`${found ? "✅" : "❌"} ${selector}`);
        return { selector, found };
      }
    );

    return results;
  }
}

// 导出类供Chrome插件使用
if (typeof module !== "undefined" && module.exports) {
  module.exports = { XTweetExtractor, XTweetExtractorTest };
} else {
  // 浏览器环境下，挂载到全局对象
  window.XTweetExtractor = XTweetExtractor;
  window.XTweetExtractorTest = XTweetExtractorTest;
}

// 如果在浏览器中直接运行，执行测试
if (typeof window !== "undefined") {
  console.log("🚀 X.com 推文提取器已加载");
  console.log("💡 使用方法:");
  console.log("   const extractor = new XTweetExtractor();");
  console.log("   const result = extractor.extractMainTweet();");
  console.log("   console.log(result);");
}
