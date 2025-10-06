# X.com Article 页面支持方案

## 📋 概述

本文档描述了为 ReadX 插件增加对 X.com 官方 Article 页面（长文章）支持的技术方案。

## 🎯 目标

- ✅ 识别并提取 X.com 官方 Article 页面的内容
- ✅ 支持多层级内容结构（标题、段落、引用、列表、图片）
- ✅ 保持与现有推文提取器的兼容性
- ✅ 提供良好的阅读体验

## 📁 测试文件说明

### 1. `ex_official_article.html`

- **来源**: X.com Article 页面的完整 HTML
- **用途**: 用于测试和开发
- **特点**: 包含完整的页面结构，包括导航、侧边栏等

### 2. `ex_article_official_article.html`

- **来源**: 从完整页面中提取的文章正文部分
- **用途**: 展示我们需要提取的目标内容
- **特点**: 只包含文章的核心内容（标题、正文、图片）

### 3. `ex_reader_official_article.html`

- **来源**: 当前版本插件作用在 Article 页面上的效果
- **用途**: 对比和验证改进效果
- **状态**: 显示当前版本的不足之处

### 4. `test_article_extraction.html` ⭐

- **类型**: 测试工具页面
- **用途**: 在真实的 Article 页面上测试选择器和提取逻辑
- **使用方法**:
  1. 打开一个 X.com Article 页面
  2. 在浏览器控制台中加载此 HTML 的内容
  3. 查看各个选择器的测试结果
  4. 点击"重新运行测试"按钮进行交互式测试

### 5. `article_extractor_pseudocode.js` ⭐

- **类型**: 伪代码/设计文档
- **用途**: 详细的实现方案和代码结构
- **内容**:
  - Article 页面检测逻辑
  - ArticleExtractor 类的完整实现
  - ArticleRenderer 类的渲染逻辑
  - 与现有系统的集成方案
  - CSS 样式建议
  - 测试清单和未来优化方向

## 🔍 Article 页面的 DOM 结构

### 核心特征

```html
<div data-testid="twitterArticleRichTextView">
  <div class="DraftEditor-root">
    <div class="DraftEditor-editorContainer">
      <div
        class="public-DraftEditor-content"
        data-testid="longformRichTextComponent"
      >
        <div data-contents="true">
          <!-- 内容块 -->
          <blockquote class="longform-blockquote" data-block="true">
            ...
          </blockquote>
          <h2 class="longform-header-two" data-block="true">...</h2>
          <div class="longform-unstyled" data-block="true">...</div>
          <section data-block="true">
            <img src="..." alt="..." />
          </section>
          <!-- 更多内容块... -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### 关键选择器

1. **Article 容器**: `[data-testid="twitterArticleRichTextView"]`
2. **Draft.js 编辑器**: `.DraftEditor-root`
3. **内容块**: `[data-block="true"]`
4. **文本内容**: `span[data-text="true"]`
5. **文章标题**: `[data-testid="twitter-article-title"]`

### 内容块类型

| 类型   | CSS 类                          | HTML 标签             |
| ------ | ------------------------------- | --------------------- |
| 段落   | `.longform-unstyled`            | `<div>`               |
| 标题   | `.longform-header-two`          | `<h2>`                |
| 引用   | `.longform-blockquote`          | `<blockquote>`        |
| 列表项 | `.longform-unordered-list-item` | `<li>`                |
| 图片   | (在 `<section>` 中)             | `<section>` + `<img>` |

## 🏗️ 实现方案

### 1. 检测逻辑

```javascript
function isArticlePage() {
  const articleView = document.querySelector(
    '[data-testid="twitterArticleRichTextView"]'
  );
  const draftEditor = document.querySelector(".DraftEditor-root");
  const hasContentBlocks =
    document.querySelectorAll('[data-block="true"]').length > 0;

  return !!(articleView && draftEditor && hasContentBlocks);
}
```

### 2. 提取流程

```
检测页面类型
    ↓
是 Article? → 使用 ArticleExtractor
    ↓              ↓
    否             提取标题
    ↓              ↓
使用现有         提取作者
推文提取器        ↓
                遍历内容块
                   ↓
                判断块类型
                   ↓
             提取文本/图片
                   ↓
            组合成完整数据
