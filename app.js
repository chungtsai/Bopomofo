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
    scope: 'tone',          // 'all', 'initial', 'medial', 'final', 'synthesis', 'tone', 'vocabulary'
    challengeMode: 'classic', // 'classic', 'streak'
    questionType: 'choices', // 'choices', 'input'
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
      if (bopoObj.category === 'vocabulary') {
        textToSpeak = bopoObj.audioText;
      } else {
        textToSpeak = `${bopoObj.audioText || bopoObj.symbol}，${bopoObj.phrase}`;
      }
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
    if (state.settings.scope === 'all') {
      return item.category === 'initial' || item.category === 'medial' || item.category === 'final';
    }
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
  const badgeMap = { all: '綜合挑戰', initial: '聲母挑戰', medial: '介母挑戰', final: '韻母挑戰', synthesis: '合成音挑戰', tone: '聲調聲辨挑戰', vocabulary: '完整單字挑戰' };
  document.getElementById('game-mode-badge').textContent = badgeMap[state.settings.scope] || '綜合挑戰';

  // Toggle Display based on Question Type
  const optContainer = document.getElementById('options-container');
  const inputContainer = document.getElementById('input-container');
  const instructionTitle = document.querySelector('.game-instruction h2');
  const keyboardTip = document.querySelector('.keyboard-tip');

  if (state.settings.questionType === 'choices') {
    if (optContainer) optContainer.classList.remove('hidden');
    if (inputContainer) inputContainer.classList.add('hidden');
    if (instructionTitle) instructionTitle.textContent = '聽聽看，這是哪一個注音符號？';
    if (keyboardTip) keyboardTip.innerHTML = '提示：您可以使用鍵盤快捷鍵 <kbd>1</kbd> 到 <kbd>6</kbd> 來回答';

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
  } else {
    if (optContainer) optContainer.classList.add('hidden');
    if (inputContainer) inputContainer.classList.remove('hidden');
    if (instructionTitle) instructionTitle.textContent = '聽聽看，請拼寫出正確的注音符號';
    if (keyboardTip) keyboardTip.innerHTML = '提示：您可以使用實體鍵盤直接打字，或使用下方鍵盤輸入，Enter 鍵送出';

    // Clear input field
    const inputField = document.getElementById('bopo-input-field');
    if (inputField) {
      inputField.value = '';
    }

    // Reset submit button state
    const submitBtn = document.getElementById('bopo-submit-btn');
    if (submitBtn) {
      submitBtn.className = 'primary-btn submit-answer-btn';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '送出答案';
    }
  }

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
    if (bopo.category === 'vocabulary') {
      symSpan.classList.add('vocabulary-symbol');
    } else if (bopo.symbol && bopo.symbol.length > 1) {
      symSpan.classList.add('long-symbol');
    }
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
  const vocabularyContainer = document.getElementById('chart-vocabulary');

  if (!initialsContainer || !medialsContainer || !finalsContainer) return;

  initialsContainer.innerHTML = '';
  medialsContainer.innerHTML = '';
  finalsContainer.innerHTML = '';
  if (synthesisContainer) synthesisContainer.innerHTML = '';
  if (toneContainer) toneContainer.innerHTML = '';
  if (vocabularyContainer) vocabularyContainer.innerHTML = '';

  const seenInitials = new Set();
  const seenMedials = new Set();
  const seenFinals = new Set();

  BOPOMOFO_DATA.forEach(bopo => {
    // Skip duplicate basic alphabet symbols on the reference chart
    if (bopo.category === 'initial') {
      if (seenInitials.has(bopo.symbol)) return;
      seenInitials.add(bopo.symbol);
    } else if (bopo.category === 'medial') {
      if (seenMedials.has(bopo.symbol)) return;
      seenMedials.add(bopo.symbol);
    } else if (bopo.category === 'final') {
      if (seenFinals.has(bopo.symbol)) return;
      seenFinals.add(bopo.symbol);
    }

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
    if (bopo.category === 'vocabulary') {
      ex.textContent = bopo.phrase;
    } else {
      ex.textContent = `${bopo.example}(${bopo.pinyin})`;
    }
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
    } else if (bopo.category === 'vocabulary') {
      if (vocabularyContainer) vocabularyContainer.appendChild(item);
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

  // Question type radios
  const qTypeRadios = settingsForm.querySelectorAll('input[name="question-type"]');
  qTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.settings.questionType = e.target.value;
      saveSettings();
      loadNewQuestion();
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

  // Virtual Keyboard click handlers
  const kbdKeys = document.querySelectorAll('#virtual-keyboard .kbd-key');
  kbdKeys.forEach(keyBtn => {
    keyBtn.addEventListener('click', () => {
      const char = keyBtn.getAttribute('data-char');
      handleKeyInput(char);
    });
  });

  // Input control action buttons
  const backspaceBtn = document.getElementById('bopo-backspace-btn');
  if (backspaceBtn) {
    backspaceBtn.addEventListener('click', handleBackspace);
  }

  const clearBtn = document.getElementById('bopo-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClear);
  }

  const submitBtn = document.getElementById('bopo-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitInputAnswer);
  }

  // Keyboard Navigation / Shortcuts (1-6 to choose, Enter/Space for next, R to replay)
  document.addEventListener('keydown', (e) => {
    // Ignore keyboard shortcuts if modal is open
    const openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
    if (openModals.length > 0) return;

    const key = e.key.toLowerCase();
    
    if (state.settings.questionType === 'input') {
      // 1. INPUT MODE SHORTCUTS
      if (state.currentQuestion.hasAnswered) {
        // Space or Enter for next question when answered
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadNewQuestion();
        }
        
        // Replay audio (R)
        if (key === 'r') {
          if (state.currentQuestion.correctBopo) {
            speak(state.currentQuestion.correctBopo);
          }
        }
        return;
      }

      // If not answered yet
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitInputAnswer();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (key === 'r') {
        e.preventDefault();
        if (state.currentQuestion.correctBopo) {
          speak(state.currentQuestion.correctBopo);
        }
      } else if (key === 'h') {
        e.preventDefault();
        showHint();
      } else {
        // Map physical key to Bopomofo character
        const bopoChar = BOPOMOFO_KEYMAP[e.key]; // Exact case check
        if (bopoChar) {
          e.preventDefault();
          handleKeyInput(bopoChar);
        }
      }
    } else {
      // 2. CHOICES MODE SHORTCUTS (1-6 to choose, Enter/Space for next, R to replay, H for hint)
      if (e.key >= '1' && e.key <= '6') {
        const idx = parseInt(e.key) - 1;
        const optBtn = document.getElementById(`opt-${idx}`);
        if (optBtn && !optBtn.disabled) {
          const selectedSymbol = optBtn.dataset.symbol;
          handleAnswer(selectedSymbol, optBtn);
        }
      }
      
      // Next question (Space or Enter when Next button is active)
      if (e.key === 'Enter' || e.key === ' ') {
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn && !nextBtn.disabled) {
          e.preventDefault();
          loadNewQuestion();
        }
      }

      // Replay question audio (R)
      if (key === 'r') {
        if (state.currentQuestion.correctBopo) {
          speak(state.currentQuestion.correctBopo);
        }
      }

      // Help sheet trigger (H)
      if (key === 'h') {
        showHint();
      }
    }
  });
}

