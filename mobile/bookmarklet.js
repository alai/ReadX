/**
 * ReadX Mobile Bookmarklet
 * 移动端阅读模式注入脚本
 * 
 * 使用方法：
 * 1. 在 X.com 推文或 Article 页面
 * 2. 通过快捷指令或书签执行此脚本
 * 3. 自动进入阅读模式
 */

(function() {
  'use strict';

  // 防止重复注入
  if (window.ReadXMobileInjected) {
    console.log('ReadX 已加载，切换阅读模式');
    if (window.readingModeManager) {
      window.readingModeManager.toggleReadingMode();
    }
    return;
  }
  window.ReadXMobileInjected = true;

  console.log('ReadX Mobile Bookmarklet 开始加载...');

  // ==========================================
  // 1. 注入 CSS 样式
  // ==========================================
  function injectCSS() {
    const cssId = 'readx-mobile-styles';
    if (document.getElementById(cssId)) {
      return; // 已注入
    }

    const style = document.createElement('style');
    style.id = cssId;
    style.textContent = `
      /* ReadX Mobile Styles - 基于原有样式，增加移动端优化 */
      
      /* 基础容器 */
      #readx-reading-mode * {
        box-sizing: border-box;
      }

      .readx-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #ffffff;
        z-index: 999999;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch; /* iOS 滑动优化 */
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .readx-container[data-theme="dark"] {
        background: #15202b;
        color: #ffffff;
      }

      /* 头部控制栏 - 移动端优化 */
      .readx-header {
        position: sticky;
        top: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid #e1e8ed;
        padding: 12px 16px; /* 增加移动端触摸区域 */
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .readx-container[data-theme="dark"] .readx-header {
        background: rgba(21, 32, 43, 0.95);
        border-bottom-color: #38444d;
      }

      .readx-header-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }

      /* 按钮 - 移动端增大触摸区域 */
      .readx-settings-btn,
      .readx-close-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 12px; /* 从 8px 增加到 12px */
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #657786;
        transition: all 0.2s ease;
        min-width: 48px; /* 增加到 48px (iOS 推荐) */
        min-height: 48px;
        -webkit-tap-highlight-color: transparent; /* 移除点击高亮 */
      }

      .readx-settings-btn:active,
      .readx-close-btn:active {
        background: #f7f9fa;
        color: #1d9bf0;
      }

      .readx-container[data-theme="dark"] .readx-settings-btn:active,
      .readx-container[data-theme="dark"] .readx-close-btn:active {
        background: #1c2938;
      }

      /* 控制面板 - 移动端优化 */
      .readx-controls {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 8px 0;
      }

      .readx-control-group {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .readx-control-group label {
        min-width: 60px;
        color: #0f1419;
        font-weight: 500;
        font-size: 15px; /* 移动端增大字号 */
      }

      .readx-container[data-theme="dark"] .readx-control-group label {
        color: #ffffff;
      }

      /* 滑块 - 移动端增大 */
      input[type="range"] {
        flex: 1;
        min-width: 120px;
        height: 40px; /* 增加触摸区域 */
        -webkit-appearance: none;
        background: transparent;
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 24px; /* 增大滑块 */
        height: 24px;
        border-radius: 50%;
        background: #1d9bf0;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      input[type="range"]::-webkit-slider-runnable-track {
        width: 100%;
        height: 6px; /* 增粗轨道 */
        background: #e1e8ed;
        border-radius: 3px;
      }

      /* 下拉选择 - 移动端优化 */
      select {
        padding: 10px 12px; /* 增加内边距 */
        font-size: 15px; /* 增大字号 */
        border: 1px solid #e1e8ed;
        border-radius: 8px;
        background: #ffffff;
        color: #0f1419;
        min-height: 44px; /* iOS 推荐最小高度 */
      }

      .readx-container[data-theme="dark"] select {
        background: #1c2938;
        color: #ffffff;
        border-color: #38444d;
      }

      /* 主内容区域 */
      .readx-content {
        max-width: 800px;
        margin: 0 auto;
        padding: 24px 20px; /* 移动端增加左右内边距 */
        min-height: calc(100vh - 80px);
      }

      /* 推文容器 */
      .readx-tweet {
        background: transparent;
        padding: 0;
      }

      .readx-tweet-header {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e1e8ed;
      }

      .readx-container[data-theme="dark"] .readx-tweet-header {
        border-bottom-color: #38444d;
      }

      .readx-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .readx-user-info {
        flex: 1;
      }

      .readx-user-name {
        font-size: 17px; /* 移动端增大 */
        font-weight: 700;
        margin: 0 0 4px 0;
        color: #0f1419;
      }

      .readx-container[data-theme="dark"] .readx-user-name {
        color: #ffffff;
      }

      .readx-user-handle {
        font-size: 15px;
        color: #657786;
        margin: 0 0 8px 0;
      }

      .readx-timestamp {
        font-size: 14px;
        color: #657786;
      }

      /* 推文文本 */
      .readx-tweet-text {
        font-size: 18px; /* 移动端增大 */
        line-height: 1.6;
        margin-bottom: 20px;
        color: #0f1419;
        word-wrap: break-word;
      }

      .readx-container[data-theme="dark"] .readx-tweet-text {
        color: #e7e9ea;
      }

      /* Article 样式 */
      .readx-article-title {
        font-size: 28px; /* 移动端调整 */
        font-weight: 700;
        line-height: 1.3;
        margin: 24px 0 20px 0;
        color: #0f1419;
      }

      .readx-container[data-theme="dark"] .readx-article-title {
        color: #ffffff;
      }

      .readx-article-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e1e8ed;
        font-size: 15px;
        color: #657786;
      }

      .readx-container[data-theme="dark"] .readx-article-meta {
        border-bottom-color: #38444d;
      }

      .readx-author-name {
        font-weight: 600;
        color: #0f1419;
      }

      .readx-container[data-theme="dark"] .readx-author-name {
        color: #ffffff;
      }

      .readx-article-paragraph {
        margin: 0 0 1.5em 0;
        font-size: 17px; /* 移动端增大 */
        line-height: 1.7;
        color: #0f1419;
      }

      .readx-container[data-theme="dark"] .readx-article-paragraph {
        color: #e7e9ea;
      }

      .readx-article-heading {
        font-size: 22px; /* 移动端调整 */
        font-weight: 700;
        line-height: 1.4;
        margin: 1.5em 0 0.75em 0;
        color: #0f1419;
      }

      .readx-container[data-theme="dark"] .readx-article-heading {
        color: #ffffff;
      }

      .readx-article-quote {
        margin: 1.5em 0;
        padding: 16px 20px;
        border-left: 4px solid #1d9bf0;
        background: #f7f9fa;
        font-style: italic;
        color: #536471;
        border-radius: 0 8px 8px 0;
      }

      .readx-container[data-theme="dark"] .readx-article-quote {
        background: #1c2938;
        color: #8b98a5;
      }

      .readx-article-list-item {
        margin: 0.5em 0 0.5em 1.5em;
        font-size: 17px;
        list-style: disc;
      }

      .readx-article-image {
        margin: 2em 0;
        text-align: center;
      }

      .readx-article-image img {
        max-width: 100%;
        height: auto;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .readx-media-image {
        max-width: 100%;
        height: auto;
        border-radius: 12px;
        margin: 8px 0;
      }

      /* 互动数据 */
      .readx-engagement {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #e1e8ed;
      }

      .readx-container[data-theme="dark"] .readx-engagement {
        border-top-color: #38444d;
      }

      .readx-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
      }

      .readx-stat {
        font-size: 15px;
        color: #657786;
      }

      /* 移动端响应式 */
      @media (max-width: 768px) {
        .readx-content {
          padding: 20px 16px;
        }

        .readx-article-title {
          font-size: 24px;
        }

        .readx-article-heading {
          font-size: 20px;
        }

        .readx-control-group {
          flex-direction: column;
          align-items: stretch;
        }

        .readx-control-group label {
          min-width: auto;
        }

        input[type="range"] {
          width: 100%;
        }
      }

      /* 手势提示（首次使用） */
      .readx-gesture-hint {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #ffffff;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 999998;
        animation: fadeInOut 3s ease-in-out;
        pointer-events: none;
      }

      @keyframes fadeInOut {
        0%, 100% { opacity: 0; }
        10%, 90% { opacity: 1; }
      }

      /* 滚动条优化（移动端隐藏） */
      .readx-container::-webkit-scrollbar {
        display: none;
      }

      .readx-container {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;

    document.head.appendChild(style);
    console.log('CSS 样式已注入');
  }

  // ==========================================
  // 2. 注入核心 JavaScript 代码
  // ==========================================
  function injectJS() {
    // 检查是否已经注入过核心类
    if (window.ReadXExtractor && window.ArticleExtractor && window.ReadingModeManager) {
      console.log('核心 JS 已存在，跳过注入');
      return;
    }

    // 动态加载完整的 content.js
    // 在生产环境中，这将指向 CDN 或 GitHub Pages
    const script = document.createElement('script');
    script.src = 'https://your-domain.github.io/ReadX/mobile/readx-core.min.js';
    script.onerror = function() {
      console.error('无法加载 ReadX 核心代码');
      alert('ReadX 加载失败，请检查网络连接');
    };
    script.onload = function() {
      console.log('ReadX 核心代码已加载');
    };
    document.head.appendChild(script);
  }

  // ==========================================
  // 3. 移动端特定功能
  // ==========================================
  function addMobileFeatures() {
    // 添加手势提示
    setTimeout(() => {
      const hint = document.createElement('div');
      hint.className = 'readx-gesture-hint';
      hint.textContent = '再次点击关闭按钮退出阅读模式';
      document.body.appendChild(hint);
      
      setTimeout(() => {
        hint.remove();
      }, 3000);
    }, 500);

    // 监听设备旋转
    window.addEventListener('orientationchange', () => {
      // 重新调整布局
      setTimeout(() => {
        const content = document.querySelector('.readx-content');
        if (content) {
          content.style.maxWidth = window.innerWidth > 768 ? '800px' : '100%';
        }
      }, 100);
    });

    // 防止页面缩放
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }

  // ==========================================
  // 4. 执行注入
  // ==========================================
  try {
    injectCSS();
    injectJS();
    addMobileFeatures();

    // 等待 DOM 加载完成后启动阅读模式
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initReadingMode, 500);
      });
    } else {
      setTimeout(initReadingMode, 500);
    }

    function initReadingMode() {
      if (window.readingModeManager) {
        window.readingModeManager.toggleReadingMode();
        console.log('ReadX Mobile 阅读模式已启动');
      } else {
        console.error('ReadingModeManager 未找到');
      }
    }

  } catch (error) {
    console.error('ReadX Mobile 加载失败:', error);
    alert('ReadX 加载失败，请刷新页面重试');
  }

})();
