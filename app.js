/**
 * 注音符號聲辨挑戰賽 - Core Logic
 */

// Global Error Handler for debugging
window.addEventListener('error', function(e) {
  console.error('Captured Global Error:', e);
  const banner = document.getElementById('feedback-banner');
  const text = document.getElementById('feedback-text');
  if (banner && text) {
    banner.className = 'feedback-banner wrong-banner';
    banner.querySelector('.feedback-icon').className = 'feedback-icon fas fa-exclamation-triangle';
    text.innerHTML = `程式錯誤：${e.message} (於 ${e.filename.split('/').pop()}:${e.lineno})`;
    banner.classList.remove('hidden');
  }
});

// ==========================================================================
// 1. 注音符號資料庫 (Bopomofo Database)
// ==========================================================================
const BOPOMOFO_DATA = [
  // --- 聲母 Initials (21) ---
  { symbol: 'ㄅ', pinyin: 'b', name: 'ㄅㄛ (bō)', category: 'initial', example: '包', phrase: '包子的包', hint: '英語中的 "b"（如 boy）' },
  { symbol: 'ㄆ', pinyin: 'p', name: 'ㄆㄛ (pō)', category: 'initial', example: '婆', phrase: '外婆的婆', hint: '英語中的 "p"（送氣，如 pear）' },
  { symbol: 'ㄇ', pinyin: 'm', name: 'ㄇㄛ (mō)', category: 'initial', example: '貓', phrase: '貓咪的貓', hint: '英語中的 "m"（如 cat）' },
  { symbol: 'ㄈ', pinyin: 'f', name: 'ㄈㄛ (fō)', category: 'initial', example: '飛', phrase: '飛機的飛', hint: '英語中的 "f"（如 fly）' },
  { symbol: 'ㄉ', pinyin: 'd', name: 'ㄉㄜ (dē)', category: 'initial', example: '地', phrase: '土地的地', hint: '英語中的 "d"（如 dog）' },
  { symbol: 'ㄊ', pinyin: 't', name: 'ㄊㄜ (tē)', category: 'initial', example: '天', phrase: '天空的天', hint: '英語中的 "t"（送氣，如 toy）' },
  { symbol: 'ㄋ', pinyin: 'n', name: 'ㄋㄜ (nē)', category: 'initial', example: '牛', phrase: '黃牛的牛', hint: '英語中的 "n"（如 no）' },
  { symbol: 'ㄌ', pinyin: 'l', name: 'ㄌㄜ (lē)', category: 'initial', example: '老', phrase: '老師的老', hint: '英語中的 "l"（如 love）' },
  { symbol: 'ㄍ', pinyin: 'g', name: 'ㄍㄜ (gē)', category: 'initial', example: '狗', phrase: '小狗的狗', hint: '英語中的 "g"（不送氣，如 go）' },
  { symbol: 'ㄎ', pinyin: 'k', name: 'ㄎㄜ (kē)', category: 'initial', example: '開', phrase: '開門的開', hint: '英語中的 "k"（送氣，如 key）' },
  { symbol: 'ㄏ', pinyin: 'h', name: 'ㄏㄜ (hē)', category: 'initial', example: '花', phrase: '花朵的花', hint: '英語中的 "h"（如 hat）' },
  { symbol: 'ㄐ', pinyin: 'j', name: 'ㄐㄧ (jī)', category: 'initial', example: '雞', phrase: '小雞的雞', hint: '英語中的 "j"（不送氣，舌面音，如 jeep）' },
  { symbol: 'ㄑ', pinyin: 'q', name: 'ㄑㄧ (qī)', category: 'initial', example: '七', phrase: '數字七的七', hint: '類似英語 "ch"（送氣，舌面音，如 cheap）' },
  { symbol: 'ㄒ', pinyin: 'x', name: 'ㄒㄧ (xī)', category: 'initial', example: '西', phrase: '西瓜的西', hint: '類似英語 "sh"（舌面音，如 she）' },
  { symbol: 'ㄓ', pinyin: 'zh', name: 'ㄓ (zhī)', category: 'initial', example: '豬', phrase: '小豬的豬', hint: '捲舌音 "zh"（不送氣，如 jury）' },
  { symbol: 'ㄔ', pinyin: 'ch', name: 'ㄔ (chī)', category: 'initial', example: '車', phrase: '汽車的車', hint: '捲舌音 "ch"（送氣，如 church）' },
  { symbol: 'ㄕ', pinyin: 'sh', name: 'ㄕ (shī)', category: 'initial', example: '書', phrase: '看書的書', hint: '捲舌音 "sh"（如 shoe）' },
  { symbol: 'ㄖ', pinyin: 'r', name: 'ㄖ (rì)', category: 'initial', example: '日', phrase: '日期的日', hint: '捲舌音 "r"（如 raw）' },
  { symbol: 'ㄗ', pinyin: 'z', name: 'ㄗ (zī)', category: 'initial', example: '字', phrase: '寫字的字', hint: '平舌音 "z"（不送氣，如 kids 中的 ds）' },
  { symbol: 'ㄘ', pinyin: 'c', name: 'ㄘ (cī)', category: 'initial', example: '詞', phrase: '造詞的詞', hint: '平舌音 "ts"（送氣，如 cats 中的 ts）' },
  { symbol: 'ㄙ', pinyin: 's', name: 'ㄙ (sī)', category: 'initial', example: '四', phrase: '數字四的四', hint: '平舌音 "s"（如 say）' },

  // --- 介母 Medials (3) ---
  { symbol: 'ㄧ', pinyin: 'i/y', name: 'ㄧ (yī)', category: 'medial', example: '衣', phrase: '衣服的衣', hint: '漢語拼音 i，英語中的 "ee"（如 meet）' },
  { symbol: 'ㄨ', pinyin: 'u/w', name: 'ㄨ (wū)', category: 'medial', example: '屋', phrase: '房屋的屋', hint: '漢語拼音 u，英語中的 "oo"（如 boot）' },
  { symbol: 'ㄩ', pinyin: 'yu/v', name: 'ㄩ (yū)', category: 'medial', example: '雨', phrase: '下雨的雨', hint: '德語的 "ü" 或法語的 "u"' },

  // --- 韻母 Finals (13) ---
  { symbol: 'ㄚ', pinyin: 'a', name: 'ㄚ (ā)', category: 'final', example: '鴨', phrase: '鴨子的鴨', hint: '英語中的 "a"（如 father）' },
  { symbol: 'ㄛ', pinyin: 'o', name: 'ㄛ (ō)', category: 'final', example: '喔', phrase: '喔喔叫的喔', hint: '英語中的 "aw"（如 law）' },
  { symbol: 'ㄜ', pinyin: 'e', name: 'ㄜ (ē)', category: 'final', example: '鵝', phrase: '白鵝的鵝', hint: '發音介於 "uh" 與 "eh" 之間（如 up）' },
  { symbol: 'ㄝ', pinyin: 'eh', name: 'ㄝ (ê)', category: 'final', example: '椰', phrase: '椰子的椰', hint: '英語中的 "e"（如 yes 中的 ye）' },
  { symbol: 'ㄞ', pinyin: 'ai', name: 'ㄞ (āi)', category: 'final', example: '愛', phrase: '愛心的愛', hint: '英語中的 "eye"（如 fly 中的 y）' },
  { symbol: 'ㄟ', pinyin: 'ei', name: 'ㄟ (ēi)', category: 'final', example: '誒', phrase: '誒唷的誒', hint: '英語中的 "ay"（如 say）' },
  { symbol: 'ㄠ', pinyin: 'ao', name: 'ㄠ (āo)', category: 'final', example: '熬', phrase: '熬夜的熬', hint: '英語中的 "ow"（如 cow）' },
  { symbol: 'ㄡ', pinyin: 'ou', name: 'ㄡ (ōu)', category: 'final', example: '歐', phrase: '歐洲的歐', hint: '英語中的 "o"（如 go）' },
  { symbol: 'ㄢ', pinyin: 'an', name: 'ㄢ (ān)', category: 'final', example: '安', phrase: '安全的安', hint: '前鼻音，英語中的 "an"（如 pan）' },
  { symbol: 'ㄣ', pinyin: 'en', name: 'ㄣ (ēn)', category: 'final', example: '恩', phrase: '恩惠的恩', hint: '前鼻音，英語中的 "un"（如 under）' },
  { symbol: 'ㄤ', pinyin: 'ang', name: 'ㄤ (āng)', category: 'final', example: '昂', phrase: '昂貴的昂', hint: '後鼻音，英語中的 "ong"（如 song）' },
  { symbol: 'ㄥ', pinyin: 'eng', name: 'ㄥ (ēng)', category: 'final', example: '風', phrase: '東風的風（韻母）', hint: '後鼻音，英語中的 "ung"（如 lung）' },
  { symbol: 'ㄦ', pinyin: 'er', name: 'ㄦ (ēr)', category: 'final', example: '兒', phrase: '兒童的兒', hint: '捲舌音，英語中的 "er"（如 her）' },

  // --- 合成音/結合韻 Syllable Synthesis (42) ---
  { symbol: 'ㄧㄚ', pinyin: 'ya', name: 'ㄧㄚ (ya)', category: 'synthesis', example: '鴨', phrase: '鴨子的鴨', hint: '類似英語中的 "ya"（如 yard）', audioText: '壓' },
  { symbol: 'ㄧㄛ', pinyin: 'yo', name: 'ㄧㄛ (yo)', category: 'synthesis', example: '唷', phrase: '哎唷的唷', hint: '類似英語中的 "yo"（如 yo-yo）', audioText: '唷' },
  { symbol: 'ㄧㄝ', pinyin: 'ye', name: 'ㄧㄝ (ye)', category: 'synthesis', example: '椰', phrase: '椰子的椰', hint: '類似英語中的 "ye"（如 yes）', audioText: '椰' },
  { symbol: 'ㄧㄠ', pinyin: 'yao', name: 'ㄧㄠ (yao)', category: 'synthesis', example: '妖', phrase: '妖怪的妖', hint: '類似英語中的 "yow"（如 yowl）', audioText: '腰' },
  { symbol: 'ㄧㄡ', pinyin: 'you', name: 'ㄧㄡ (you)', category: 'synthesis', example: '優', phrase: '優秀的優', hint: '類似英語中的 "yo"（如 yoke）', audioText: '優' },
  { symbol: 'ㄧㄢ', pinyin: 'yan', name: 'ㄧㄢ (yan)', category: 'synthesis', example: '煙', phrase: '抽煙的煙', hint: '類似英語中的 "yen"（如 yen）', audioText: '菸' },
  { symbol: 'ㄧㄣ', pinyin: 'yin', name: 'ㄧㄣ (yin)', category: 'synthesis', example: '音', phrase: '音樂的音', hint: '類似英語中的 "in"（如 bin）', audioText: '因' },
  { symbol: 'ㄧㄤ', pinyin: 'yang', name: 'ㄧㄤ (yang)', category: 'synthesis', example: '羊', phrase: '山羊的羊', hint: '類似英語中的 "young"（如 young）', audioText: '央' },
  { symbol: 'ㄧㄥ', pinyin: 'ying', name: 'ㄧㄥ (ying)', category: 'synthesis', example: '櫻', phrase: '櫻花的櫻', hint: '類似英語中的 "ing"（如 sing）', audioText: '英' },
  { symbol: 'ㄨㄚ', pinyin: 'wa', name: 'ㄨㄚ (wa)', category: 'synthesis', example: '蛙', phrase: '青蛙的蛙', hint: '類似英語中的 "wa"（如 water）', audioText: '蛙' },
  { symbol: 'ㄨㄛ', pinyin: 'wo', name: 'ㄨㄛ (wo)', category: 'synthesis', example: '窩', phrase: '鳥窩的窩', hint: '類似英語中的 "wo"（如 woke）', audioText: '窩' },
  { symbol: 'ㄨㄞ', pinyin: 'wai', name: 'ㄨㄞ (wai)', category: 'synthesis', example: '歪', phrase: '歪斜的歪', hint: '類似英語中的 "why"（如 why）', audioText: '歪' },
  { symbol: 'ㄨㄟ', pinyin: 'wei', name: 'ㄨㄟ (wei)', category: 'synthesis', example: '威', phrase: '威風的威', hint: '類似英語中的 "way"（如 way）', audioText: '微' },
  { symbol: 'ㄨㄢ', pinyin: 'wan', name: 'ㄨㄢ (wan)', category: 'synthesis', example: '彎', phrase: '彎曲的彎', hint: '類似英語中的 "one"（如 one）', audioText: '彎' },
  { symbol: 'ㄨㄣ', pinyin: 'wen', name: 'ㄨㄣ (wen)', category: 'synthesis', example: '溫', phrase: '溫暖的溫', hint: '類似英語中的 "win"（如 win）', audioText: '溫' },
  { symbol: 'ㄨㄤ', pinyin: 'wang', name: 'ㄨㄤ (wang)', category: 'synthesis', example: '汪', phrase: '汪汪叫的汪', hint: '類似英語中的 "wong"（如 wong）', audioText: '汪' },
  { symbol: 'ㄨㄥ', pinyin: 'weng', name: 'ㄨㄥ (weng)', category: 'synthesis', example: '翁', phrase: '不倒翁的翁', hint: '類似英語中的 "wung"（如 lung）', audioText: '翁' },
  { symbol: 'ㄩㄝ', pinyin: 'yue', name: 'ㄩㄝ (yue)', category: 'synthesis', example: '月', phrase: '月亮的月', hint: '發音為 yu-eh', audioText: '約' },
  { symbol: 'ㄩㄢ', pinyin: 'yuan', name: 'ㄩㄢ (yuan)', category: 'synthesis', example: '鴛', phrase: '鴛鴦的鴛', hint: '發音為 yu-an', audioText: '冤' },
  { symbol: 'ㄩㄣ', pinyin: 'yun', name: 'ㄩㄣ (yun)', category: 'synthesis', example: '雲', phrase: '白雲的雲', hint: '發音為 yoon', audioText: '暈' },
  { symbol: 'ㄩㄥ', pinyin: 'yong', name: 'ㄩㄥ (yong)', category: 'synthesis', example: '擁', phrase: '擁抱的擁', hint: '發音為 yung', audioText: '擁' },
  { symbol: 'ㄅㄚ', pinyin: 'ba', name: 'ㄅㄚ (ba)', category: 'synthesis', example: '爸', phrase: '爸爸的爸', hint: '發音為 b-a', audioText: '八' },
  { symbol: 'ㄆㄛ', pinyin: 'po', name: 'ㄆㄛ (po)', category: 'synthesis', example: '婆', phrase: '外婆的婆', hint: '發音為 p-o', audioText: '坡' },
  { symbol: 'ㄇㄧ', pinyin: 'mi', name: 'ㄇㄧ (mi)', category: 'synthesis', example: '咪', phrase: '貓咪的咪', hint: '發音為 m-i', audioText: '咪' },
  { symbol: 'ㄈㄨ', pinyin: 'fu', name: 'ㄈㄨ (fu)', category: 'synthesis', example: '扶', phrase: '攙扶的扶', hint: '發音為 f-u', audioText: '膚' },
  { symbol: 'ㄈㄟ', pinyin: 'fei', name: 'ㄈㄟ (fei)', category: 'synthesis', example: '飛', phrase: '飛機的飛', hint: '發音為 f-ei', audioText: '飛' },
  { symbol: 'ㄉㄚ', pinyin: 'da', name: 'ㄉㄚ (da)', category: 'synthesis', example: '打', phrase: '打球的打', hint: '發音為 d-a', audioText: '搭' },
  { symbol: 'ㄊㄨ', pinyin: 'tu', name: 'ㄊㄨ (tu)', category: 'synthesis', example: '兔', phrase: '兔子的兔', hint: '發音為 t-u', audioText: '禿' },
  { symbol: 'ㄋㄧ', pinyin: 'ni', name: 'ㄋㄧ (ni)', category: 'synthesis', example: '泥', phrase: '水泥的泥', hint: '發音為 n-i', audioText: '妮' },
  { symbol: 'ㄌㄨ', pinyin: 'lu', name: 'ㄌㄨ (lu)', category: 'synthesis', example: '鹿', phrase: '長頸鹿的鹿', hint: '發音為 l-u', audioText: '嚕' },
  { symbol: 'ㄍㄨ', pinyin: 'gu', name: 'ㄍㄨ (gu)', category: 'synthesis', example: '姑', phrase: '姑姑的姑', hint: '發音為 g-u', audioText: '估' },
  { symbol: 'ㄎㄨ', pinyin: 'ku', name: 'ㄎㄨ (ku)', category: 'synthesis', example: '哭', phrase: '哭泣的哭', hint: '發音為 k-u', audioText: '哭' },
  { symbol: 'ㄏㄨ', pinyin: 'hu', name: 'ㄏㄨ (hu)', category: 'synthesis', example: '虎', phrase: '老虎的虎', hint: '發音為 h-u', audioText: '呼' },
  { symbol: 'ㄐㄧ', pinyin: 'ji', name: 'ㄐㄧ (ji)', category: 'synthesis', example: '雞', phrase: '小雞的雞', hint: '發音為 j-i', audioText: '雞' },
  { symbol: 'ㄑㄧ', pinyin: 'qi', name: 'ㄑㄧ (qi)', category: 'synthesis', example: '汽', phrase: '汽車的汽', hint: '發音為 q-i', audioText: '七' },
  { symbol: 'ㄒㄧ', pinyin: 'xi', name: 'ㄒㄧ (xi)', category: 'synthesis', example: '西', phrase: '西瓜的西', hint: '發音為 x-i', audioText: '西' },
  { symbol: 'ㄓㄨ', pinyin: 'zhu', name: 'ㄓㄨ (zhu)', category: 'synthesis', example: '豬', phrase: '小豬的豬', hint: '發音為 zh-u', audioText: '朱' },
  { symbol: 'ㄔㄨ', pinyin: 'chu', name: 'ㄔㄨ (chu)', category: 'synthesis', example: '出', phrase: '出發的出', hint: '發音為 ch-u', audioText: '出' },
  { symbol: 'ㄕㄨ', pinyin: 'shu', name: 'ㄕㄨ (shu)', category: 'synthesis', example: '書', phrase: '看書的書', hint: '發音為 sh-u', audioText: '書' },
  { symbol: 'ㄖㄨ', pinyin: 'ru', name: 'ㄖㄨ (ru)', category: 'synthesis', example: '乳', phrase: '乳牛的乳', hint: '發音為 r-u', audioText: '如' },
  { symbol: 'ㄗㄨ', pinyin: 'zu', name: 'ㄗㄨ (zu)', category: 'synthesis', example: '租', phrase: '出租的租', hint: '發音為 z-u', audioText: '租' },
  { symbol: 'ㄘㄨ', pinyin: 'cu', name: 'ㄘㄨ (cu)', category: 'synthesis', example: '粗', phrase: '粗細的粗', hint: '發音為 c-u', audioText: '粗' },
  { symbol: 'ㄙㄨ', pinyin: 'su', name: 'ㄙㄨ (su)', category: 'synthesis', example: '蘇', phrase: '蘇打的蘇', hint: '發音為 s-u', audioText: '蘇' },

  // --- 聲調挑戰 Tone Challenge (33) ---
  { symbol: 'ㄅㄚ', pinyin: 'bā', name: 'ㄅㄚ (bā)', category: 'tone', baseSyllable: 'ㄅㄚ', example: '八', phrase: '數字八的八 (一聲)', hint: '一聲 (Flat)', audioText: '八' },
  { symbol: 'ㄅㄚˊ', pinyin: 'bá', name: 'ㄅㄚˊ (bá)', category: 'tone', baseSyllable: 'ㄅㄚ', example: '拔', phrase: '拔河的拔 (二聲)', hint: '二聲 (Rising)', audioText: '拔' },
  { symbol: 'ㄅㄚˇ', pinyin: 'bǎ', name: 'ㄅㄚˇ (bǎ)', category: 'tone', baseSyllable: 'ㄅㄚ', example: '靶', phrase: '打靶的靶 (三聲)', hint: '三聲 (Dipping)', audioText: '靶' },
  { symbol: 'ㄅㄚˋ', pinyin: 'bà', name: 'ㄅㄚˋ (bà)', category: 'tone', baseSyllable: 'ㄅㄚ', example: '爸', phrase: '爸爸的爸 (四聲)', hint: '四聲 (Falling)', audioText: '爸' },
  { symbol: '˙ㄅㄚ', pinyin: 'ba', name: '˙ㄅㄚ (ba)', category: 'tone', baseSyllable: 'ㄅㄚ', example: '吧', phrase: '走吧的吧 (輕聲)', hint: '輕聲 (Neutral)', audioText: '吧' },

  { symbol: 'ㄆㄛ', pinyin: 'pō', name: 'ㄆㄛ (pō)', category: 'tone', baseSyllable: 'ㄆㄛ', example: '坡', phrase: '山坡的坡 (一聲)', hint: '一聲 (Flat)', audioText: '坡' },
  { symbol: 'ㄆㄛˊ', pinyin: 'pó', name: 'ㄆㄛˊ (pó)', category: 'tone', baseSyllable: 'ㄆㄛ', example: '婆', phrase: '老婆的婆 (二聲)', hint: '二聲 (Rising)', audioText: '婆' },
  { symbol: 'ㄆㄛˇ', pinyin: 'pǒ', name: 'ㄆㄛˇ (pǒ)', category: 'tone', baseSyllable: 'ㄆㄛ', example: '頗', phrase: '偏頗的頗 (三聲)', hint: '三聲 (Dipping)', audioText: '頗' },
  { symbol: 'ㄆㄛˋ', pinyin: 'pò', name: 'ㄆㄛˋ (pò)', category: 'tone', baseSyllable: 'ㄆㄛ', example: '破', phrase: '破爛的破 (四聲)', hint: '四聲 (Falling)', audioText: '破' },

  { symbol: 'ㄇㄧ', pinyin: 'mī', name: 'ㄇㄧ (mī)', category: 'tone', baseSyllable: 'ㄇㄧ', example: '咪', phrase: '貓咪的咪 (一聲)', hint: '一聲 (Flat)', audioText: '咪' },
  { symbol: 'ㄇㄧˊ', pinyin: 'mí', name: 'ㄇㄧˊ (mí)', category: 'tone', baseSyllable: 'ㄇㄧ', example: '迷', phrase: '迷路的迷 (二聲)', hint: '二聲 (Rising)', audioText: '迷' },
  { symbol: 'ㄇㄧˇ', pinyin: 'mǐ', name: 'ㄇㄧˇ (mǐ)', category: 'tone', baseSyllable: 'ㄇㄧ', example: '米', phrase: '白米的米 (三聲)', hint: '三聲 (Dipping)', audioText: '米' },
  { symbol: 'ㄇㄧˋ', pinyin: 'mì', name: 'ㄇㄧˋ (mì)', category: 'tone', baseSyllable: 'ㄇㄧ', example: '密', phrase: '秘密的密 (四聲)', hint: '四聲 (Falling)', audioText: '密' },

  { symbol: 'ㄈㄨ', pinyin: 'fū', name: 'ㄈㄨ (fū)', category: 'tone', baseSyllable: 'ㄈㄨ', example: '膚', phrase: '皮膚的膚 (一聲)', hint: '一聲 (Flat)', audioText: '膚' },
  { symbol: 'ㄈㄨˊ', pinyin: 'fú', name: 'ㄈㄨˊ (fú)', category: 'tone', baseSyllable: 'ㄈㄨ', example: '福', phrase: '福氣的福 (二聲)', hint: '二聲 (Rising)', audioText: '福' },
  { symbol: 'ㄈㄨˇ', pinyin: 'fǔ', name: 'ㄈㄨˇ (fǔ)', category: 'tone', baseSyllable: 'ㄈㄨ', example: '府', phrase: '政府的府 (三聲)', hint: '三聲 (Dipping)', audioText: '府' },
  { symbol: 'ㄈㄨˋ', pinyin: 'fù', name: 'ㄈㄨˋ (fù)', category: 'tone', baseSyllable: 'ㄈㄨ', example: '富', phrase: '富有的富 (四聲)', hint: '四聲 (Falling)', audioText: '富' },

  { symbol: 'ㄈㄟ', pinyin: 'fēi', name: 'ㄈㄟ (fēi)', category: 'tone', baseSyllable: 'ㄈㄟ', example: '飛', phrase: '飛機的飛 (一聲)', hint: '一聲 (Flat)', audioText: '飛' },
  { symbol: 'ㄈㄟˊ', pinyin: 'féi', name: 'ㄈㄟˊ (féi)', category: 'tone', baseSyllable: 'ㄈㄟ', example: '肥', phrase: '肥胖的肥 (二聲)', hint: '二聲 (Rising)', audioText: '肥' },
  { symbol: 'ㄈㄟˇ', pinyin: 'fěi', name: 'ㄈㄟˇ (fěi)', category: 'tone', baseSyllable: 'ㄈㄟ', example: '匪', phrase: '土匪的匪 (三聲)', hint: '三聲 (Dipping)', audioText: '匪' },
  { symbol: 'ㄈㄟˋ', pinyin: 'fèi', name: 'ㄈㄟˋ (fèi)', category: 'tone', baseSyllable: 'ㄈㄟ', example: '費', phrase: '免費的費 (四聲)', hint: '四聲 (Falling)', audioText: '費' },

  { symbol: 'ㄉㄚ', pinyin: 'dā', name: 'ㄉㄚ (dā)', category: 'tone', baseSyllable: 'ㄉㄚ', example: '搭', phrase: '搭車的搭 (一聲)', hint: '一聲 (Flat)', audioText: '搭' },
  { symbol: 'ㄉㄚˊ', pinyin: 'dá', name: 'ㄉㄚˊ (dá)', category: 'tone', baseSyllable: 'ㄉㄚ', example: '答', phrase: '回答的答 (二聲)', hint: '二聲 (Rising)', audioText: '答' },
  { symbol: 'ㄉㄚˇ', pinyin: 'dǎ', name: 'ㄉㄚˇ (dǎ)', category: 'tone', baseSyllable: 'ㄉㄚ', example: '打', phrase: '打球的打 (三聲)', hint: '三聲 (Dipping)', audioText: '打' },
  { symbol: 'ㄉㄚˋ', pinyin: 'dà', name: 'ㄉㄚˋ (dà)', category: 'tone', baseSyllable: 'ㄉㄚ', example: '大', phrase: '大小的大 (四聲)', hint: '四聲 (Falling)', audioText: '大' },

  { symbol: 'ㄌㄨ', pinyin: 'lū', name: 'ㄌㄨ (lū)', category: 'tone', baseSyllable: 'ㄌㄨ', example: '嚕', phrase: '呼嚕的嚕 (一聲)', hint: '一聲 (Flat)', audioText: '嚕' },
  { symbol: 'ㄌㄨˊ', pinyin: 'lú', name: 'ㄌㄨˊ (lú)', category: 'tone', baseSyllable: 'ㄌㄨ', example: '爐', phrase: '火爐的爐 (二聲)', hint: '二聲 (Rising)', audioText: '爐' },
  { symbol: 'ㄌㄨˇ', pinyin: 'lǔ', name: 'ㄌㄨˇ (lǔ)', category: 'tone', baseSyllable: 'ㄌㄨ', example: '魯', phrase: '魯肉的魯 (三聲)', hint: '三聲 (Dipping)', audioText: '魯' },
  { symbol: 'ㄌㄨˋ', pinyin: 'lù', name: 'ㄌㄨˋ (lù)', category: 'tone', baseSyllable: 'ㄌㄨ', example: '路', phrase: '道路的路 (四聲)', hint: '四聲 (Falling)', audioText: '路' },

  { symbol: 'ㄒㄧ', pinyin: 'xī', name: 'ㄒㄧ (xī)', category: 'tone', baseSyllable: 'ㄒㄧ', example: '西', phrase: '東西的西 (一聲)', hint: '一聲 (Flat)', audioText: '西' },
  { symbol: 'ㄒㄧˊ', pinyin: 'xí', name: 'ㄒㄧˊ (xí)', category: 'tone', baseSyllable: 'ㄒㄧ', example: '席', phrase: '主席的席 (二聲)', hint: '二聲 (Rising)', audioText: '席' },
  { symbol: 'ㄒㄧˇ', pinyin: 'xǐ', name: 'ㄒㄧˇ (xǐ)', category: 'tone', baseSyllable: 'ㄒㄧ', example: '洗', phrase: '洗衣服的洗 (三聲)', hint: '三聲 (Dipping)', audioText: '洗' },
  { symbol: 'ㄒㄧˋ', pinyin: 'xì', name: 'ㄒㄧˋ (xì)', category: 'tone', baseSyllable: 'ㄒㄧ', example: '細', phrase: '粗細的細 (四聲)', hint: '四聲 (Falling)', audioText: '細' }
];