// ==========================================================================
// 8. 注音拼寫輸入邏輯 (Listen & Spell challenge helpers)
// ==========================================================================
const BOPOMOFO_KEYMAP = {
  '1': 'ㄅ', '2': 'ㄉ', '3': 'ˇ', '4': 'ˋ', '5': 'ㄓ', '6': 'ˊ', '7': '˙', '8': 'ㄚ', '9': 'ㄞ', '0': 'ㄢ', '-': 'ㄦ',
  'q': 'ㄆ', 'w': 'ㄊ', 'e': 'ㄍ', 'r': 'ㄐ', 't': 'ㄔ', 'y': 'ㄗ', 'u': 'ㄧ', 'i': 'ㄛ', 'o': 'ㄟ', 'p': 'ㄣ',
  'a': 'ㄇ', 's': 'ㄋ', 'd': 'ㄎ', 'f': 'ㄑ', 'g': 'ㄕ', 'h': 'ㄘ', 'j': 'ㄨ', 'k': 'ㄜ', 'l': 'ㄠ', ';': 'ㄤ',
  'z': 'ㄈ', 'x': 'ㄌ', 'c': 'ㄏ', 'v': 'ㄒ', 'b': 'ㄖ', 'n': 'ㄙ', 'm': 'ㄩ', ',': 'ㄝ', '.': 'ㄡ', '/': 'ㄥ'
};

