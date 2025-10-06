# ReadX Mobile - 使用文档

## 📱 概述

ReadX Mobile 是 ReadX Chrome 扩展的移动端版本，让你在 iPhone/iPad 上也能享受清爽的 X.com 阅读体验。

---

## 🎯 核心特性

- ✅ 支持普通推文和 Article 页面
- ✅ 移动端优化（大按钮、大字号、触摸友好）
- ✅ 浅色/深色主题切换
- ✅ 字号、行距自由调整
- ✅ 流畅的滚动体验
- ✅ 零安装（使用快捷指令）

---

## 🚀 快速开始

### 方式 1：iOS 快捷指令（推荐）⭐⭐⭐⭐⭐

**优点**：从 X App 直接分享，无需切换浏览器

#### 安装步骤：

1. **打开快捷指令 App**（iOS 系统自带）

2. **创建新快捷指令**

   - 点击右上角"+"号
   - 点击"添加操作"

3. **添加"在 Safari 中打开 URL"**

   - 搜索"Safari"
   - 选择"在 Safari 中打开 URL"
   - URL 设置为：`快捷方式输入`（选择变量）

4. **添加"运行 JavaScript"**
   - 搜索"JavaScript"
   - 选择"在网页上运行 JavaScript"
   - 粘贴以下代码：

```javascript
var s = document.createElement("script");
s.src = "https://你的域名/ReadX/mobile/readx-mobile.js";
document.head.appendChild(s);
```

5. **命名并保存**
   - 点击快捷指令名称
   - 改名为"ReadX 阅读"
   - 点击"完成"

#### 使用方法：

```
X App 中看到推文
    ↓
点击"分享"按钮
    ↓
向下滚动找到"ReadX 阅读"
    ↓
点击，自动在 Safari 打开阅读模式
    ↓
享受清爽阅读 📖
```

---

### 方式 2：Bookmarklet ⭐⭐⭐

**优点**：在 Safari 中浏览 X.com 时可用

#### 安装步骤：

1. **复制代码**：

```javascript
javascript: (function () {
  var s = document.createElement("script");
  s.src = "https://你的域名/ReadX/mobile/readx-mobile.js";
  document.head.appendChild(s);
})();
```

2. **创建书签**：

   - 在 Safari 中打开任意网页
   - 点击分享按钮 → "添加书签"
   - 名称：`ReadX 阅读`
   - 位置：`个人收藏`
   - 保存

3. **编辑书签**：
   - 打开书签管理
   - 找到"ReadX 阅读"
   - 编辑"地址"，粘贴上面的代码
   - 保存

#### 使用方法：

```
Safari 中打开 x.com 推文/Article
    ↓
点击地址栏
    ↓
输入"ReadX"搜索书签
    ↓
点击书签
    ↓
进入阅读模式
```

---

## 📋 详细使用说明

### 进入阅读模式

1. **从 X App**：

   - 打开推文或 Article
   - 点击分享 → "ReadX 阅读"快捷指令
   - 等待 Safari 打开并自动进入阅读模式

2. **从 Safari**：
   - 在 Safari 中打开 x.com 推文/Article 页面
   - 点击 Bookmarklet
   - 立即进入阅读模式

### 调整设置

1. **打开设置面板**：

   - 点击左上角 ⚙️ 图标

2. **可用设置**：
   - **主题**：浅色/深色
   - **字号**：14px - 24px（拖动滑块）

### 退出阅读模式

- **方法 1**：点击右上角 ✕ 按钮
- **方法 2**：Safari 返回上一页
- **方法 3**：关闭 Safari 标签页

---

## 🎨 界面说明

### 顶部控制栏

```
┌──────────────────────────────┐
│  ⚙️ 设置        ReadX     ✕ 关闭 │
├──────────────────────────────┤
│  主题: [浅色 ▼]                  │
│  字号: [────●────] 18px        │
└──────────────────────────────┘
```

### 内容区域

**Article 页面**：

- 大标题（28px）
- 作者信息和时间
- 格式化的文章内容：
  - 段落
  - 小标题（22px）
  - 引用（蓝色左边框）
  - 列表
  - 图片（自适应宽度）

**普通推文**：

- 用户头像和信息
- 推文文本（18px）
- 图片（如有）
- 互动数据（点赞、转发等）

---

## 🛠️ 托管部署

### 前提条件

你需要将 `readx-mobile.js` 文件托管到可访问的 URL。

### 选项 1：GitHub Pages（推荐）

1. **创建 GitHub 仓库**（如果还没有）

2. **上传文件**：

   ```bash
   cd /Users/alai/Projects/ReadX
   git add mobile/
   git commit -m "Add mobile support"
   git push
   ```

3. **启用 GitHub Pages**：

   - 进入仓库 Settings
   - 找到 Pages 部分
   - Source 选择 `main` 分支
   - 保存

