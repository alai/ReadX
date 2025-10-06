# ReadX Mobile - 快速开始 🚀

## 📱 一句话总结

**在 iPhone 上通过快捷指令，从 X App 一键跳转到 Safari 阅读模式。**

---

## ⚡ 5 分钟快速部署

### 第 1 步：托管文件（2 分钟）

```bash
# 在项目目录
cd /Users/alai/Projects/ReadX

# 如果还没有 Git 仓库，初始化
git init
git add .
git commit -m "Initial commit"

# 创建 GitHub 仓库并推送
gh repo create ReadX --public --push
# 或手动创建仓库，然后：
git remote add origin https://github.com/你的用户名/ReadX.git
git push -u origin main
```

**启用 GitHub Pages**：

1. 进入 GitHub 仓库 → Settings → Pages
2. Source 选择 `main` 分支
3. 保存，等待 1-2 分钟部署完成
4. 记下 URL：`https://你的用户名.github.io/ReadX/`

---

### 第 2 步：创建快捷指令（2 分钟）

#### 在 iPhone 上操作：

1. **打开"快捷指令" App**

2. **创建新快捷指令**：点击右上角 `+`

3. **添加操作 1 - 打开 URL**：

   - 搜索"Safari"
   - 选择"在 Safari 中打开 URL"
   - URL 设置为：`快捷方式输入`（点击选择变量）

4. **添加操作 2 - 运行 JavaScript**：
   - 搜索"JavaScript"
   - 选择"在网页上运行 JavaScript"
   - 粘贴以下代码（**替换 URL**）：

```javascript
var s = document.createElement("script");
s.src = "https://你的用户名.github.io/ReadX/mobile/readx-mobile.js";
document.head.appendChild(s);
```

5. **命名保存**：
   - 点击顶部快捷指令名称
   - 改名为 "ReadX 阅读"
   - 点击"完成"

---

### 第 3 步：测试使用（1 分钟）

1. **打开 X App**（iOS）

2. **找一条推文或 Article**

3. **点击分享按钮**（纸飞机图标）

4. **向下滚动分享菜单**，找到"ReadX 阅读"

5. **点击它**
   - Safari 会自动打开
   - 稍等 1-2 秒
   - ✨ 自动进入阅读模式！

---

## 🎯 完整使用流程

```
┌─────────────────────┐
│  在 X App 看到推文     │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  点击分享 按钮        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  选择 "ReadX 阅读"    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Safari 自动打开      │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  进入阅读模式 📖      │
│                     │
│  • 大字号            │
│  • 清爽排版          │
│  • 深色模式          │
│  • 无干扰            │
└─────────────────────┘
```

---

## 📦 项目文件清单

完成后，你的 `mobile/` 目录应该有这些文件：

```
mobile/
├── readx-mobile.js      ← 核心代码（完整版）
├── bookmarklet.js       ← 骨架代码（可选）
├── install.html         ← 安装指南页面
└── README.md           ← 使用文档
```

**只需要托管这 4 个文件即可！**

---

## ✅ 验证清单

在正式使用前，请确认：

- [ ] `readx-mobile.js` 已上传到 GitHub
- [ ] GitHub Pages 已启用并可访问
- [ ] 可以访问：`https://你的用户名.github.io/ReadX/mobile/readx-mobile.js`
- [ ] 快捷指令中的 URL 已替换为你的实际 URL
- [ ] 快捷指令已保存，命名为"ReadX 阅读"
- [ ] 在 X App 分享菜单中能找到"ReadX 阅读"

---

## 🐛 快速故障排除

### 问题：点击快捷指令后页面空白

**检查**：

```bash
# 在浏览器中直接访问：
https://你的用户名.github.io/ReadX/mobile/readx-mobile.js

# 应该看到 JavaScript 代码
# 如果看不到，说明 GitHub Pages 未部署成功
```

**解决**：

1. 确认 GitHub Pages 已启用
2. 等待 1-2 分钟让部署完成
3. 检查仓库是否为 Public（私有仓库需要 Pro 账号）

---

### 问题：找不到"ReadX 阅读"快捷指令

**解决**：

1. 打开快捷指令 App，确认快捷指令存在
2. 点击快捷指令右上角的 `...` → 分享
3. 确保"在分享表单中显示"已开启
4. 重启 X App

---

### 问题：提示"无法提取内容"

**原因**：

- 不在推文或 Article 页面上
- 页面未加载完成

**解决**：

1. 确保在 X.com 的推文详情页或 Article 页面
2. 等待页面完全加载（看到完整内容）
3. 再次运行快捷指令

---

## 📚 下一步

### 基础使用

阅读 [`mobile/README.md`](./README.md) 了解：

- 详细使用说明
- 界面功能介绍
- 常见问题解答

### 高级配置

- 自定义样式
- 添加分析统计
- 性能优化

### 分享给朋友

将 `mobile/install.html` 部署到网上：

- 访问：`https://你的用户名.github.io/ReadX/mobile/install.html`
- 这是一个漂亮的安装指南页面
- 可以直接分享这个链接给朋友

---

## 💡 小贴士

### 添加到主屏幕（可选）

如果经常使用，可以：

1. 在 Safari 中打开任意 X.com 页面
2. 点击分享 → "添加到主屏幕"
3. 命名为"X 阅读"
4. 图标会出现在主屏幕上

但这样仍然需要通过快捷指令启动阅读模式。

### 设置 Siri 语音

1. 打开快捷指令 App
2. 找到"ReadX 阅读"
3. 点击右上角 `...`
4. 启用"添加到 Siri"
5. 录制语音命令，如："打开阅读模式"

之后可以对 Siri 说："打开阅读模式"来启动！

---

## 🎉 完成！

现在你已经可以在手机上享受清爽的 X.com 阅读体验了！

有问题？查看：

- **详细文档**：`mobile/README.md`
- **安装指南**：`mobile/install.html`
- **核心代码**：`mobile/readx-mobile.js`

祝使用愉快！📖✨