function handleKeyInput(char) {
  if (state.currentQuestion.hasAnswered) return;
  const inputField = document.getElementById('bopo-input-field');
  if (inputField) {
    inputField.value += char;
  }
}

function handleBackspace() {
  if (state.currentQuestion.hasAnswered) return;
  const inputField = document.getElementById('bopo-input-field');
  if (inputField && inputField.value.length > 0) {
    inputField.value = inputField.value.slice(0, -1);
  }
}

function handleClear() {
  if (state.currentQuestion.hasAnswered) return;
  const inputField = document.getElementById('bopo-input-field');
  if (inputField) {
    inputField.value = '';
  }
}

function submitInputAnswer() {
  if (state.currentQuestion.hasAnswered) return;
  
  const inputField = document.getElementById('bopo-input-field');
  if (!inputField) return;
  
  const userInput = inputField.value.trim();
  if (userInput === '') {
    showSystemNotification('error', '請輸入注音符號再送出！');
    return;
  }
  
  const correctSymbol = state.currentQuestion.correctBopo.symbol;
  
  // Normalize strings for comparison (remove spaces, ignore neutral tone mark variant)
  const normalize = str => str.replace(/\s+/g, '').replace(/˙/g, '');
  const userNorm = normalize(userInput);
  const correctNorm = normalize(correctSymbol);
  
  const isCorrect = (userInput === correctSymbol || userNorm === correctNorm);
  
  state.currentQuestion.attempts++;
  state.currentQuestion.hasAnswered = true;
  
  const submitBtn = document.getElementById('bopo-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
  }
  
  const feedbackBanner = document.getElementById('feedback-banner');
  const feedbackText = document.getElementById('feedback-text');
  
  if (isCorrect) {
    state.score.correct++;
    state.score.total++;
    state.streak++;
    if (state.streak > state.longestStreak) {
      state.longestStreak = state.streak;
    }
    
    if (submitBtn) {
      submitBtn.classList.add('btn-correct');
      submitBtn.innerHTML = '<i class="fas fa-check"></i> 答對了！';
    }
    
    feedbackBanner.className = 'feedback-banner correct-banner';
    feedbackBanner.querySelector('.feedback-icon').className = 'feedback-icon fas fa-check-circle';
    feedbackText.innerHTML = `答對了！這是「${correctSymbol}」（${state.currentQuestion.correctBopo.phrase || ''}）`;
    
    startConfetti();
    speak(state.currentQuestion.correctBopo, true);
    
    if (state.settings.autoNext) {
      setTimeout(() => {
        loadNewQuestion();
      }, 1500);
    }
  } else {
    state.score.total++;
    state.streak = 0;
    
    if (submitBtn) {
      submitBtn.classList.add('btn-wrong');
      submitBtn.innerHTML = '<i class="fas fa-times"></i> 答錯了';
    }
    
    feedbackBanner.className = 'feedback-banner wrong-banner';
    feedbackBanner.querySelector('.feedback-icon').className = 'feedback-icon fas fa-times-circle';
    feedbackText.innerHTML = `答錯囉！正確答案是「${correctSymbol}」（${state.currentQuestion.correctBopo.phrase || ''}）`;
  }
  
  updateStatsUI();
  addHistoryItem(state.currentQuestion.correctBopo, userInput, isCorrect);
  
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.classList.remove('disabled');
    nextBtn.disabled = false;
  }
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
  // Force choices mode only
  state.settings.questionType = 'choices';
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

  // Set Question Type Radios
  const qtypeRadio = form.querySelector(`input[name="question-type"][value="${state.settings.questionType}"]`);
  if (qtypeRadio) qtypeRadio.checked = true;

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
