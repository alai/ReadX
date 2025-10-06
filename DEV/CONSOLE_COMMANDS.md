# Article 页面快速验证 - 单行命令

在 X.com Article 页面的控制台中，逐行运行以下命令：

## 1. 检测 Article 容器

```javascript
document.querySelector('[data-testid="twitterArticleRichTextView"]');
```

**预期结果**：应该返回一个 `<article>` 元素，不是 `null`

## 2. 检测 Draft.js 编辑器

```javascript
document.querySelector(".DraftEditor-root");
```

**预期结果**：应该返回一个 `<div>` 元素，不是 `null`

## 3. 检测内容块

```javascript
document.querySelectorAll('[data-block="true"]');
```

**预期结果**：应该返回一个 NodeList，长度 > 0（例如 NodeList(50)）

## 4. 查看内容块数量

```javascript
document.querySelectorAll('[data-block="true"]').length;
```

**预期结果**：返回一个数字，例如 `50`

## 5. 查看第一个内容块的类名

```javascript
document.querySelectorAll('[data-block="true"]')[0].className;
```

**预期结果**：包含 `longform-` 前缀，例如 `"public-DraftStyleDefault-block public-DraftStyleDefault-ltr longform-unstyled"`

## 6. 提取第一个内容块的文本

```javascript
Array.from(
  document
    .querySelectorAll('[data-block="true"]')[0]
    .querySelectorAll('span[data-text="true"]')
)
  .map((span) => span.textContent)
  .join("");
```

**预期结果**：返回第一个段落的文本内容

## 7. 提取标题

```javascript
document
  .querySelector('[data-testid="twitter-article-title"]')
  ?.textContent.trim();
```

**预期结果**：返回文章标题字符串

## 8. 统计各类型内容块

```javascript
Array.from(document.querySelectorAll('[data-block="true"]')).reduce(
  (acc, block) => {
    const className = block.className;
    let type = "other";
    if (className.includes("longform-unstyled")) type = "paragraph";
    else if (className.includes("longform-header-two")) type = "heading";
    else if (className.includes("longform-blockquote")) type = "quote";
    else if (className.includes("longform-list-item")) type = "list";
    else if (block.querySelector("img")) type = "image";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  },
  {}
);
```

**预期结果**：返回一个对象，例如 `{paragraph: 45, heading: 3, image: 2}`

## 9. 完整验证（一次性运行）

```javascript
(function () {
  const data = {
    isArticle: !!(
      document.querySelector('[data-testid="twitterArticleRichTextView"]') &&
      document.querySelector(".DraftEditor-root")
    ),
    blockCount: document.querySelectorAll('[data-block="true"]').length,
    title: document
      .querySelector('[data-testid="twitter-article-title"]')
      ?.textContent.trim(),
    firstBlock: Array.from(
      document
        .querySelectorAll('[data-block="true"]')[0]
        ?.querySelectorAll('span[data-text="true"]') || []
    )
      .map((s) => s.textContent)
      .join("")
      .substring(0, 100),
  };
  console.table(data);
  return data;
})();
```

**预期结果**：在控制台显示一个表格，包含所有提取的数据

---

## 🎯 快速判断方法

如果你想最快速地验证，只需运行这一条命令：

```javascript
console.log(
  "Article容器:",
  !!document.querySelector('[data-testid="twitterArticleRichTextView"]'),
  "\nDraft编辑器:",
  !!document.querySelector(".DraftEditor-root"),
  "\n内容块数量:",
  document.querySelectorAll('[data-block="true"]').length,
  "\n标题:",
  document
    .querySelector('[data-testid="twitter-article-title"]')
    ?.textContent.trim()
);
```

如果所有值都显示正确（容器和编辑器是 `true`，块数量 > 0，标题有内容），说明我们的方案完全可行！

---

## ⚠️ 关于 CSP 错误的说明

你看到的 CSP 错误与我们的代码无关，那是 X.com 页面本身加载时产生的。只要：

1. 控制台中有输出结果
2. 返回的不是 `null` 或 `undefined`
3. 能看到正确的数据

就说明验证成功了！