```

### 3. 渲染策略

- **保持层级结构**: 标题、段落、引用各自使用语义化标签
- **样式一致性**: 与现有阅读模式的设计风格保持一致
- **响应式**: 适配不同屏幕尺寸
- **可读性优化**: 合适的行高、字间距、段落间距

## 📊 对比：普通推文 vs Article 页面

| 特性           | 普通推文                          | Article 页面                                 |
| -------------- | --------------------------------- | -------------------------------------------- |
| **容器选择器** | `[data-testid="tweetText"]`       | `[data-testid="twitterArticleRichTextView"]` |
| **内容结构**   | 单一段落，可能有链接              | 多层级：标题、段落、引用、列表、图片         |
| **文本提取**   | 直接 `textContent` 或 `innerHTML` | 遍历 `data-block`，提取 `data-text` span     |
| **编辑器框架** | 无                                | Draft.js                                     |
| **格式保持**   | 简单，主要是换行                  | 复杂，需保持块类型和层级                     |
| **图片处理**   | 通常在推文外部的媒体区域          | 嵌入在内容流中                               |
| **长度**       | 通常较短（<280 字符或长推）       | 长文（数千字）                               |

## ✅ 方案可行性评估

### 已验证的可行性

1. ✅ **DOM 结构稳定**: Article 页面使用 Draft.js，DOM 结构有明确的标记
2. ✅ **选择器可靠**: `data-testid` 和 `data-block` 提供了稳定的定位点
3. ✅ **文本提取清晰**: `span[data-text="true"]` 精确包含文本内容
4. ✅ **类型识别简单**: 通过 CSS 类可以清晰判断块类型
5. ✅ **图片提取直接**: 图片 URL 和 alt 信息易于获取

### 潜在挑战

1. ⚠️ **内嵌推文**: Article 中可能引用其他推文，需要特殊处理
2. ⚠️ **复杂格式**: 可能包含表格、代码块等特殊格式
3. ⚠️ **性能**: 长文章的提取和渲染可能需要优化
4. ⚠️ **维护**: Draft.js 结构可能随 X.com 更新而变化

### 风险评估

- **低风险**: 基础的文本、标题、段落提取
- **中等风险**: 图片、列表的正确渲染
- **高风险**: 内嵌推文、表格、代码块的处理（可以后期优化）

## 🚀 实施步骤

### Phase 1: 基础功能（推荐优先实现）

1. ✅ 创建测试文件和伪代码（已完成）
2. 在 `content.js` 中添加 `isArticlePage()` 函数
3. 实现 `ArticleExtractor` 类
   - `extractTitle()` - 提取标题
   - `extractContent()` - 提取内容块
   - 基础的类型识别（段落、标题、引用）
4. 修改 `ReadingModeManager`
   - 添加 Article 渲染逻辑
   - 适配新的数据结构
5. 在 `content.css` 中添加 Article 专用样式
6. 测试基础功能

### Phase 2: 完善功能

7. 支持图片渲染
8. 支持列表（有序和无序）
9. 优化长文章的性能
10. 添加边界情况处理

### Phase 3: 高级功能（可选）

11. 支持内嵌推文
12. 生成文章目录
13. 添加阅读进度指示
14. 支持导出（Markdown/PDF）

## 🧪 测试策略

### 测试用例

1. **检测测试**

   - 在普通推文页面上不触发 Article 提取
   - 在 Article 页面上正确识别并提取

2. **内容完整性测试**

   - 提取所有段落
   - 提取所有标题
   - 提取所有图片
   - 保持正确的顺序

3. **渲染测试**

   - 标题样式正确
   - 段落间距合理
   - 引用样式清晰
   - 图片正确显示

4. **边界情况测试**
   - 只有标题没有正文
   - 超长文章（>10000 字）
   - 包含特殊字符
   - 包含多语言内容

### 测试工具

- 使用 `test_article_extraction.html` 进行选择器验证
- 在真实的 Article 页面上测试插件
- 对比提取结果与原始页面

## 📝 开发注意事项

1. **向后兼容**: 确保新功能不影响现有的推文提取
2. **错误处理**: 优雅地处理提取失败的情况
3. **性能优化**: 避免在长文章中进行过多的 DOM 查询
4. **样式隔离**: 使用 `.readx-` 前缀避免样式冲突
5. **可维护性**: 代码结构清晰，便于后续扩展

## 🔮 未来扩展

1. **智能摘要**: 使用 AI 生成文章摘要
2. **语音朗读**: TTS 功能
3. **翻译功能**: 多语言支持
4. **笔记功能**: 允许用户在阅读时做笔记
5. **收藏管理**: 本地保存和管理文章
6. **分享功能**: 生成美观的分享卡片

## 📚 参考资源

- **Draft.js 文档**: https://draftjs.org/
- **X.com API 文档**: (官方文档链接)
- **Chrome 扩展开发**: https://developer.chrome.com/docs/extensions/

## ✨ 总结

为 ReadX 插件添加 Article 支持的方案是**完全可行的**。Article 页面使用了结构化的 Draft.js 编辑器，提供了清晰的 DOM 标记，使得内容提取变得相对简单。

**关键优势**:

- 📌 稳定的 DOM 结构和选择器
- 🎯 明确的块类型标识
- 🔧 与现有系统的良好兼容性
- 🚀 逐步实施的灵活性

**建议的实施顺序**:

1. 先实现基础的文本提取（标题、段落、引用）
2. 再添加图片支持
3. 最后处理复杂的嵌套结构（列表、内嵌推文）

这种渐进式的方法可以快速交付基础功能，同时为未来的优化留出空间。