// ==========================================================================
// 2. 應用程式狀態 (App State)
// ==========================================================================
const state = {
  score: {
    correct: 0,
    total: 0
  },
  streak: 0,
  longestStreak: 0,
  currentQuestion: {
    correctBopo: null, // Bopomofo object
    options: [],      // Array of 6 Bopomofo objects
    hasAnswered: false,
    attempts: 0
  },
  history: [],
  settings: {
    scope: 'tone',          // 'all', 'initial', 'medial', 'final', 'synthesis', 'tone'
    challengeMode: 'classic', // 'classic', 'streak'
    voice: 'default',
    speed: 1.0,
    showPinyin: true,
    wordHint: false,
    autoNext: false
  },
  voices: []
};

// ==========================================================================
// 3. 初始化 DOM 元素
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Load settings from localStorage
  loadSettings();

  // Populate UI settings inputs to match state
  syncSettingsUI();

  // Initialize Speech Synthesis
  initSpeech();

  // Draw Bopomofo Chart in Modal
  buildBopomofoChart();

  // Event Listeners setup
  setupEventListeners();

  // Start the first game question
  loadNewQuestion();
}

// ==========================================================================
// 4. 語音功能設定 (Speech Synthesis Engine)
// ==========================================================================
function initSpeech() {
  if (typeof speechSynthesis === 'undefined') {
    showSystemNotification('error', '您的瀏覽器不支援 Speech Synthesis 語音合成功能！');
    return;
  }

  // Bind voice listing
  populateVoiceList();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
  }
}

