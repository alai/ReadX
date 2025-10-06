# 快捷指令代码 - 快速参考

## 📋 完整代码（复制这个）

```javascript
var s = document.createElement("script");
s.src = "https://你的用户名.github.io/ReadX/mobile/readx-mobile.js";
s.onload = function () {
  completion("ReadX已加载");
};
s.onerror = function () {
  completion("加载失败");
};
document.head.appendChild(s);
```

## 🔧 使用步骤

1. **替换 URL**：
   - 将 `你的用户名` 改为你的 GitHub 用户名
   - 例如：`https://john.github.io/ReadX/mobile/readx-mobile.js`

2. **在快捷指令中粘贴**：
   - 打开快捷指令 App
   - 创建新快捷指令
   - 添加"在 Safari 中打开 URL"（URL = 快捷方式输入）
   - 添加"在网页上运行 JavaScript"
   - **粘贴上面的代码**

3. **保存**：
   - 命名为"ReadX 阅读"
   - 点击"完成"

## ⚠️ 重要提示

- **必须包含** `completion()` 调用，否则会报错
- **必须使用** `onload` 和 `onerror` 回调
- **不要删除**任何一行代码

## 📖 更多信息

- 详细说明：`mobile/FIX_COMPLETION.md`
- 快速上手：`mobile/QUICKSTART.md`
- 完整文档：`mobile/README.md`
