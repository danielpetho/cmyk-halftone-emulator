// i18n module for CMYK Halftone Figma Plugin
// Supports English (en) and Chinese (zh)

type Lang = 'en' | 'zh';

interface TranslationEntry {
    en: string;
    zh: string;
}

const translations: Record<string, TranslationEntry> = {
    // Section titles
    'section.preset': { en: 'Preset', zh: '预设' },
    'section.blendMode': { en: 'Blend Mode', zh: '混合模式' },
    'section.halftoneSettings': { en: 'Halftone Settings', zh: '半色调设置' },
    'section.imagePrefiltering': { en: 'Image (Pre-filtering)', zh: '图像（预处理）' },
    'section.noiseTexture': { en: 'Noise & Texture', zh: '噪点与纹理' },
    'section.screenAngles': { en: 'Screen Angles', zh: '网屏角度' },
    'section.inkColors': { en: 'Ink Colors', zh: '油墨颜色' },

    // Control labels
    'label.frequency': { en: 'Frequency', zh: '频率' },
    'label.dotSize': { en: 'Dot Size', zh: '网点大小' },
    'label.roughness': { en: 'Roughness', zh: '粗糙度' },
    'label.fuzz': { en: 'Fuzz', zh: '模糊边缘' },
    'label.randomness': { en: 'Randomness', zh: '随机性' },
    'label.threshold': { en: 'Threshold', zh: '阈值' },
    'label.contrast': { en: 'Contrast', zh: '对比度' },
    'label.lightness': { en: 'Lightness', zh: '亮度' },
    'label.blur': { en: 'Blur', zh: '模糊' },
    'label.paperNoise': { en: 'Paper Noise', zh: '纸张噪点' },
    'label.inkNoise': { en: 'Ink Noise', zh: '油墨噪点' },
    'label.cyan': { en: 'Cyan', zh: '青色' },
    'label.magenta': { en: 'Magenta', zh: '品红' },
    'label.yellow': { en: 'Yellow', zh: '黄色' },
    'label.black': { en: 'Black', zh: '黑色' },
    'label.background': { en: 'Background', zh: '背景' },

    // Tooltips
    'tip.preset': {
        en: 'Save and load your halftone settings as presets. Presets are stored locally in the plugin.',
        zh: '将半色调设置保存为预设并加载。预设存储在插件本地。'
    },
    'tip.blendMode': {
        en: 'Subtractive: Traditional CMYK printing (dark inks on light paper). Additive: For light/neon inks on dark backgrounds. Normal: Most flexible, works with any color combination.',
        zh: '减色：传统 CMYK 印刷（浅色纸上的深色油墨）。加色：适用于深色背景上的浅色/荧光油墨。正常：最灵活，适用于任何颜色组合。'
    },
    'tip.frequency': {
        en: 'Controls the density of halftone dots. Higher values = more dots.',
        zh: '控制半色调网点密度。数值越高 = 网点越多。'
    },
    'tip.dotSize': {
        en: 'Maximum size of halftone dots. Larger values = bigger dots.',
        zh: '半色调网点的最大尺寸。数值越大 = 网点越大。'
    },
    'tip.roughness': {
        en: 'Adds irregular edges to dots for a more organic, vintage printing look.',
        zh: '为网点添加不规则边缘，营造更自然的复古印刷效果。'
    },
    'tip.fuzz': {
        en: 'Controls the softness of dot edges. Higher values create smoother transitions.',
        zh: '控制网点边缘的柔和度。数值越高，过渡越平滑。'
    },
    'tip.randomness': {
        en: 'Randomly shifts dot positions to break up regular grid patterns.',
        zh: '随机移动网点位置，打破规则网格图案。'
    },
    'tip.threshold': {
        en: 'Eliminates small dots below this value to remove artifacts. 0.05-0.15 recommended.',
        zh: '消除低于此值的小网点以去除瑕疵。推荐值 0.05-0.15。'
    },
    'tip.contrast': {
        en: 'Adjusts the tonal range of the image before halftone processing.',
        zh: '在半色调处理前调整图像的色调范围。'
    },
    'tip.lightness': {
        en: 'Adjusts the overall brightness before halftone processing.',
        zh: '在半色调处理前调整整体亮度。'
    },
    'tip.blur': {
        en: 'Softens edges before halftone to reduce harsh cutoffs.',
        zh: '在半色调处理前柔化边缘，减少生硬的截断。'
    },
    'tip.paperNoise': {
        en: 'Adds texture variation to the paper surface for a more realistic look.',
        zh: '为纸面添加纹理变化，使效果更逼真。'
    },
    'tip.inkNoise': {
        en: 'Simulates ink density variation for authentic printing imperfections.',
        zh: '模拟油墨密度变化，呈现真实的印刷瑕疵。'
    },

    // Blend mode options
    'option.subtractive': { en: 'Subtractive (CMYK)', zh: '减色（CMYK）' },
    'option.additive': { en: 'Additive', zh: '加色' },
    'option.normal': { en: 'Normal (Alpha)', zh: '正常（透明度）' },
    'option.default': { en: 'Default', zh: '默认' },

    // Buttons
    'btn.cancel': { en: 'Cancel', zh: '取消' },
    'btn.apply': { en: 'Apply', zh: '应用' },
    'btn.resetDefaults': { en: 'Reset to Defaults', zh: '重置为默认值' },
    'btn.save': { en: 'Save', zh: '保存' },
    'btn.delete': { en: 'Delete', zh: '删除' },

    // Titles / attributes
    'title.about': { en: 'About', zh: '关于' },
    'title.savePreset': { en: 'Save preset', zh: '保存预设' },
    'title.deletePreset': { en: 'Delete preset', zh: '删除预设' },
    'title.toggleVisibility': { en: 'Toggle visibility', zh: '切换可见性' },
    'title.alwaysVisible': { en: 'Always visible', zh: '始终可见' },
    'title.zoomIn': { en: 'Zoom in', zh: '放大' },
    'title.zoomOut': { en: 'Zoom out', zh: '缩小' },
    'title.fitToView': { en: 'Fit to view', zh: '适应视图' },
    'title.dragToResize': { en: 'Drag to resize', zh: '拖动调整大小' },
    'title.switchLang': { en: '切换语言 / Switch Language', zh: '切换语言 / Switch Language' },

    // Empty state / loading
    'state.selectImage': { en: 'Select an image', zh: '选择图像' },
    'state.selectImageDesc': {
        en: 'Select an image or a shape with an image fill in Figma to apply the halftone effect.',
        zh: '在 Figma 中选择图像或具有图像填充的形状，以应用半色调效果。'
    },
    'state.processing': { en: 'Processing...', zh: '处理中...' },

    // About modal
    'about.title': { en: 'CMYK Halftone', zh: 'CMYK 半色调' },
    'about.version': { en: 'Version 1.0.0', zh: '版本 1.0.0' },
    'about.whatIsThis': { en: 'What is this?', zh: '这是什么？' },
    'about.whatIsThisDesc': {
        en: 'Emulate the look of <a href="https://en.wikipedia.org/wiki/Halftone" target="_blank">CMYK halftone printing</a> with customizable inks, screen angles.',
        zh: '使用可自定义的油墨和网屏角度，模拟 <a href="https://en.wikipedia.org/wiki/Halftone" target="_blank">CMYK 半色调印刷</a>的效果。'
    },
    'about.howToUse': { en: 'How to use', zh: '使用方法' },
    'about.step1': { en: 'Select an image or shape with an image fill', zh: '选择图像或具有图像填充的形状' },
    'about.step2': { en: 'Adjust the halftone settings to your liking', zh: '根据喜好调整半色调设置' },
    'about.step3': { en: 'Click "Apply" to replace the original or create a new image', zh: '点击"应用"替换原图或创建新图像' },
    'about.links': { en: 'Links', zh: '链接' },
    'about.reportBug': { en: 'Report a bug', zh: '报告问题' },
    'about.createdBy': { en: 'Created by', zh: '作者' },
    'about.madeWith': {
        en: 'Made with ♥ by <a href="https://danielpetho.com" target="_blank">Daniel Petho</a>',
        zh: '由 <a href="https://danielpetho.com" target="_blank">Daniel Petho</a> 用 ♥ 制作'
    },

    // Save preset modal
    'preset.saveTitle': { en: 'Save Preset', zh: '保存预设' },
    'preset.nameLabel': { en: 'Preset name', zh: '预设名称' },
    'preset.namePlaceholder': { en: 'My preset', zh: '我的预设' },

    // Delete preset modal
    'preset.deleteTitle': { en: 'Delete Preset', zh: '删除预设' },
    'preset.deleteConfirm': { en: 'Are you sure you want to delete', zh: '确定要删除吗' },

    // JS-generated messages
    'msg.errorLoadingImage': { en: 'Error loading image', zh: '图像加载错误' },
    'msg.selectImage': { en: 'Select an image', zh: '选择图像' },
    'msg.pleaseSelect': {
        en: 'Please select an image or shape with an image fill.',
        zh: '请选择图像或具有图像填充的形状。'
    },
    'msg.error': { en: 'Error', zh: '错误' },
    'msg.errorOccurred': { en: 'An error occurred.', zh: '发生了一个错误。' },
    'msg.webglNotSupported': { en: 'WebGL not supported', zh: '不支持 WebGL' },
    'msg.webglDesc': {
        en: 'This plugin requires WebGL. Please try a different browser.',
        zh: '此插件需要 WebGL。请尝试使用其他浏览器。'
    },
};

