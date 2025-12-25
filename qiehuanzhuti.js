// 文件名：qiehuanzhuti.js - 修复版（添加双击跳转功能）
(function() {
  'use strict';
  
  // ===== 配置参数 =====
  const CONFIG = {
    TRIPLE_CLICK_TIMEOUT: 800,
    MIN_CLICK_DISTANCE: 15,
    DEBOUNCE_DELAY: 100,
    THEME_TRANSITION: '0.3s ease',
    STORAGE_KEY: 'danshu_theme',
    DOUBLE_CLICK_TIMEOUT: 300 // 双击检测时间阈值
  };
  
  // ===== DOM元素 =====
  const themeButton = document.getElementById('themeToggleButton');
  const html = document.documentElement;
  
  // ===== 状态变量 =====
  let clickHistory = [];
  let isButtonVisible = false;
  let isDarkMode = false;
  let currentTheme = 'light';
  let ignoreNextClick = false;
  let isSyncing = false; // 防止同步循环
  let lastButtonClickTime = 0; // 用于检测双击
  let buttonClickCount = 0; // 按钮点击次数

  // ===== 初始化 =====
  function init() {
    // 设置主题过渡
    setupThemeTransition();
    
    // 加载保存的主题
    loadTheme();
    
    // 监听storage事件（用于跨页面同步）
    setupStorageListener();
    
    // 如果有主题按钮，设置完整的交互
    if (themeButton) {
      themeButton.style.display = 'flex';
      themeButton.classList.add('hidden');
      
      setupTripleClick();
      themeButton.addEventListener('click', handleButtonClick);
      
      // 阻止按钮点击冒泡到document
      themeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        ignoreNextClick = true;
      });
    }
    
    // 点击其他地方隐藏按钮（使用捕获阶段）
    document.addEventListener('click', handleDocumentClick, true);
    
    // 监听系统主题变化
    setupSystemThemeListener();
    
    console.log('🎨 主题切换系统已初始化 - 双向同步版（支持双击跳转）');
  }
  
  // ===== 监听storage事件，实现跨页面同步 =====
  function setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === CONFIG.STORAGE_KEY) {
        if (!isSyncing) {
          isSyncing = true;
          const newTheme = e.newValue || 'light';
          applyThemeFromStorage(newTheme);
          setTimeout(() => { isSyncing = false; }, 100);
        }
      }
    });
    
    // 监听自定义的跨页面事件（用于同域下标签页间通信）
    window.addEventListener('themechange-crosspage', (e) => {
      if (!isSyncing) {
        isSyncing = true;
        applyThemeFromStorage(e.detail.theme);
        setTimeout(() => { isSyncing = false; }, 100);
      }
    });
  }
  
  // ===== 从存储应用主题 =====
  function applyThemeFromStorage(theme) {
    if (theme === currentTheme) return;
    
    currentTheme = theme;
    isDarkMode = theme === 'dark';
    
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      if (themeButton) themeButton.setAttribute('aria-label', '切换到浅色模式');
    } else {
      html.removeAttribute('data-theme');
      if (themeButton) themeButton.setAttribute('aria-label', '切换到深色模式');
    }
    
    updateButtonIcon();
    console.log(`🔄 从存储同步主题: ${theme}`);
  }
  
  // ===== 三连击检测 =====
  function setupTripleClick() {
    if (!themeButton) return;
    
    let lastClickTime = 0;
    let clickCount = 0;
    let lastX = 0;
    let lastY = 0;
    
    document.addEventListener('click', (e) => {
      if (e.target === themeButton || themeButton.contains(e.target)) {
        return;
      }
      
      const currentTime = Date.now();
      const distance = Math.sqrt(
        Math.pow(e.clientX - lastX, 2) + Math.pow(e.clientY - lastY, 2)
      );
      
      if (currentTime - lastClickTime > CONFIG.TRIPLE_CLICK_TIMEOUT || distance > CONFIG.MIN_CLICK_DISTANCE) {
        clickCount = 1;
      } else {
        clickCount++;
      }
      
      lastClickTime = currentTime;
      lastX = e.clientX;
      lastY = e.clientY;
      
      if (clickCount === 3) {
        clickCount = 0;
        showThemeButton(e.clientX, e.clientY);
        createClickFeedback(e.clientX, e.clientY);
      }
    });
  }
  
  // ===== 显示主题按钮 =====
  function showThemeButton(x, y) {
    if (!themeButton || isButtonVisible) return;
    
    const buttonSize = 48;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const left = Math.max(10, Math.min(x - buttonSize/2, viewportWidth - buttonSize - 10));
    const top = Math.max(10, Math.min(y - buttonSize/2, viewportHeight - buttonSize - 10));
    
    themeButton.style.left = `${left}px`;
    themeButton.style.top = `${top}px`;
    themeButton.classList.remove('hidden');
    themeButton.classList.add('visible', 'float-in');
    
    setTimeout(() => {
      themeButton.classList.remove('float-in');
    }, 300);
    
    isButtonVisible = true;
    ignoreNextClick = true;
    updateButtonIcon();
  }
  
  // ===== 隐藏主题按钮 =====
  function hideThemeButton() {
    if (!themeButton || !isButtonVisible) return;
    
    themeButton.classList.add('float-out');
    
    setTimeout(() => {
      themeButton.classList.remove('visible', 'float-out');
      themeButton.classList.add('hidden');
      isButtonVisible = false;
      ignoreNextClick = false;
    }, 300);
  }
  
  // ===== 按钮点击处理 =====
  function handleButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    
    // 检查是否是双击
    if (now - lastButtonClickTime < CONFIG.DOUBLE_CLICK_TIMEOUT) {
      // 双击事件
      buttonClickCount = 0;
      lastButtonClickTime = 0;
      handleDoubleClick();
      return;
    }
    
    // 单次点击
    lastButtonClickTime = now;
    buttonClickCount = 1;
    
    // 设置定时器，如果300ms内没有第二次点击，则执行单次点击操作
    setTimeout(() => {
      if (buttonClickCount === 1) {
        // 执行单次点击操作：切换主题
        toggleTheme();
        
        themeButton.classList.add('clicked');
        setTimeout(() => {
          themeButton.classList.remove('clicked');
        }, 300);
      }
    }, CONFIG.DOUBLE_CLICK_TIMEOUT);
  }
  
  // ===== 处理双击跳转 =====
  function handleDoubleClick() {
    console.log('🔄 检测到双击主题按钮，准备跳转到 bianqian.html');
    
    // 添加跳转动画
    themeButton.classList.add('jump-to-bianqian');
    
    // 播放提示音（可选）
    playJumpSound();
    
    // 延迟跳转，让动画完成
    setTimeout(() => {
      try {
        // 跳转到 bianqian.html
        window.location.href = 'bianqian.html';
      } catch (error) {
        console.error('跳转失败:', error);
        // 如果跳转失败，移除动画类
        themeButton.classList.remove('jump-to-bianqian');
      }
    }, 500);
  }
  
  // ===== 播放跳转提示音（可选） =====
  function playJumpSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.2); // C6
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('音频播放失败（静音环境）');
    }
  }
  
  // ===== 切换主题 =====
  function toggleTheme() {
    isDarkMode = !isDarkMode;
    currentTheme = isDarkMode ? 'dark' : 'light';
    
    applyTheme(currentTheme);
    saveTheme(currentTheme);
    updateButtonIcon();
    dispatchThemeChange(currentTheme);
    
    // 触发跨页面同步
    triggerCrossPageSync(currentTheme);
  }
  
  // ===== 应用主题 =====
  function applyTheme(theme) {
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      if (themeButton) themeButton.setAttribute('aria-label', '切换到浅色模式');
    } else {
      html.removeAttribute('data-theme');
      if (themeButton) themeButton.setAttribute('aria-label', '切换到深色模式');
    }
    
    html.classList.add('theme-transitioning');
    setTimeout(() => {
      html.classList.remove('theme-transitioning');
    }, 300);
  }
  
  // ===== 更新按钮图标 =====
  function updateButtonIcon() {
    if (!themeButton) return;
    
    const moonIcon = themeButton.querySelector('.moon-icon');
    const sunIcon = themeButton.querySelector('.sun-icon');
    
    if (isDarkMode) {
      if (moonIcon) {
        moonIcon.style.opacity = '0';
        moonIcon.style.transform = 'rotate(90deg) scale(0.8)';
      }
      if (sunIcon) {
        sunIcon.style.opacity = '1';
        sunIcon.style.transform = 'rotate(0) scale(1)';
      }
    } else {
      if (moonIcon) {
        moonIcon.style.opacity = '1';
        moonIcon.style.transform = 'rotate(0) scale(1)';
      }
      if (sunIcon) {
        sunIcon.style.opacity = '0';
        sunIcon.style.transform = 'rotate(-90deg) scale(0.8)';
      }
    }
  }
  
  // ===== 点击外部隐藏 =====
  function handleDocumentClick(e) {
    if (ignoreNextClick) {
      ignoreNextClick = false;
      return;
    }
    
    if (!isButtonVisible) return;
    
    if (!themeButton || !themeButton.contains(e.target)) {
      hideThemeButton();
    }
  }
  
  // ===== 点击反馈效果 =====
  function createClickFeedback(x, y) {
    const feedback = document.createElement('div');
    feedback.className = 'click-feedback';
    feedback.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 1px;
      height: 1px;
      border-radius: 50%;
      background: rgba(78, 205, 196, 0.5);
      pointer-events: none;
      z-index: 9998;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.style.transition = 'all 0.3s ease-out';
      feedback.style.transform = 'scale(30)';
      feedback.style.opacity = '0';
    }, 10);
    
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 500);
  }
  
  // ===== 主题过渡设置 =====
  function setupThemeTransition() {
    if (document.querySelector('style[data-theme-transition]')) return;
    
    const style = document.createElement('style');
    style.setAttribute('data-theme-transition', 'true');
    style.textContent = `
      .theme-transitioning,
      .theme-transitioning *,
      .theme-transitioning *:before,
      .theme-transitioning *:after {
        transition: background-color ${CONFIG.THEME_TRANSITION},
                    color ${CONFIG.THEME_TRANSITION},
                    border-color ${CONFIG.THEME_TRANSITION},
                    opacity ${CONFIG.THEME_TRANSITION} !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // ===== 跨页面同步 =====
  function triggerCrossPageSync(theme) {
    try {
      // 方法1：使用storage事件（适合不同标签页）
      localStorage.setItem(CONFIG.STORAGE_KEY, theme);
      
      // 方法2：使用自定义事件（适合同一浏览器实例）
      const event = new CustomEvent('themechange-crosspage', {
        detail: { theme }
      });
      window.dispatchEvent(event);
      
      // 方法3：如果支持，使用BroadcastChannel（最可靠）
      if (typeof BroadcastChannel !== 'undefined') {
        if (!window.themeChannel) {
          window.themeChannel = new BroadcastChannel('danshu_theme_channel');
        }
        window.themeChannel.postMessage({ theme });
      }
    } catch (e) {
      console.warn('跨页面同步失败:', e);
    }
  }
  
  // ===== 本地存储 =====
  function saveTheme(theme) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, theme);
    } catch (e) {
      console.warn('无法保存主题设置:', e);
    }
  }
  
  function loadTheme() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (saved) {
        currentTheme = saved;
        isDarkMode = saved === 'dark';
      } else {
        currentTheme = systemPrefersDark ? 'dark' : 'light';
        isDarkMode = systemPrefersDark;
      }
      
      applyTheme(currentTheme);
      updateButtonIcon();
    } catch (e) {
      console.warn('无法加载主题设置:', e);
    }
  }
  
  // ===== 主题变化事件 =====
  function dispatchThemeChange(theme) {
    const event = new CustomEvent('themechange', {
      detail: { theme }
    });
    window.dispatchEvent(event);
  }
  
  // ===== 系统主题监听 =====
  function setupSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!saved) {
        currentTheme = e.matches ? 'dark' : 'light';
        isDarkMode = e.matches;
        applyTheme(currentTheme);
        updateButtonIcon();
        triggerCrossPageSync(currentTheme);
      }
    });
  }
  
  // ===== BroadcastChannel 监听 =====
  if (typeof BroadcastChannel !== 'undefined') {
    window.themeChannel = new BroadcastChannel('danshu_theme_channel');
    window.themeChannel.onmessage = (e) => {
      if (e.data && e.data.theme && !isSyncing) {
        isSyncing = true;
        applyThemeFromStorage(e.data.theme);
        setTimeout(() => { isSyncing = false; }, 100);
      }
    };
  }
  
  // ===== 初始化执行 =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // ===== 公开API =====
  window.ThemeToggle = {
    show: (x, y) => showThemeButton(
      x || window.innerWidth / 2, 
      y || window.innerHeight / 2
    ),
    hide: hideThemeButton,
    toggle: toggleTheme,
    getTheme: () => currentTheme,
    setTheme: (theme) => {
      if (theme === 'dark' || theme === 'light') {
        isDarkMode = theme === 'dark';
        currentTheme = theme;
        applyTheme(theme);
        saveTheme(theme);
        updateButtonIcon();
        triggerCrossPageSync(theme);
      }
    },
    isVisible: () => isButtonVisible,
    jumpToBianqian: () => {
      // 公开跳转方法，可以从其他地方调用
      console.log('🔄 调用公开方法跳转到 bianqian.html');
      window.location.href = 'bianqian.html';
    }
  };
})();