4. **获取 URL**：

   ```
   https://你的用户名.github.io/ReadX/mobile/readx-mobile.js
   ```

5. **更新代码**：
   - 将快捷指令和 Bookmarklet 中的 URL 替换为上面的地址

### 选项 2：其他托管服务

- **Vercel**：`vercel deploy`
- **Netlify**：拖拽上传
- **Cloudflare Pages**：连接 Git 仓库

---

## 📊 性能优化

### 加载速度

- **首次加载**：~2-3 秒（包含网络请求）
- **已缓存**：< 1 秒
- **文件大小**：~50KB（未压缩）

### 移动端优化

- ✅ `-webkit-overflow-scrolling: touch`（iOS 滑动优化）
- ✅ 大按钮尺寸（48x48px，符合 iOS HIG）
- ✅ 防止页面缩放
- ✅ 触摸反馈优化
- ✅ 隐藏滚动条（移动端）

---

## ❓ 常见问题

### Q: 为什么快捷指令运行后页面是空白的？

**A**: 可能的原因：

1. **网络问题**：检查是否能访问托管的 JS 文件
2. **URL 错误**：确认 `readx-mobile.js` 的 URL 正确
3. **页面未加载完成**：等待几秒再运行快捷指令

**解决方法**：

- 在 Safari 中直接访问 JS 文件 URL，确认可以访问
- 检查 Safari 控制台是否有错误信息

---

### Q: 在 X App 中分享时找不到"ReadX 阅读"？

**A**: 可能的原因：

1. **快捷指令未保存**：确认已保存快捷指令
2. **分享菜单需要滚动**：向下滚动分享菜单
3. **未启用分享**：检查快捷指令设置

**解决方法**：

- 打开快捷指令 App，确认"ReadX 阅读"存在
- 在快捷指令详情中，启用"在分享表单中显示"

---

### Q: 为什么有的内容提取不完整？

**A**: 可能的原因：

1. **页面未加载完成**：等待 X.com 页面完全加载
2. **DOM 结构变化**：X.com 可能更新了页面结构
3. **特殊内容格式**：某些特殊格式的内容可能不支持

**解决方法**：

- 等待页面加载完成（看到完整内容）再运行
- 刷新页面重试
- 检查控制台错误信息

---

### Q: 可以离线使用吗？

**A**: 不可以。每次都需要从网络加载 `readx-mobile.js` 文件。

**未来改进**：

- 可以使用 Service Worker 实现离线缓存
- 或者开发独立的 iOS App（可离线使用）

---

### Q: 为什么字体设置不生效？

**A**: 当前版本只支持主题和字号调整，字体切换功能在移动端简化版中暂未实现。

---

### Q: 如何更新到最新版本？

**A**:

1. 如果使用 GitHub Pages，只需 `git push` 新版本
2. 用户无需任何操作，下次运行时自动加载最新版
3. 如果需要立即更新，清除 Safari 缓存

---

## 🔧 高级配置

### 自定义样式

如果想自定义样式，可以修改 `readx-mobile.js` 中的 `getMobileCSS()` 函数：

```javascript
function getMobileCSS() {
  return `
    /* 自定义样式 */
    .readx-article-title {
      font-size: 32px; /* 改为更大的标题 */
      color: #ff0000; /* 红色标题 */
    }
    /* ... 其他样式 */
  `;
}
```

### 添加分析统计

在 `init()` 函数中添加统计代码：

```javascript
function init() {
  injectCSS();
  window.readingModeManager = new ReadingModeManager();

  // 发送统计
  fetch("https://你的统计API/track", {
    method: "POST",
    body: JSON.stringify({ event: "readx_mobile_init" }),
  });

  // ... 其他代码
}
```

---

## 🚀 下一步计划

### 短期优化（快捷指令方案）

- [ ] 添加更多主题选项
- [ ] 支持字体切换
- [ ] 添加阅读进度指示
- [ ] 支持分享当前阅读位置

### 长期计划（原生 App）

如果快捷指令方案验证成功，可以考虑开发：

1. **iOS Share Extension**

   - 在分享菜单中原生显示
   - 更快的启动速度
   - 可以保存阅读历史

2. **独立 iOS App**
   - 完整的离线支持
   - 阅读历史和收藏功能
   - 同步到 iCloud
   - 定制化设置
   - 通过 App Store 分发

---

## 📞 反馈和支持

如果遇到问题或有建议：

1. **检查文档**：先查看本文档的"常见问题"部分
2. **查看控制台**：在 Safari 中打开调试工具，查看错误信息
3. **提交 Issue**：在 GitHub 仓库中提交问题报告
4. **联系开发者**：通过项目主页联系方式反馈

---

## 📄 许可证

与 ReadX Chrome 扩展使用相同的许可证。

---

祝你使用愉快！📖✨