function populateVoiceList() {
  if (typeof speechSynthesis === 'undefined') return;
  state.voices = speechSynthesis.getVoices();
  const voiceSelect = document.getElementById('voice-select');
  if (!voiceSelect) return;

  // Clear existing
  voiceSelect.innerHTML = '<option value="default">系統預設語音 (繁體中文)</option>';

  // Filter for Chinese voices
  const zhVoices = state.voices.filter(v => 
    v.lang.toLowerCase().includes('zh') || 
    v.lang.toLowerCase().includes('cmn') ||
    v.lang.toLowerCase().includes('yue')
  );

  zhVoices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.name;
    
    let label = `${voice.name} (${voice.lang})`;
    if (voice.lang.toLowerCase().includes('tw') || voice.name.includes('國語') || voice.name.toLowerCase().includes('taiwan')) {
      label += ' [推薦 - 台灣繁體]';
    }
    option.textContent = label;
    
    // Set selected if it matches current settings
    if (state.settings.voice === voice.name) {
      option.selected = true;
    }
    
    voiceSelect.appendChild(option);
  });
}

/**
 * Pronounces a Bopomofo character
 * @param {Object} bopoObj The Bopomofo database object
 * @param {boolean} includeExample Force example phrase pronunciation
 * @param {function} onEndCallback Callback when speech finishes
 */
