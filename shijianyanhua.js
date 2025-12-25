// 文件名：shijianyanhua.js - 增强版
(function() {
    'use strict';
    
    // 获取时间按钮元素
    const timeButton = document.getElementById('timeButton');
    const timeStamp = document.getElementById('timeStamp');
    
    if (!timeButton || !timeStamp) return;
    
    // 创建烟花容器
    const fireworkContainer = document.createElement('div');
    fireworkContainer.className = 'firework-container';
    timeButton.appendChild(fireworkContainer);
    
    // 创建键盘快捷键提示
    const keyboardHint = document.createElement('div');
    keyboardHint.className = 'keyboard-hint';
    keyboardHint.textContent = '按 T 键更新';
    timeButton.appendChild(keyboardHint);
    
    // 生成烟花粒子
    function createFirework(x, y, color) {
        const particleCount = 16;
        const colors = color ? [color] : [
            '#4ecdc4', '#45b7d1', '#ff6b6b', '#ffd166', '#9d4edd'
        ];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework-particle';
            
            // 随机角度和距离
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 30 + Math.random() * 40;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            // 随机颜色和大小
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 2 + Math.random() * 4;
            
            particle.style.cssText = `
                --tx: ${tx}px;
                --ty: ${ty}px;
                background: ${color};
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                animation-delay: ${Math.random() * 0.2}s;
            `;
            
            fireworkContainer.appendChild(particle);
            
            // 清理粒子
            setTimeout(() => {
                if (particle.parentNode === fireworkContainer) {
                    fireworkContainer.removeChild(particle);
                }
            }, 1000);
        }
    }
    
    // 点击时间按钮更新
    timeButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 添加激活状态
        this.classList.add('active');
        
        // 创建烟花效果
        const rect = this.getBoundingClientRect();
        createFirework(rect.width / 2, rect.height / 2, '#4ecdc4');
        
        // 手动触发时间更新
        if (typeof updateTime === 'function') {
            updateTime();
        } else {
            updateTimeManually();
        }
        
        // 移除激活状态
        setTimeout(() => {
            this.classList.remove('active');
        }, 1000);
    });
    
    // 模拟时间更新函数
    function updateTimeManually() {
        const date = new Date();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        // 数字滚动效果
        timeStamp.style.opacity = '0.5';
        timeStamp.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            timeStamp.textContent = `${hours}:${minutes}:${seconds}`;
            timeStamp.style.opacity = '1';
            timeStamp.style.transform = 'translateY(0)';
            
            // 创建数字更新烟花
            createFirework(
                timeStamp.offsetWidth / 2, 
                timeStamp.offsetHeight / 2, 
                '#ff6b6b'
            );
        }, 200);
        
        // 加载状态
        timeButton.classList.add('loading');
        
        setTimeout(() => {
            timeButton.classList.remove('loading');
        }, 500);
    }
    
    // 双击显示完整时间
    timeButton.addEventListener('dblclick', function() {
        this.classList.add('double-click');
        showFullDateTime();
        
        // 创建华丽的烟花效果
        const rect = this.getBoundingClientRect();
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                createFirework(
                    rect.width / 2 + (Math.random() - 0.5) * 20,
                    rect.height / 2 + (Math.random() - 0.5) * 20,
                    null
                );
            }, i * 100);
        }
        
        setTimeout(() => {
            this.classList.remove('double-click');
        }, 500);
    });
    
    // 显示完整日期时间
    function showFullDateTime() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekday = weekdays[date.getDay()];
        
        // 保存原始文本
        const originalText = timeStamp.textContent;
        
        // 淡出效果
        timeStamp.style.opacity = '0.3';
        timeStamp.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            timeStamp.textContent = `${year}/${month}/${day} ${weekday} ${hours}:${minutes}`;
            timeStamp.style.opacity = '1';
            timeStamp.style.transform = 'scale(1)';
        }, 200);
        
        // 3秒后恢复
        setTimeout(() => {
            if (typeof updateTime === 'function') {
                updateTime();
            } else {
                timeStamp.style.opacity = '0.3';
                timeStamp.style.transform = 'scale(0.9)';
                
                setTimeout(() => {
                    timeStamp.textContent = originalText;
                    timeStamp.style.opacity = '1';
                    timeStamp.style.transform = 'scale(1)';
                }, 200);
            }
        }, 3000);
    }
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey) {
            // 显示快捷键反馈
            keyboardHint.style.background = '#ff6b6b';
            setTimeout(() => {
                keyboardHint.style.background = '';
            }, 300);
            
            timeButton.click();
        }
    });
    
    // 触摸设备长按支持
    let pressTimer;
    timeButton.addEventListener('touchstart', function(e) {
        pressTimer = setTimeout(() => {
            this.classList.add('double-click');
            showFullDateTime();
        }, 1000);
    });
    
    timeButton.addEventListener('touchend', function(e) {
        clearTimeout(pressTimer);
        this.classList.remove('double-click');
    });
    
    timeButton.addEventListener('touchmove', function(e) {
        clearTimeout(pressTimer);
        this.classList.remove('double-click');
    });
    
    // 鼠标悬停效果
    timeButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    timeButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
    
    console.log('🎆 时间烟花交互已加载 - 增强版');
})();