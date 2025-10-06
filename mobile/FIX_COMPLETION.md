# 修复快捷指令 completion() 错误

## 问题描述

在 iOS 快捷指令中使用"在网页上运行 JavaScript"操作时，会出现错误：

```
The script must call the function 'completion(result)' when finished.
```

## 原因

iOS 快捷指令要求所有"在网页上运行 JavaScript"操作中的代码**必须调用 `completion()` 函数**来通知快捷指令任务已完成。

## 解决方案

### ✅ 正确的代码（已修复）

在快捷指令的 JavaScript 代码中添加 `completion()` 回调：

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

### ❌ 错误的代码（之前的版本）

```javascript
var s = document.createElement("script");
s.src = "https://你的用户名.github.io/ReadX/mobile/readx-mobile.js";
document.head.appendChild(s);
// ❌ 缺少 completion() 调用
```

## 工作原理

1. **创建 script 标签**：`document.createElement("script")`
2. **设置 src**：指向托管的 `readx-mobile.js` 文件
3. **设置 onload 回调**：当脚本加载成功时调用 `completion("ReadX已加载")`
4. **设置 onerror 回调**：当脚本加载失败时调用 `completion("加载失败")`
5. **添加到页面**：`document.head.appendChild(s)`

### 为什么需要 onload/onerror？

- 动态加载脚本是**异步操作**
- 必须等待脚本加载完成后才能调用 `completion()`
- `onload` 确保脚本成功加载后通知快捷指令
- `onerror` 确保加载失败时也能通知快捷指令

## 更新步骤

如果你已经创建了快捷指令，需要更新：

1. **打开快捷指令 App**
2. **找到"ReadX 阅读"快捷指令**
3. **点击右上角的 `...`**（或长按快捷指令）
4. **点击"编辑"**
5. **找到"在网页上运行 JavaScript"操作**
6. **删除旧代码**
7. **粘贴新代码**（包含 completion() 的版本）
8. **点击"完成"保存**

## 验证

更新后再次测试：

1. 在 X App 中打开一条推文
2. 点击分享 → "ReadX 阅读"
3. 应该正常启动，不再报错

## 技术说明

### completion() 函数

- **参数**：可以传递任何值（字符串、对象等）
- **作用**：告诉快捷指令 JavaScript 代码执行完成
- **必须**：在"在网页上运行 JavaScript"中必须调用
- **位置**：可以在代码的任何位置调用，但必须被调用

### 示例

```javascript
// 简单示例
completion("完成");

// 传递对象
completion({ success: true, message: "操作成功" });

// 错误处理
try {
  // 执行某些操作
  completion("成功");
} catch (error) {
  completion("失败: " + error.message);
}
```

## 相关文档

所有文档已更新，包含正确的代码：

- ✅ `mobile/install.html` - 安装指南页面
- ✅ `mobile/QUICKSTART.md` - 快速开始
- ✅ `mobile/README.md` - 完整文档
- ✅ `mobile/IMPLEMENTATION.md` - 实现总结
- ✅ `mobile/readx-mobile.js` - 核心代码（也添加了 completion 支持）

## 常见问题

### Q: 为什么不在 readx-mobile.js 中调用 completion()？

A: 因为：
1. `readx-mobile.js` 是外部加载的脚本
2. 快捷指令需要**同步知道**任务完成
3. 在动态脚本的 `onload` 回调中调用更可靠

### Q: completion() 可以多次调用吗？

A: 不可以。**只能调用一次**，第一次调用后快捷指令就认为任务完成。

### Q: 如果忘记调用 completion() 会怎样？

A: 快捷指令会：
1. 报错提示必须调用 completion()
2. 停止执行后续操作
3. 不会进入阅读模式

## 总结

- ✅ 问题已修复
- ✅ 所有文档已更新
- ✅ 代码包含 onload/onerror 回调
- ✅ 可以正常使用了

现在你可以按照更新后的文档重新创建或编辑快捷指令！🎉