function speak(bopoObj, includeExample = false, onEndCallback = null) {
  if (typeof speechSynthesis === 'undefined') return;
  if (!bopoObj || !bopoObj.symbol) return;

  try {
    // Cancel any active speech
    speechSynthesis.cancel();

    const playBtn = document.getElementById('play-sound-btn');
    if (playBtn && !includeExample) {
      playBtn.classList.add('playing');
    }

    // Construct text to speak
    let textToSpeak = bopoObj.audioText || bopoObj.symbol;
    
    // Custom tweaks for clearer raw consonant pronunciation in Taiwan voices if needed
    // e.g. Some voices read ㄅ as "b" (very short), so we read it as "ㄅ" or use the phrase helper.
    if (includeExample || state.settings.wordHint) {
      textToSpeak = `${bopoObj.audioText || bopoObj.symbol}，${bopoObj.phrase}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'zh-TW';
    
    // Set voice
    if (state.settings.voice && state.settings.voice !== 'default') {
      const selectedVoice = state.voices.find(v => v.name === state.settings.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // Try to find a TW voice as default
      const twVoice = state.voices.find(v => 
        v.lang.toLowerCase().includes('zh-tw') || 
        v.name.toLowerCase().includes('taiwan') ||
        v.name.includes('國語')
      );
      if (twVoice) utterance.voice = twVoice;
    }

    utterance.rate = state.settings.speed;

    utterance.onend = () => {
      if (playBtn) playBtn.classList.remove('playing');
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      if (playBtn) playBtn.classList.remove('playing');
      if (onEndCallback) onEndCallback();
    };

    speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis call crashed:', err);
    const playBtn = document.getElementById('play-sound-btn');
    if (playBtn) playBtn.classList.remove('playing');
    if (onEndCallback) onEndCallback();
  }
}

// ==========================================================================
// 5. 遊戲邏輯與題庫控制 (Game Logic)
// ==========================================================================

function loadNewQuestion() {
  const nextBtn = document.getElementById('next-btn');
  const feedback = document.getElementById('feedback-banner');
  
  // Reset question state
  state.currentQuestion.hasAnswered = false;
  state.currentQuestion.attempts = 0;
  
  if (nextBtn) {
    nextBtn.classList.add('disabled');
    nextBtn.disabled = true;
  }
  if (feedback) {
    feedback.className = 'feedback-banner hidden';
  }

  // 1. Filter dataset based on selected scope
  let pool = BOPOMOFO_DATA.filter(item => {
    if (state.settings.scope === 'all') return true;
    return item.category === state.settings.scope;
  });

  // Fallback in case pool is empty
  if (pool.length === 0) {
    pool = BOPOMOFO_DATA;
  }

  // Pick target answer
  const correctIndex = Math.floor(Math.random() * pool.length);
  const correctBopo = pool[correctIndex];
  state.currentQuestion.correctBopo = correctBopo;

  // Update game mode badge text
  const badgeMap = { all: '綜合挑戰', initial: '聲母挑戰', medial: '介母挑戰', final: '韻母挑戰', synthesis: '合成音挑戰', tone: '聲調聲辨挑戰' };
  document.getElementById('game-mode-badge').textContent = badgeMap[state.settings.scope] || '綜合挑戰';

  // 2. Generate 5 wrong choices
  let otherChoices = [];
  
  // If in tone challenge mode, prioritize other tones of the same baseSyllable
  if (state.settings.scope === 'tone' && correctBopo.baseSyllable) {
    otherChoices = pool.filter(item => 
      item.baseSyllable === correctBopo.baseSyllable && 
      item.symbol !== correctBopo.symbol
    );
  } else {
    otherChoices = pool.filter(item => item.symbol !== correctBopo.symbol);
  }

  // If we need more items to reach 5 wrong choices, draw randomly from the rest of the pool
  if (otherChoices.length < 5) {
    const remainingPool = pool.filter(item => 
      item.symbol !== correctBopo.symbol && 
      !otherChoices.some(o => o.symbol === item.symbol)
    );
    shuffleArray(remainingPool);
    otherChoices = [...otherChoices, ...remainingPool].slice(0, 5);
  } else {
    shuffleArray(otherChoices);
    otherChoices = otherChoices.slice(0, 5);
  }

  // Combine and shuffle to make 6 final choices
  const finalChoices = [correctBopo, ...otherChoices];
  shuffleArray(finalChoices);
  state.currentQuestion.options = finalChoices;

  // Render options to DOM
  renderOptions();

  // Play question audio automatically (with slight delay for browser policy)
  setTimeout(() => {
    speak(correctBopo);
  }, 300);
}

function renderOptions() {
  const container = document.getElementById('options-container');
  if (!container) return;

  container.innerHTML = '';
  
  state.currentQuestion.options.forEach((bopo, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.symbol = bopo.symbol;
    btn.id = `opt-${idx}`;
    
    // Number shortcut label
    const numSpan = document.createElement('span');
    numSpan.className = 'option-number';
    numSpan.textContent = idx + 1;
    btn.appendChild(numSpan);

    // Bopomofo Symbol
    const symSpan = document.createElement('span');
    symSpan.className = 'option-symbol';
    symSpan.textContent = bopo.symbol;
    btn.appendChild(symSpan);

    // Pinyin (if enabled)
    const pinSpan = document.createElement('span');
    pinSpan.className = 'option-pinyin';
    pinSpan.textContent = bopo.pinyin;
    if (!state.settings.showPinyin) {
      pinSpan.style.display = 'none';
    }
    btn.appendChild(pinSpan);

    // Click handler
    btn.addEventListener('click', () => handleAnswer(bopo.symbol, btn));

    container.appendChild(btn);
  });
}

function handleAnswer(selectedSymbol, clickedBtnElement) {
  if (state.currentQuestion.hasAnswered) return;

  const correctSymbol = state.currentQuestion.correctBopo.symbol;
  const isCorrect = (selectedSymbol === correctSymbol);
  
  state.currentQuestion.attempts++;
  
  // Freeze state on first attempt
  state.currentQuestion.hasAnswered = true;

  // Disable all choice buttons
  const allOptionBtns = document.querySelectorAll('.option-btn');
  allOptionBtns.forEach(btn => {
    btn.disabled = true;
  });

  const feedbackBanner = document.getElementById('feedback-banner');
  const feedbackText = document.getElementById('feedback-text');
  
  // Play short feedback sound or confirm speech synthesis doesn't conflict
  // We can speak the full Example description to reinforce learning on correct answer,
  // or simple visual celebration.

  if (isCorrect) {
    // Correct Answer Logic
    state.score.correct++;
    state.score.total++;
    state.streak++;
    if (state.streak > state.longestStreak) {
      state.longestStreak = state.streak;
    }

    clickedBtnElement.classList.add('correct-choice');
    
    // Setup feedback banner
    feedbackBanner.className = 'feedback-banner correct-banner';
    feedbackBanner.querySelector('.feedback-icon').className = 'feedback-icon fas fa-check-circle';
    feedbackText.innerHTML = `答對了！這是「${correctSymbol}」（${state.currentQuestion.correctBopo.phrase}）`;
    
    // Confetti particles!
    startConfetti();

    // Word hint synthesis feedback to reinforce
    speak(state.currentQuestion.correctBopo, true);

    // Auto next setup
    if (state.settings.autoNext) {
      setTimeout(() => {
        loadNewQuestion();
      }, 1500);
    }
  } else {
    // Wrong Answer Logic
    state.score.total++;
    
    if (state.settings.challengeMode === 'streak') {
      state.streak = 0; // Reset streak in strict mode
    } else {
      // In classic mode, streak is preserved or reset? Let's reset streak on any wrong answer
      state.streak = 0;
    }

    clickedBtnElement.classList.add('wrong-choice');
    
    // Find and highlight correct answer in green so the user learns
    allOptionBtns.forEach(btn => {
      if (btn.dataset.symbol === correctSymbol) {
        btn.classList.add('correct-choice');
      }
    });

    feedbackBanner.className = 'feedback-banner wrong-banner';
    feedbackBanner.querySelector('.feedback-icon').className = 'feedback-icon fas fa-times-circle';
    feedbackText.innerHTML = `答錯囉！正確答案是「${correctSymbol}」（${state.currentQuestion.correctBopo.phrase}）`;
  }

  // Update Stats Bar
  updateStatsUI();

  // Add to session history log
  addHistoryItem(state.currentQuestion.correctBopo, selectedSymbol, isCorrect);

  // Enable Next button
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.classList.remove('disabled');
    nextBtn.disabled = false;
  }
}

// ==========================================================================
// 6. UI 更新與輔助元件 (UI Rendering helpers)
// ==========================================================================

function updateStatsUI() {
  document.getElementById('stat-correct').textContent = state.score.correct;
  document.getElementById('stat-streak').textContent = `${state.streak} `;
  
  // Append fire icon to streak
  const fireIcon = document.createElement('i');
  fireIcon.className = 'fas fa-fire';
  document.getElementById('stat-streak').appendChild(fireIcon);

  // Accuracy
  const pct = state.score.total > 0 ? Math.round((state.score.correct / state.score.total) * 100) : 0;
  document.getElementById('stat-accuracy').textContent = `${pct}%`;
}

function addHistoryItem(correctBopo, userSymbol, isCorrect) {
  const historyList = document.getElementById('history-list');
  if (!historyList) return;

  // Remove "empty" list item if present
  const emptyItem = historyList.querySelector('.history-empty');
  if (emptyItem) {
    historyList.removeChild(emptyItem);
  }

  // Push to history state
  state.history.unshift({
    correctBopo,
    userSymbol,
    isCorrect,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  });

  // Keep history array within limit (e.g. 50 items)
  if (state.history.length > 50) {
    state.history.pop();
  }

  // Create DOM element
  const item = document.createElement('li');
  item.className = 'history-item';
  
  const details = document.createElement('div');
  details.className = 'history-item-details';

  const badge = document.createElement('span');
  badge.className = `history-badge ${isCorrect ? 'correct' : 'wrong'}`;
  badge.innerHTML = isCorrect ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
  details.appendChild(badge);

  const textSpan = document.createElement('span');
  textSpan.className = 'history-item-symbols';
  if (isCorrect) {
    textSpan.innerHTML = `題目：<strong>${correctBopo.symbol}</strong>`;
  } else {
    textSpan.innerHTML = `題目：<strong>${correctBopo.symbol}</strong> (您選 <strong>${userSymbol}</strong>)`;
  }
  details.appendChild(textSpan);
  item.appendChild(details);

  // Replay Sound Button
  const replayBtn = document.createElement('button');
  replayBtn.className = 'history-item-btn';
  replayBtn.title = '重聽發音';
  replayBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
  replayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    speak(correctBopo);
  });
  item.appendChild(replayBtn);

  // Insert at the top
  historyList.insertBefore(item, historyList.firstChild);
}

function clearHistory() {
  state.history = [];
  const historyList = document.getElementById('history-list');
  if (historyList) {
    historyList.innerHTML = '<li class="history-empty">尚無答題紀錄，開始遊玩吧！</li>';
  }
}

// Bopomofo Study Grid construction
function buildBopomofoChart() {
  const initialsContainer = document.getElementById('chart-initials');
  const medialsContainer = document.getElementById('chart-medials');
  const finalsContainer = document.getElementById('chart-finals');
  const synthesisContainer = document.getElementById('chart-synthesis');
  const toneContainer = document.getElementById('chart-tone');

  if (!initialsContainer || !medialsContainer || !finalsContainer) return;

  initialsContainer.innerHTML = '';
  medialsContainer.innerHTML = '';
  finalsContainer.innerHTML = '';
  if (synthesisContainer) synthesisContainer.innerHTML = '';
  if (toneContainer) toneContainer.innerHTML = '';

  BOPOMOFO_DATA.forEach(bopo => {
    const item = document.createElement('div');
    item.className = `chart-item chart-${bopo.category}`;
    item.title = `發音提示: ${bopo.hint}`;
    
    // Play sound micro-icon
    const playIcon = document.createElement('i');
    playIcon.className = 'fas fa-volume-up chart-item-play-icon';
    item.appendChild(playIcon);

    const sym = document.createElement('span');
    sym.className = 'chart-item-symbol';
    sym.textContent = bopo.symbol;
    item.appendChild(sym);

    const pin = document.createElement('span');
    pin.className = 'chart-item-pinyin';
    pin.textContent = bopo.pinyin;
    item.appendChild(pin);

    const ex = document.createElement('span');
    ex.className = 'chart-item-example';
    ex.textContent = `${bopo.example}(${bopo.pinyin})`;
    item.appendChild(ex);

    // Click handler to play pronunciation
    item.addEventListener('click', () => {
      // Toggle custom active scale animation
      item.style.transform = 'scale(0.92)';
      setTimeout(() => {
        item.style.transform = '';
      }, 100);
      
      speak(bopo, true); // Play with word helper always in chart
    });

    // Append to correct category grid
    if (bopo.category === 'initial') {
      initialsContainer.appendChild(item);
    } else if (bopo.category === 'medial') {
      medialsContainer.appendChild(item);
    } else if (bopo.category === 'final') {
      finalsContainer.appendChild(item);
    } else if (bopo.category === 'synthesis') {
      if (synthesisContainer) synthesisContainer.appendChild(item);
    } else if (bopo.category === 'tone') {
      if (toneContainer) toneContainer.appendChild(item);
    }
  });
}

// Show hint to user
function showHint() {
  if (state.currentQuestion.hasAnswered) return;
  
  const bopo = state.currentQuestion.correctBopo;
  showSystemNotification('info', `提示：這個注音發音如同【${bopo.phrase}】，對應拼音為「${bopo.pinyin}」！`);
}

// System banner helper (non-obtrusive toast notification)
function showSystemNotification(type, message) {
  // We can reuse the feedback banner for general alerts if needed,
  // or create a simple visual notification.
  // Let's print it to console and alert nicely.
  const banner = document.getElementById('feedback-banner');
  const text = document.getElementById('feedback-text');
  if (banner && text) {
    banner.className = `feedback-banner wrong-banner`; // Red/warning-styled banner
    if (type === 'info') {
      banner.className = `feedback-banner correct-banner`; // Blue/green styled
      banner.querySelector('.feedback-icon').className = 'feedback-icon fas fa-lightbulb';
    } else if (type === 'error') {
      banner.querySelector('.feedback-icon').className = 'feedback-icon fas fa-exclamation-triangle';
    }
    text.textContent = message;
    
    // Remove hidden
    banner.classList.remove('hidden');
    
    // Re-hide after 4 seconds
    setTimeout(() => {
      banner.classList.add('hidden');
    }, 4000);
  }
}

// ==========================================================================
// 7. 事件監聽器設定 (Event Listeners)
// ==========================================================================
function setupEventListeners() {
  // Header Actions
  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
  document.getElementById('help-btn').addEventListener('click', () => openModal('help-modal'));
  document.getElementById('settings-btn').addEventListener('click', () => openModal('settings-modal'));
  document.getElementById('quick-chart-btn').addEventListener('click', () => openModal('help-modal'));

  // Modals Close
  const closeBtns = document.querySelectorAll('.close-modal-btn');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = btn.getAttribute('data-modal');
      closeModal(modalId);
    });
  });

  // Close modals when clicking overlay
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Sound play buttons
  document.getElementById('play-sound-btn').addEventListener('click', () => {
    if (state.currentQuestion.correctBopo) {
      speak(state.currentQuestion.correctBopo);
    }
  });

  document.getElementById('hint-btn').addEventListener('click', showHint);
  document.getElementById('next-btn').addEventListener('click', loadNewQuestion);
  document.getElementById('clear-history-btn').addEventListener('click', clearHistory);

  // Settings form handlers
  const settingsForm = document.getElementById('settings-form');
  
  // Scope settings radio buttons
  const scopeRadios = settingsForm.querySelectorAll('input[name="scope"]');
  scopeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.settings.scope = e.target.value;
      saveSettings();
      loadNewQuestion();
    });
  });

  // Challenge mode radios
  const modeRadios = settingsForm.querySelectorAll('input[name="challenge-mode"]');
  modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.settings.challengeMode = e.target.value;
      saveSettings();
    });
  });

  // Voice selector
  document.getElementById('voice-select').addEventListener('change', (e) => {
    state.settings.voice = e.target.value;
    saveSettings();
  });

  // Speed range slider
  const speedRange = document.getElementById('speed-range');
  const speedVal = document.getElementById('speed-val');
  speedRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value).toFixed(1);
    speedVal.textContent = val;
    state.settings.speed = parseFloat(val);
    saveSettings();
  });

  // Checkboxes settings
  document.getElementById('setting-show-pinyin').addEventListener('change', (e) => {
    state.settings.showPinyin = e.target.checked;
    saveSettings();
    renderOptions(); // Re-render options to update display
  });

  document.getElementById('setting-word-hint').addEventListener('change', (e) => {
    state.settings.wordHint = e.target.checked;
    saveSettings();
  });

  document.getElementById('setting-auto-next').addEventListener('change', (e) => {
    state.settings.autoNext = e.target.checked;
    saveSettings();
  });

  // Keyboard Navigation / Shortcuts (1-6 to choose, Enter/Space for next, R to replay)
  document.addEventListener('keydown', (e) => {
    // Ignore keyboard shortcuts if modal is open
    const openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
    if (openModals.length > 0) return;

    const key = e.key;
    
    // Choose options (1-6)
    if (key >= '1' && key <= '6') {
      const idx = parseInt(key) - 1;
      const optBtn = document.getElementById(`opt-${idx}`);
      if (optBtn && !optBtn.disabled) {
        const selectedSymbol = optBtn.dataset.symbol;
        handleAnswer(selectedSymbol, optBtn);
      }
    }
    
    // Next question (Space or Enter when Next button is active)
    if (key === 'Enter' || key === ' ') {
      const nextBtn = document.getElementById('next-btn');
      if (nextBtn && !nextBtn.disabled) {
        e.preventDefault();
        loadNewQuestion();
      }
    }

    // Replay question audio (R)
    if (key.toLowerCase() === 'r') {
      if (state.currentQuestion.correctBopo) {
        speak(state.currentQuestion.correctBopo);
      }
    }

    // Help sheet trigger (H)
    if (key.toLowerCase() === 'h') {
      showHint();
    }
  });
}

// Modal open/close helpers
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Theme handling
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('theme-toggle-btn');
  
  if (body.classList.contains('light-mode')) {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    btn.innerHTML = '<i class="fas fa-sun"></i>';
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    btn.innerHTML = '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', 'light');
  }
}

// ==========================================================================
// 8. 設定快取管理 (Settings Persistence)
// ==========================================================================
function saveSettings() {
  localStorage.setItem('bopomofo_settings', JSON.stringify(state.settings));
}

function loadSettings() {
  // Load Theme
  const savedTheme = localStorage.getItem('theme');
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (savedTheme === 'dark') {
    document.body.className = 'dark-mode';
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    document.body.className = 'light-mode';
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }

  // Load Settings options
  const savedSettings = localStorage.getItem('bopomofo_settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      state.settings = { ...state.settings, ...parsed };
    } catch (e) {
      console.error('Error parsing saved settings:', e);
    }
  }
}

function syncSettingsUI() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  // Set Scope Radios
  const scopeRadio = form.querySelector(`input[name="scope"][value="${state.settings.scope}"]`);
  if (scopeRadio) scopeRadio.checked = true;

  // Set Challenge Mode Radios
  const modeRadio = form.querySelector(`input[name="challenge-mode"][value="${state.settings.challengeMode}"]`);
  if (modeRadio) modeRadio.checked = true;

  // Set Speed Slider
  const speedRange = document.getElementById('speed-range');
  const speedVal = document.getElementById('speed-val');
  if (speedRange) speedRange.value = state.settings.speed;
  if (speedVal) speedVal.textContent = state.settings.speed.toFixed(1);

  // Set Checkboxes
  document.getElementById('setting-show-pinyin').checked = state.settings.showPinyin;
  document.getElementById('setting-word-hint').checked = state.settings.wordHint;
  document.getElementById('setting-auto-next').checked = state.settings.autoNext;
}

// ==========================================================================
// 9. 輕量化粒子慶祝特效 (Confetti Particle System)
// ==========================================================================
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let animationFrameId = null;

if (canvas) {
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
}

function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

class ConfettiParticle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * -canvas.height;
    this.r = Math.random() * 8 + 4;
    this.d = Math.random() * canvas.height;
    this.color = `hsl(${Math.random() * 360}, 90%, 60%)`;
    this.tilt = Math.random() * 10 - 5;
    this.tiltAngleChan = Math.random() * 0.05 + 0.02;
    this.tiltAngle = 0;
    this.speed = Math.random() * 3 + 2;
  }
  
  update() {
    this.tiltAngle += this.tiltAngleChan;
    this.y += this.speed;
    this.x += Math.sin(this.tiltAngle) * 0.5;
    this.tilt = Math.sin(this.tiltAngle) * 10;
    return this.y <= canvas.height;
  }
  
  draw() {
    ctx.beginPath();
    ctx.lineWidth = this.r / 2;
    ctx.strokeStyle = this.color;
    ctx.moveTo(this.x + this.tilt + this.r / 2, this.y);
    ctx.lineTo(this.x + this.tilt, this.y + this.tilt + this.r / 2);
    ctx.stroke();
  }
}

function startConfetti() {
  if (!canvas || !ctx) return;
  cancelAnimationFrame(animationFrameId);
  particles = [];
  for (let i = 0; i < 120; i++) {
    particles.push(new ConfettiParticle());
  }
  animateConfetti();
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let active = false;
  particles.forEach(p => {
    if (p.update()) {
      p.draw();
      active = true;
    }
  });
  if (active) {
    animationFrameId = requestAnimationFrame(animateConfetti);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// ==========================================================================
// Utilities
// ==========================================================================
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
