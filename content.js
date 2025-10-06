/**
 * ReadX Chrome Extension - Content Script
 * 在 X.com 页面中注入，负责内容提取和阅读模式切换
 */

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

  extractMainTweet() {
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

// 阅读模式管理器
class ReadingModeManager {
  constructor() {
    this.extractor = new ReadXExtractor();
    this.isReadingModeActive = false;
    this.originalContent = null;
    this.readingModeContainer = null;
    this.availableFonts = null;
  }

  // 检测系统可用字体
  detectAvailableFonts() {
    if (this.availableFonts) {
      return this.availableFonts;
    }

    const testFonts = [
      // 中文字体
      { name: "PingFang SC", display: "苹方", category: "chinese" },
      { name: "Hiragino Sans GB", display: "冬青黑体", category: "chinese" },
      { name: "Microsoft YaHei", display: "微软雅黑", category: "chinese" },
      { name: "SimHei", display: "黑体", category: "chinese" },
      { name: "SimSun", display: "宋体", category: "chinese" },
      { name: "KaiTi", display: "楷体", category: "chinese" },
      { name: "FangSong", display: "仿宋", category: "chinese" },
      { name: "STHeiti", display: "华文黑体", category: "chinese" },
      { name: "STKaiti", display: "华文楷体", category: "chinese" },
      { name: "STSong", display: "华文宋体", category: "chinese" },
      { name: "STFangsong", display: "华文仿宋", category: "chinese" },
      { name: "LiSu", display: "隶书", category: "chinese" },
      { name: "YouYuan", display: "幼圆", category: "chinese" },
      {
        name: "Noto Sans CJK SC",
        display: "Noto 思源黑体",
        category: "chinese",
      },
      {
        name: "Noto Serif CJK SC",
        display: "Noto 思源宋体",
        category: "chinese",
      },

      // 英文字体
      { name: "Arial", display: "Arial", category: "sans-serif" },
      { name: "Helvetica", display: "Helvetica", category: "sans-serif" },
      {
        name: "Helvetica Neue",
        display: "Helvetica Neue",
        category: "sans-serif",
      },
      { name: "Roboto", display: "Roboto", category: "sans-serif" },
      { name: "Open Sans", display: "Open Sans", category: "sans-serif" },
      { name: "Lato", display: "Lato", category: "sans-serif" },
      {
        name: "Source Sans Pro",
        display: "Source Sans Pro",
        category: "sans-serif",
      },

      {
        name: "Times New Roman",
        display: "Times New Roman",
        category: "serif",
      },
      { name: "Times", display: "Times", category: "serif" },
      { name: "Georgia", display: "Georgia", category: "serif" },
      { name: "Garamond", display: "Garamond", category: "serif" },
      { name: "Book Antiqua", display: "Book Antiqua", category: "serif" },

      { name: "Monaco", display: "Monaco", category: "monospace" },
      { name: "Menlo", display: "Menlo", category: "monospace" },
      { name: "Consolas", display: "Consolas", category: "monospace" },
      { name: "Courier New", display: "Courier New", category: "monospace" },
      { name: "Ubuntu Mono", display: "Ubuntu Mono", category: "monospace" },
      { name: "Fira Code", display: "Fira Code", category: "monospace" },
    ];

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const testString = "中文ABCabc123";
    const baseFontSize = 16;

    // 使用通用字体作为基准
    context.font = `${baseFontSize}px monospace`;
    const baseWidth = context.measureText(testString).width;

    this.availableFonts = {
      system: [
        { value: "system", display: "系统默认" },
        { value: "serif", display: "衬线字体" },
        { value: "sans-serif", display: "无衬线字体" },
        { value: "monospace", display: "等宽字体" },
      ],
      chinese: [],
      english: [],
    };

    testFonts.forEach((font) => {
      context.font = `${baseFontSize}px "${font.name}", monospace`;
      const width = context.measureText(testString).width;

      // 如果宽度与基准不同，说明字体可用
      if (Math.abs(width - baseWidth) > 1) {
        const fontInfo = { value: font.name, display: font.display };

        if (font.category === "chinese") {
          this.availableFonts.chinese.push(fontInfo);
        } else {
          this.availableFonts.english.push(fontInfo);
        }
      }
    });

    return this.availableFonts;
  }

  async generateFontOptions(selectedFont) {
    const fonts = this.detectAvailableFonts();

    // 获取用户添加的字体
    const userFonts = await this.getUserFonts();

    let html = "";

    // 系统默认字体
    fonts.system.forEach((font) => {
      const selected = selectedFont === font.value ? "selected" : "";
      html += `<option value="${font.value}" ${selected}>${font.display}</option>`;
    });

    // 用户自定义字体分组
    if (userFonts && userFonts.length > 0) {
      html += '<optgroup label="我的字体">';
      userFonts.forEach((font) => {
        const selected = selectedFont === font.value ? "selected" : "";
        html += `<option value="${font.value}" ${selected} data-user-font="true">${font.display}</option>`;
      });
      html += "</optgroup>";
    }

    // 中文字体分组
    if (fonts.chinese.length > 0) {
      html += '<optgroup label="中文字体">';
      fonts.chinese.forEach((font) => {
        const selected = selectedFont === font.value ? "selected" : "";
        html += `<option value="${font.value}" ${selected}>${font.display}</option>`;
      });
      html += "</optgroup>";
    }

    // 英文字体分组
    if (fonts.english.length > 0) {
      html += '<optgroup label="英文字体">';
      fonts.english.forEach((font) => {
        const selected = selectedFont === font.value ? "selected" : "";
        html += `<option value="${font.value}" ${selected}>${font.display}</option>`;
      });
      html += "</optgroup>";
    }

    return html;
  }

  // 获取用户添加的字体
  async getUserFonts() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({ userFonts: [] }, (result) => {
        resolve(result.userFonts);
      });
    });
  }

  // 保存用户字体
  async saveUserFont(fontName, fontDisplay) {
    const userFonts = await this.getUserFonts();

    // 检查是否已存在
    const exists = userFonts.some((font) => font.value === fontName);
    if (exists) {
      return { success: false, message: "该字体已存在" };
    }

    userFonts.push({
      value: fontName,
      display: fontDisplay || fontName,
    });

    return new Promise((resolve) => {
      chrome.storage.sync.set({ userFonts }, () => {
        resolve({ success: true });
      });
    });
  }

  // 删除用户字体
  async removeUserFont(fontName) {
    const userFonts = await this.getUserFonts();
    const filtered = userFonts.filter((font) => font.value !== fontName);

    return new Promise((resolve) => {
      chrome.storage.sync.set({ userFonts: filtered }, () => {
        resolve({ success: true });
      });
    });
  }

  // 获取所有系统字体列表（用于字体选择器）
  getAllSystemFonts() {
    const commonFonts = [
      // 中文字体 - 系统默认
      "PingFang SC",
      "PingFang TC",
      "PingFang HK",
      "Hiragino Sans GB",
      "Hiragino Kaku Gothic Pro",
      "Microsoft YaHei",
      "Microsoft JhengHei",
      "SimHei",
      "SimSun",
      "KaiTi",
      "FangSong",
      "STHeiti",
      "STKaiti",
      "STSong",
      "STFangsong",
      "STXihei",
      "STZhongsong",
      "LiSu",
      "YouYuan",
      "Noto Sans CJK SC",
      "Noto Serif CJK SC",
      "Noto Sans CJK TC",
      "Noto Serif CJK TC",
      "Source Han Sans CN",
      "Source Han Serif CN",
      "Source Han Sans TC",
      "Source Han Serif TC",
      "Source Han Sans",
      "Source Han Serif",
      "Songti SC",
      "Songti TC",
      "Heiti SC",
      "Heiti TC",
      "Lantinghei SC",
      "Lantinghei TC",
      "Weibei SC",
      "Weibei TC",
      "Baoli SC",
      "Baoli TC",
      "Hannotate SC",
      "Hannotate TC",
      "HanziPen SC",
      "HanziPen TC",
      "Wawati SC",
      "Wawati TC",
      "Xingkai SC",
      "Yuanti SC",
      "Yuppy SC",

      // 方正字体系列 (FZ - FangZheng)
      "FZShuTi",
      "FZYaoti",
      "FZSongYi",
      "FZKai-Z03S",
      "FZFangSong-Z02S",
      "FZHei-B01S",
      "FZSongS-Extended",
      "FZCuSong-B09S",
      "FZLiShu",
      "FZLiShu-S01S",
      "FZXiaoBiaoSong-B05S",
      "FZDaBiaoSong-B06S",
      "FZXiaoZhuanTi-S13T",
      "FZYaSong-DB-GBK",
      "FZZhongDengXian-Z07T",
      "FZZhunYuan-M02S",
      "FZShaoEr-M11S",
      "FZSongKeBenXiuKai",
      "FZJuZhenXinFang-R-JF",
      "FZCuHei-B03S",
      "FZZongYi-M05S",
      "FZDaHei-B02S",
      "FZXinHuiZhengKai",
      "FZXinXiuLi-R-JF",
      "FZBeiWei-M19S",
      "FZBoYa-B04S",
      "FZBaoSong-Z04S",
      "FZCangErYuan-M10S",
      "FZDaSongKai-Z07T",
      "FZFengYa-Z08S",
      "FZGangSong-S04T",
      "FZHongXingTi-S06T",
      "FZJianXiJianZhuJW-M23S",
      "FZKaTong-M04S",
      "FZLiShuII-S06S",
      "FZLongKai-B05S",
      "FZPingXianYaSong-M08S",
      "FZQingYinTi-M07S",
      "FZShenSu-M11T",
      "FZSongKe-B07S",
      "FZSongKe-B07T",
      "FZSuXinShiLiuKaiS-R-GB",
      "FZXiaoLiShu-S06S",
      "FZXingKai-S04S",
      "FZXingTiJW-S03T",
      "FZYaSong-B-GBK",
      "FZYaSong-H-GBK",
      "FZYaZong-M11S",
      "FZYueYuan-M10S",
      "FZZhengFangCuLiTi-R-JF",
      "FZZhenYan-M19S",
      "FZZhuZi-M34S",
      "FZZongYi-M08S",

      // 汉仪字体系列 (HY - HanYi)
      "HYQiHei",
      "HYKaiTi",
      "HYSong",
      "HYZhongSongS",
      "HYZhongYuanJ",
      "HYFangSongS",
      "HYChaoHei",
      "HYChangLiShu",
      "HYDaHei",
      "HYFangYuan",
      "HYGothic",
      "HYKaiTiS",
      "HYShangWei",
      "HYSuXinTi",
      "HYTangMei",
      "HYTangYi",
      "HYTiesheng",
      "HYWeiBei",
      "HYXiaoMai",
      "HYXingKai",
      "HYYaKu",
      "HYYaSong",
      "HYYiSong",
      "HYZhuoLi",
      "HYZiKuTangSongKeBenLiKai",
      "HYBaiZiMei-EW",
      "HYBeiMei-W01",
      "HYBoLi-EW",
      "HYCanCu-EW",
      "HYCaoShu-EW",
      "HYChuangYi-W01",
      "HYDaXuShengYi",
      "HYFangSong",
      "HYGaoLongJianMeiHeiW",
      "HYGuChuMei-W01",
      "HYHaoTi-W01",
      "HYJingHua-W01",
      "HYJiTou-EW",
      "HYKangYi-EW",
      "HYLiBian-EW",
      "HYMoMo-EW",
      "HYNanGong-EW",
      "HYPanShu-EW",
      "HYQiHei-EES",
      "HYQiQiang-EW",
      "HYRuiYi-EW",
      "HYShangHei-W01",
      "HYShanShan-EW",
      "HYShaoShu-EW",
      "HYShuangXian-EW",
      "HYShuiBoJianMei-W01",
      "HYSongTi",
      "HYTangLi-EW",
      "HYTangSong-EW",
      "HYTangZhi-EW",
      "HYWenHei-85W",
      "HYXiKu-EW",
      "HYXinRen-W01",
      "HYXuanSong-EW",
      "HYYaKu-EW",
      "HYYangGang-W01",
      "HYYanKai-EW",
      "HYYiShu-W01",
      "HYYongZi-EW",
      "HYYuanYi-M",
      "HYZhangCao-EW",
      "HYZhenYan-EW",
      "HYZhongHei",
      "HYZiKuTangSongKeBenLiKai-W05W",

      // 文鼎字体系列
      "AR PL UMing CN",
      "AR PL UKai CN",
      "WenQuanYi Zen Hei",
      "WenQuanYi Micro Hei",
      "WenQuanYi Bitmap Song",

      // LXGW 字体系列 (霞鹜文楷等)
      "LXGW WenKai",
      "LXGW WenKai Mono",
      "LXGW WenKai GB",
      "LXGW WenKai TC",
      "LXGW Bright",
      "LXGW Clear Gothic",
      "LXGW Neo XiHei",
      "LXGW Neo ZhiSong",
      "LXGW Marker Gothic",

      // 思源字体完整系列
      "Source Han Sans",
      "Source Han Serif",
      "Source Han Sans CN",
      "Source Han Sans TW",
      "Source Han Sans HK",
      "Source Han Sans JP",
      "Source Han Sans KR",
      "Source Han Serif CN",
      "Source Han Serif TW",
      "Source Han Serif HK",
      "Source Han Serif JP",
      "Source Han Serif KR",

      // Noto 字体完整系列
      "Noto Sans SC",
      "Noto Serif SC",
      "Noto Sans TC",
      "Noto Serif TC",
      "Noto Sans HK",
      "Noto Serif HK",
      "Noto Sans JP",
      "Noto Serif JP",
      "Noto Sans KR",
      "Noto Serif KR",

      // 其他流行中文字体
      "Ma Shan Zheng",
      "Liu Jian Mao Cao",
      "Long Cang",
      "Zhi Mang Xing",
      "ZCOOL XiaoWei",
      "ZCOOL QingKe HuangYou",
      "ZCOOL KuaiLe",
      "Zeyada",
      "Alibaba PuHuiTi",
      "DingTalk JinBuTi",
      "OPPOSans",
      "HarmonyOS Sans",
      "MiSans",
      "SmileySans",

      // 英文字体 - 系统标准字体
      "Arial",
      "Arial Black",
      "Arial Narrow",
      "Arial Rounded MT Bold",
      "Helvetica",
      "Helvetica Neue",
      "Times New Roman",
      "Times",
      "Georgia",
      "Verdana",
      "Courier New",
      "Courier",
      "Trebuchet MS",
      "Lucida Grande",
      "Lucida Sans",
      "Lucida Sans Unicode",
      "Lucida Console",
      "Palatino",
      "Palatino Linotype",
      "Garamond",
      "Bookman",
      "Book Antiqua",
      "Comic Sans MS",
      "Impact",
      "Monaco",
      "Menlo",
      "Consolas",
      "Andale Mono",
      "Tahoma",
      "Geneva",
      "Century Gothic",
      "Futura",
      "Gill Sans",
      "Optima",
      "Didot",
      "American Typewriter",
      "Copperplate",
      "Papyrus",
      "Brush Script MT",
      "Zapfino",
      "Chalkboard",
      "Chalkboard SE",
      "Marker Felt",
      "SignPainter",
      "Trattatello",

      // macOS 系统字体
      "SF Pro Display",
      "SF Pro Text",
      "SF Pro Rounded",
      "SF Mono",
      "SF Compact Display",
      "SF Compact Text",
      "SF Compact Rounded",
      "New York",
      "Apple Chancery",
      "Apple Color Emoji",
      "Apple SD Gothic Neo",
      "Apple Symbols",
      "Avenir",
      "Avenir Next",
      "Avenir Next Condensed",
      "Baskerville",
      "Big Caslon",
      "Bodoni 72",
      "Bodoni 72 Oldstyle",
      "Bodoni 72 Smallcaps",
      "Bradley Hand",
      "Cochin",
      "Hoefler Text",
      "Luminari",
      "Noteworthy",
      "Phosphate",
      "Rockwell",
      "Savoye LET",
      "Snell Roundhand",

      // Google Fonts 常见字体
      "Roboto",
      "Roboto Condensed",
      "Roboto Slab",
      "Roboto Mono",
      "Open Sans",
      "Open Sans Condensed",
      "Lato",
      "Montserrat",
      "Source Sans Pro",
      "Source Code Pro",
      "Raleway",
      "PT Sans",
      "PT Serif",
      "PT Mono",
      "Ubuntu",
      "Ubuntu Mono",
      "Ubuntu Condensed",
      "Noto Sans",
      "Noto Serif",
      "Fira Sans",
      "Fira Code",
      "Fira Mono",
      "Inter",
      "Poppins",
      "Nunito",
      "Nunito Sans",
      "Playfair Display",
      "Merriweather",
      "Merriweather Sans",
      "Oswald",
      "Lora",
      "Crimson Text",
      "Crimson Pro",
      "Work Sans",
      "IBM Plex Sans",
      "IBM Plex Serif",
      "IBM Plex Mono",
      "JetBrains Mono",
      "Cascadia Code",
      "Cascadia Mono",
      "Victor Mono",
      "Space Mono",
      "Space Grotesk",
      "DM Sans",
      "DM Serif Display",
      "Barlow",
      "Manrope",
      "Sora",
      "Plus Jakarta Sans",
    ];

    // 使用更可靠的字体检测方法
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // 定义一个检测函数
    const isFontAvailable = (fontName) => {
      // 使用多个测试字符串，包括中文、英文和数字
      const testStrings = [
        "mmmmmmmmmmlli", // 英文 - 使用宽度变化明显的字母组合
        "中文测试字体汉字", // 中文 - 使用多个常见汉字
        "1234567890", // 数字
        "iIl1O0oO", // 容易混淆的字符
        "AVAWAVAТ", // 大写字母组合
      ];

      const baseFonts = ["monospace", "sans-serif", "serif"];

      for (const testString of testStrings) {
        for (const baseFont of baseFonts) {
          context.font = `72px ${baseFont}`;
          const baseWidth = context.measureText(testString).width;

          context.font = `72px "${fontName}", ${baseFont}`;
          const testWidth = context.measureText(testString).width;

          // 如果任意组合检测到差异，说明字体可用
          // 降低阈值提高灵敏度
          if (Math.abs(testWidth - baseWidth) > 0.1) {
            return true;
          }
        }
      }

      return false;
    };

    // 检测所有字体
    const availableFonts = commonFonts.filter((fontName) =>
      isFontAvailable(fontName)
    );

    console.log(`[ReadX] 检测到 ${availableFonts.length} 个可用字体`);
    return availableFonts.sort();
  }

  // 显示添加字体对话框
  async showAddFontDialog() {
    const systemFonts = this.getAllSystemFonts();
    const userFonts = await this.getUserFonts();
    const userFontNames = userFonts.map((f) => f.value);

    // 创建对话框HTML
    const dialogHTML = `
      <div id="readx-font-dialog" class="readx-font-dialog">
        <div class="readx-font-dialog-content">
          <div class="readx-font-dialog-header">
            <h3>添加字体</h3>
            <button id="readx-font-dialog-close" class="readx-dialog-close-btn">×</button>
          </div>
          
          <div class="readx-font-dialog-body">
            <div class="readx-font-search">
              <input type="text" id="readx-font-search" placeholder="搜索字体..." />
            </div>
            
            <div class="readx-font-list" id="readx-font-list">
              ${systemFonts
                .map(
                  (font) => `
                <div class="readx-font-item ${
                  userFontNames.includes(font) ? "added" : ""
                }" 
                     data-font="${font}">
                  <span class="readx-font-name" style="font-family: '${font}', sans-serif;">${font}</span>
                  <button class="readx-font-add-btn" ${
                    userFontNames.includes(font) ? "disabled" : ""
                  }>
                    ${userFontNames.includes(font) ? "已添加" : "添加"}
                  </button>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    // 插入对话框
    const dialogContainer = document.createElement("div");
    dialogContainer.innerHTML = dialogHTML;
    document.body.appendChild(dialogContainer.firstElementChild);

    // 设置事件监听器
    this.setupFontDialogListeners();
  }

  // 设置字体对话框事件监听器
  setupFontDialogListeners() {
    const dialog = document.getElementById("readx-font-dialog");
    const closeBtn = document.getElementById("readx-font-dialog-close");
    const searchInput = document.getElementById("readx-font-search");
    const fontList = document.getElementById("readx-font-list");

    // 关闭对话框
    const closeDialog = () => {
      if (dialog) {
        dialog.remove();
      }
    };

    closeBtn.addEventListener("click", closeDialog);

    // 点击对话框外部关闭
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        closeDialog();
      }
    });

    // 搜索功能
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const fontItems = fontList.querySelectorAll(".readx-font-item");

      fontItems.forEach((item) => {
        const fontName = item.dataset.font.toLowerCase();
        if (fontName.includes(searchTerm)) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    });

    // 添加字体按钮
    fontList.addEventListener("click", async (e) => {
      if (
        e.target.classList.contains("readx-font-add-btn") &&
        !e.target.disabled
      ) {
        const fontItem = e.target.closest(".readx-font-item");
        const fontName = fontItem.dataset.font;

        e.target.disabled = true;
        e.target.textContent = "添加中...";

        const result = await this.saveUserFont(fontName, fontName);

        if (result.success) {
          e.target.textContent = "已添加";
          fontItem.classList.add("added");

          // 刷新字体选择器
          await this.refreshFontSelector();

          // 显示成功提示
          this.showToast("字体已添加成功");
        } else {
          e.target.disabled = false;
          e.target.textContent = "添加";
          this.showToast(result.message, "error");
        }
      }
    });
  }

  // 刷新字体选择器
  async refreshFontSelector() {
    const fontSelect = document.getElementById("readx-font-family");
    if (!fontSelect) return;

    const currentValue = fontSelect.value;
    const newOptions = await this.generateFontOptions(currentValue);
    fontSelect.innerHTML = newOptions;
    fontSelect.value = currentValue;
  }

  // 显示提示消息
  showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `readx-toast readx-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2000);
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

      // 提取推文内容
      const extractedContent = this.extractor.extractMainTweet();
      console.log("提取的内容:", extractedContent);

      // 保存原始内容
      this.originalContent = document.body.innerHTML;

      // 创建阅读模式页面
      await this.createReadingModePage(extractedContent);

      this.isReadingModeActive = true;

      // 通知 background script
      chrome.runtime.sendMessage({
        action: "extractedContent",
        data: extractedContent,
      });
    } catch (error) {
      console.error("进入阅读模式失败:", error);

      // 通知 background script 错误
      chrome.runtime.sendMessage({
        action: "errorOccurred",
        error: error.message,
      });

      // 显示错误提示
      this.showErrorMessage("无法提取推文内容，请确保您在一个推文页面上。");
    }
  }

  exitReadingMode() {
    if (!this.isReadingModeActive) return;

    console.log("退出阅读模式...");

    // 恢复原始内容
    if (this.originalContent) {
      document.body.innerHTML = this.originalContent;
    }

    // 清理状态
    this.isReadingModeActive = false;
    this.originalContent = null;
    this.readingModeContainer = null;

    // 重新绑定事件监听器（因为innerHTML被替换）
    this.setupEventListeners();
  }

  async createReadingModePage(content) {
    // 获取用户设置
    const settings = await this.getSettings();

    // 创建阅读模式HTML
    const readingModeHTML = await this.generateReadingModeHTML(
      content,
      settings
    );

    // 替换页面内容
    document.body.innerHTML = readingModeHTML;

    // 立即设置主题属性
    const container = document.querySelector(".readx-container");
    if (container) {
      container.setAttribute("data-theme", settings.theme);
    }

    // 应用样式
    this.applyReadingModeStyles(settings);

    // 设置事件监听器
    this.setupReadingModeEventListeners();
  }

  async generateReadingModeHTML(content, settings) {
    const { text, user, engagement, timestamp, media } = content;

    // 获取字体选项HTML
    const fontOptions = await this.generateFontOptions(settings.fontFamily);

    return `
      <div id="readx-reading-mode" class="readx-container">
        <!-- 头部控制栏 -->
        <header class="readx-header">
          <div class="readx-header-main">
            <button id="readx-settings-toggle" class="readx-settings-btn" title="设置">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </button>
            
            <button id="readx-close" class="readx-close-btn" title="退出阅读模式 (ESC ESC)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          <div class="readx-controls" id="readx-controls-panel" style="display: none;">
            <div class="readx-control-group">
              <label>主题:</label>
              <select id="readx-theme">
                <option value="light" ${
                  settings.theme === "light" ? "selected" : ""
                }>浅色</option>
                <option value="dark" ${
                  settings.theme === "dark" ? "selected" : ""
                }>深色</option>
              </select>
            </div>
            
            <div class="readx-control-group">
              <label>字号:</label>
              <input type="range" id="readx-font-size" min="14" max="24" value="${
                settings.fontSize
              }">
              <span id="readx-font-size-value">${settings.fontSize}px</span>
            </div>
            
            <div class="readx-control-group">
              <label>行距:</label>
              <input type="range" id="readx-line-height" min="1.2" max="2.5" step="0.1" value="${
                settings.lineHeight
              }">
              <span id="readx-line-height-value">${settings.lineHeight}</span>
            </div>
            
            <div class="readx-control-group">
              <label>宽度:</label>
              <input type="range" id="readx-max-width" min="500" max="900" step="50" value="${
                settings.maxWidth
              }">
              <span id="readx-max-width-value">${settings.maxWidth}px</span>
            </div>
            
            <div class="readx-control-group">
              <label>字体:</label>
              <select id="readx-font-family">
                ${fontOptions}
              </select>
              <button id="readx-add-font" class="readx-add-font-btn" title="添加用户字体">+</button>
            </div>
          </div>
        </header>

        <!-- 主要内容区域 -->
        <main class="readx-content">
          <article class="readx-tweet">
            <!-- 用户信息 -->
            <header class="readx-tweet-header">
              ${
                user.avatar
                  ? `<img src="${user.avatar}" alt="用户头像" class="readx-avatar">`
                  : ""
              }
              <div class="readx-user-info">
                <h1 class="readx-user-name">${user.name || "未知用户"}</h1>
                <p class="readx-user-handle">${user.handle || ""}</p>
                ${
                  timestamp
                    ? `<time datetime="${timestamp.datetime}" class="readx-timestamp">${timestamp.text}</time>`
                    : ""
                }
              </div>
            </header>

            <!-- 推文内容 -->
            <div class="readx-tweet-text" ${
              text.language ? `lang="${text.language}"` : ""
            }>
              ${text ? text.html : "<p>无法提取推文内容</p>"}
            </div>

            <!-- 媒体内容 -->
            ${
              media && media.length > 0
                ? `
              <div class="readx-media">
                ${media
                  .map(
                    (m) =>
                      `<img src="${m.src}" alt="${m.alt}" class="readx-media-image">`
                  )
                  .join("")}
              </div>
            `
                : ""
            }

            <!-- 互动数据 -->
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
                  ${
                    engagement.bookmarks
                      ? `<span class="readx-stat">🔖 ${engagement.bookmarks.toLocaleString()}</span>`
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

  applyReadingModeStyles(settings) {
    const styleId = "readx-dynamic-styles";
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const fontFamilyMap = {
      system:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      serif: 'Georgia, "Times New Roman", Times, serif',
      "sans-serif": "Arial, Helvetica, sans-serif",
      monospace: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
    };

    // 如果是自定义字体，直接使用字体名称
    let fontFamily = fontFamilyMap[settings.fontFamily];
    if (!fontFamily) {
      // 自定义字体，添加回退字体
      fontFamily = `"${settings.fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    }

    styleElement.textContent = `
      .readx-content {
        font-size: ${settings.fontSize}px !important;
        line-height: ${settings.lineHeight} !important;
        max-width: ${settings.maxWidth}px !important;
        font-family: ${fontFamily} !important;
      }
      
      .readx-container[data-theme="${settings.theme}"] {
        color-scheme: ${settings.theme};
      }
    `;
  }

  // 动态更新样式（用于实时调整）
  updateDynamicStyles() {
    const currentSettings = this.getCurrentSettings();
    this.applyReadingModeStyles(currentSettings);
  }

  setupReadingModeEventListeners() {
    // 关闭按钮
    const closeBtn = document.getElementById("readx-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.exitReadingMode());
    }

    // ESC ESC 双击退出
    let escPressCount = 0;
    let escTimer = null;

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        escPressCount++;

        if (escPressCount === 1) {
          escTimer = setTimeout(() => {
            escPressCount = 0;
          }, 500); // 500ms内双击有效
        } else if (escPressCount === 2) {
          clearTimeout(escTimer);
          escPressCount = 0;
          this.exitReadingMode();
        }
      }
    });

    // 控制项事件监听器
    this.setupControlListeners();
  }

  setupControlListeners() {
    // 设置按钮切换
    const settingsToggle = document.getElementById("readx-settings-toggle");
    const controlsPanel = document.getElementById("readx-controls-panel");
    if (settingsToggle && controlsPanel) {
      settingsToggle.addEventListener("click", () => {
        const isHidden = controlsPanel.style.display === "none";
        controlsPanel.style.display = isHidden ? "flex" : "none";
        settingsToggle.classList.toggle("active", isHidden);
      });
    }

    // 主题切换
    const themeSelect = document.getElementById("readx-theme");
    if (themeSelect) {
      themeSelect.addEventListener("change", (e) => {
        this.updateSetting("theme", e.target.value);
        document
          .querySelector(".readx-container")
          .setAttribute("data-theme", e.target.value);
      });
    }

    // 字号调整
    const fontSizeSlider = document.getElementById("readx-font-size");
    const fontSizeValue = document.getElementById("readx-font-size-value");
    if (fontSizeSlider && fontSizeValue) {
      fontSizeSlider.addEventListener("input", (e) => {
        const size = e.target.value;
        fontSizeValue.textContent = size + "px";
        this.updateSetting("fontSize", parseInt(size));
        // 使用动态样式表更新，而不是内联样式
        this.updateDynamicStyles();
      });
    }

    // 行距调整
    const lineHeightSlider = document.getElementById("readx-line-height");
    const lineHeightValue = document.getElementById("readx-line-height-value");
    if (lineHeightSlider && lineHeightValue) {
      lineHeightSlider.addEventListener("input", (e) => {
        const height = e.target.value;
        lineHeightValue.textContent = height;
        this.updateSetting("lineHeight", parseFloat(height));
        // 使用动态样式表更新，而不是内联样式
        this.updateDynamicStyles();
      });
    }

    // 宽度调整
    const maxWidthSlider = document.getElementById("readx-max-width");
    const maxWidthValue = document.getElementById("readx-max-width-value");
    if (maxWidthSlider && maxWidthValue) {
      maxWidthSlider.addEventListener("input", (e) => {
        const width = e.target.value;
        maxWidthValue.textContent = width + "px";
        this.updateSetting("maxWidth", parseInt(width));
        // 使用动态样式表更新，而不是内联样式
        this.updateDynamicStyles();
      });
    }

    // 字体切换
    const fontFamilySelect = document.getElementById("readx-font-family");
    if (fontFamilySelect) {
      fontFamilySelect.addEventListener("change", (e) => {
        this.updateSetting("fontFamily", e.target.value);
        this.updateDynamicStyles();
      });
    }

    // 添加字体按钮
    const addFontBtn = document.getElementById("readx-add-font");
    if (addFontBtn) {
      addFontBtn.addEventListener("click", () => {
        this.showAddFontDialog();
      });
    }
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        {
          theme: "light",
          fontSize: 18,
          lineHeight: 1.8,
          maxWidth: 700,
          fontFamily: "system",
        },
        resolve
      );
    });
  }

  getCurrentSettings() {
    return {
      theme: document.getElementById("readx-theme")?.value || "light",
      fontSize: parseInt(
        document.getElementById("readx-font-size")?.value || "18"
      ),
      lineHeight: parseFloat(
        document.getElementById("readx-line-height")?.value || "1.8"
      ),
      maxWidth: parseInt(
        document.getElementById("readx-max-width")?.value || "700"
      ),
      fontFamily:
        document.getElementById("readx-font-family")?.value || "system",
    };
  }

  updateSetting(key, value) {
    chrome.storage.sync.set({ [key]: value });
  }

  showErrorMessage(message) {
    // 创建简单的错误提示
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // 3秒后自动移除
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  setupEventListeners() {
    // 重新设置页面的事件监听器（如果需要）
    console.log("重新设置事件监听器");
  }
}

// 初始化
const readingModeManager = new ReadingModeManager();

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "toggleReadingMode":
      readingModeManager.toggleReadingMode();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: "Unknown action" });
  }

  return true;
});

// 页面加载完成后的初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("ReadX content script 已加载");
  });
} else {
  console.log("ReadX content script 已加载");
}