let currentLang: Lang = 'en';

const STORAGE_KEY = 'cmyk-halftone-lang';

/**
 * Get the translated string for a key in the current language.
 */
export function t(key: string): string {
    const entry = translations[key];
    if (!entry) {
        console.warn(`[i18n] Missing translation key: "${key}"`);
        return key;
    }
    return entry[currentLang];
}

/**
 * Get the current language.
 */
export function getCurrentLang(): Lang {
    return currentLang;
}

/**
 * Set the language and apply translations to the DOM.
 */
export function setLanguage(lang: Lang): void {
    currentLang = lang;
    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch (_e) {
        // localStorage may not be available in some Figma sandbox modes
    }
    applyTranslations();
    updateLangButton();
}

/**
 * Toggle between English and Chinese.
 */
export function toggleLanguage(): void {
    setLanguage(currentLang === 'en' ? 'zh' : 'en');
}

/**
 * Apply translations to all DOM elements with data-i18n and data-i18n-tip attributes.
 */
function applyTranslations(): void {
    // Translate text content
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        const entry = translations[key];
        if (!entry) return;

        const text = entry[currentLang];
        // Check if the translation contains HTML (links, etc.)
        if (text.includes('<a ') || text.includes('<br')) {
            el.innerHTML = text;
        } else {
            el.textContent = text;
        }
    });

    // Translate tooltips (data-tip attribute)
    document.querySelectorAll<HTMLElement>('[data-i18n-tip]').forEach((el) => {
        const key = el.getAttribute('data-i18n-tip');
        if (!key) return;
        const entry = translations[key];
        if (!entry) return;
        el.setAttribute('data-tip', entry[currentLang]);
    });

    // Translate title attributes
    document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
        const key = el.getAttribute('data-i18n-title');
        if (!key) return;
        const entry = translations[key];
        if (!entry) return;
        el.setAttribute('title', entry[currentLang]);
    });

    // Translate placeholder attributes
    document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (!key) return;
        const entry = translations[key];
        if (!entry) return;
        (el as HTMLInputElement).placeholder = entry[currentLang];
    });
}

/**
 * Update the language button label to reflect the current language.
 */
function updateLangButton(): void {
    const label = document.getElementById('lang-label');
    if (label) {
        label.textContent = currentLang === 'en' ? 'EN' : '中';
    }
}

/**
 * Initialize i18n — read saved preference and apply.
 */
export function initI18n(): void {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'zh') {
            currentLang = saved;
        }
    } catch (_e) {
        // fallback to default
    }
    applyTranslations();
    updateLangButton();
}
