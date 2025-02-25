/**
 * Dialog Component for AI Text Assistant
 * Created: 2025-02-22 06:34:23
 * Author: yuguomingcn
 */
console.log('dialog.js loaded');
(function() {
    // 保存原来的 ChatDialog（如果存在的话）
    const originalChatDialog = window.ChatDialog;

    class ChatDialog {
        constructor() {
            this.dialog = null;
            this.isVisible = false;
            this.isInitialized = false;
            this.isIntroView = true;
            this.isTransitioning = false; // 添加过渡状态标记
        }

    async create() {
        console.log('Creating dialog...');
        if (this.dialog) {
            console.log('Dialog already exists');
            return;
        }

        this.dialog = document.createElement('div');
        this.dialog.id = 'ai-chat-dialog';
        this.dialog.style.cssText = `
            position: fixed;
            top: 0;
            right: -350px;
            width: 350px;
            height: 100%;
            background: white;
            box-shadow: -2px 0 5px rgba(0,0,0,0.1);
            transition: right 0.3s ease;
            z-index: 2147483647;
            display: block;
        `;

        document.body.appendChild(this.dialog);


        try {
            const response = await fetch(chrome.runtime.getURL('dialog.html'));
            const html = await response.text();
            
            // 提取和添加样式
            const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
            if (styleMatch) {
                const styleElement = document.createElement('style');
                styleElement.textContent = styleMatch[1];
                document.head.appendChild(styleElement);
            }
            
            // 添加内容
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('.chat-container');
            
            if (content) {
                this.dialog.appendChild(content);
                this.initializeEventListeners();
                this.isInitialized = true;
                this.showIntroduction();
                console.log('Dialog initialization completed');
            }
        } catch (error) {
            console.error('Error loading dialog HTML:', error);
            throw error;
        }
    }

    // 修改 show 方法，确保在有选中文本时切换到聊天视图
    show(selectedText = '') {
        console.log('Show called', { isVisible: this.isVisible, isTransitioning: this.isTransitioning });
        
        if (this.isTransitioning || this.isVisible) {
            console.log('Show canceled - dialog is transitioning or already visible');
            return;
        }

        this.isTransitioning = true;
        this.dialog.style.display = 'block';
        
        // 强制重排
        this.dialog.offsetHeight;
        
        requestAnimationFrame(() => {
            this.dialog.style.right = '0';
            this.isVisible = true;
            
            if (selectedText) {
                this.switchToChat();
                this.addMessage(selectedText, 'user');
                this.addMessage('您想对这段文字做什么？', 'ai');
            } else if (!this.isIntroView) {
                this.switchToChat();
            } else {
                this.switchToIntro();
            }
        });

        // 监听过渡结束
        const handleTransitionEnd = () => {
            this.isTransitioning = false;
            this.dialog.removeEventListener('transitionend', handleTransitionEnd);
            console.log('Show transition completed');
        };
        this.dialog.addEventListener('transitionend', handleTransitionEnd);
    }


    // 在 ChatDialog 类中添加这个方法，建议放在 switchToIntro 方法前（大约第94行）：
    showIntroduction() {
        if (!this.isInitialized) {
            console.log('Dialog not initialized yet, cannot show introduction');
            return;
        }
        
        const introView = this.dialog.querySelector('#introduction-view');
        const chatView = this.dialog.querySelector('#chat-view');
        
        if (introView && chatView) {
            // 显示介绍视图，隐藏聊天视图
            introView.style.display = 'block';
            chatView.style.display = 'none';
            this.isIntroView = true;
            
            // 重置聊天框高度（如果需要）
            const messagesContainer = this.dialog.querySelector('#chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = 0;
            }
            
            // 确保输入框是空的
            const input = this.dialog.querySelector('#user-input');
            if (input) {
                input.value = '';
                input.style.height = 'auto';
            }
        } else {
            console.error('Required view elements not found');
        }
    }


    switchToChat() {
        console.log('Switching to chat view...');
        const introView = this.dialog.querySelector('#introduction-view');
        const chatView = this.dialog.querySelector('#chat-view');
        
        if (introView && chatView) {
            introView.style.display = 'none';
            chatView.style.display = 'flex';
            this.isIntroView = false;
        } else {
            console.error('Views not found:', {
                introView: !!introView,
                chatView: !!chatView
            });
        }
    }

    switchToIntro() {
        console.log('Switching to intro view...');
        const introView = this.dialog.querySelector('#introduction-view');
        const chatView = this.dialog.querySelector('#chat-view');
        
        if (introView && chatView) {
            introView.style.display = 'block';
            chatView.style.display = 'none';
            this.isIntroView = true;
        } else {
            console.error('Views not found:', {
                introView: !!introView,
                chatView: !!chatView
            });
        }
    }

    hide() {
        console.log('Hide called', { isVisible: this.isVisible, isTransitioning: this.isTransitioning });
        
        if (this.isTransitioning || !this.isVisible) {
            console.log('Hide canceled - dialog is transitioning or already hidden');
            return;
        }

        this.isTransitioning = true;
        this.dialog.style.right = '-350px';
        
        // 监听过渡结束
        const handleTransitionEnd = () => {
            this.isVisible = false;
            this.isTransitioning = false;
            this.switchToIntro();
            this.dialog.removeEventListener('transitionend', handleTransitionEnd);
            console.log('Hide transition completed');
        };
        this.dialog.addEventListener('transitionend', handleTransitionEnd);
    }

    toggle(selectedText = '') {
        console.log('Toggle called', { isVisible: this.isVisible, isTransitioning: this.isTransitioning });
        
        if (this.isTransitioning) {
            console.log('Toggle canceled - dialog is transitioning');
            return;
        }

        if (this.isVisible) {
            this.hide();
        } else {
            this.show(selectedText);
        }
    }

    async addMessage(text, type) {
        if (!this.isInitialized) {
            console.log('Dialog not initialized yet, cannot add message');
            return;
        }
    
        const messagesContainer = this.dialog.querySelector('#chat-messages');
        if (!messagesContainer) {
            console.error('Messages container not found');
            return;
        }
    
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message new-message`; // 添加 new-message 类
    
        // 确保滚动到底部的函数
        const scrollToBottom = () => {
            if (messagesContainer) {
                requestAnimationFrame(() => {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    setTimeout(() => {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }, 50);
                });
            }
        };
    
        if (type === 'ai') {
            // AI 消息的处理
            messageDiv.innerHTML = `
            <div class="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
            messagesContainer.appendChild(messageDiv);
            scrollToBottom();
    
            await new Promise(resolve => setTimeout(resolve, 1500));
   
            // 替换为实际消息内容
            messageDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-text typing-text-cursor"></div>
            </div>
                <div class="message-actions">
                    <button class="message-action-button refresh-button" title="刷新">
                    <svg viewBox="0 0 24 24" sizes=""><path fill="#666666" d="M11.36 8.009a.5.5 0 01-.565.701l-6.13-1.43a.5.5 0 01-.348-.679L6.861.49a.5.5 0 01.913-.023l.985 2.072A9.978 9.978 0 0112 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12v-.024c0-.267.222-.476.488-.476h2.03c.27 0 .482.23.482.5 0 3.864 3.136 7 7 7s7-3.136 7-7a7.003 7.003 0 00-8.94-6.727l1.3 2.736z"></path></svg>
                    </button>
                    <button class="message-action-button copy-button" title="复制">
                    <svg viewBox="0 0 24 24">
<path fill="#666666" d="M6 3C6 1.34315 7.34315 0 9 0H14C14.2652 0 14.5196 0.105357 14.7071 0.292893L21.7071 7.29289C21.8946 7.48043 22 7.73478 22 8V17C22 18.6569 20.6569 20 19 20H18V21C18 22.6569 16.6569 24 15 24H5C3.34315 24 2 22.6569 2 21V7C2 5.34315 3.34315 4 5 4H6V3ZM6 6H5C4.44772 6 4 6.44772 4 7V21C4 21.5523 4.44772 22 5 22H15C15.5523 22 16 21.5523 16 21V20H9C7.34315 20 6 18.6569 6 17V6ZM9 2C8.44772 2 8 2.44772 8 3V17C8 17.5523 8.44771 18 9 18H19C19.5523 18 20 17.5523 20 17V9H16C14.3431 9 13 7.65685 13 6V2H9ZM15 3.41421L18.5858 7H16C15.4477 7 15 6.55228 15 6V3.41421Z" fill="#293644"/>
</svg>
                    </button>
                </div>
            `;
    
            const typingText = messageDiv.querySelector('.typing-text');
            let currentText = '';
    
            // 逐字打印文本
            for (let i = 0; i < text.length; i++) {
                currentText += text[i];
                typingText.textContent = currentText;
                await new Promise(resolve => setTimeout(resolve, 30));
                if (i % 5 === 0 || i === text.length - 1) {
                    scrollToBottom();
                }
            }

            // 动画完成后去掉光标效果
            typingText.classList.remove('typing-text-cursor');

            // 动画完成后移除新消息类
            setTimeout(() => {
                messageDiv.classList.remove('new-message');
            }, 300);
    
        } else {
            // 用户消息直接显示
            messageDiv.innerHTML = `
                <div class="message-content">${text}</div>
                <div class="message-actions">
                
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
            scrollToBottom();
    
            // 动画完成后移除新消息类
            setTimeout(() => {
                messageDiv.classList.remove('new-message');
            }, 300);
        }
    
        // 添加复制和刷新功能
        const copyButton = messageDiv.querySelector('.copy-button');
        const refreshButton = messageDiv.querySelector('.refresh-button');
    
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(text).then(() => {
                    console.log('文本已复制');
                });
            });
        }
    
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                console.log('刷新消息');
            });
        }
    }


    showTypingIndicator() {
        if (!this.isInitialized) {
            console.log('Dialog not initialized yet, cannot show typing indicator');
            return null;
        }

        const messagesContainer = this.dialog.querySelector('#chat-messages');
        if (!messagesContainer) {
            console.error('Messages container not found');
            return null;
        }

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return typingDiv;
    }

    removeTypingIndicator(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    showConfirmDialog() {
        return new Promise((resolve) => {
            const confirmDialog = this.dialog.querySelector('#confirm-dialog');
            const confirmYes = this.dialog.querySelector('#confirm-yes');
            const confirmNo = this.dialog.querySelector('#confirm-no');

            // 显示对话框
            confirmDialog.style.display = 'flex';

            // 确定按钮事件
            const handleYes = () => {
                confirmDialog.style.display = 'none';
                confirmYes.removeEventListener('click', handleYes);
                confirmNo.removeEventListener('click', handleNo);
                resolve(true);
            };

            // 取消按钮事件
            const handleNo = () => {
                confirmDialog.style.display = 'none';
                confirmYes.removeEventListener('click', handleYes);
                confirmNo.removeEventListener('click', handleNo);
                resolve(false);
            };

            confirmYes.addEventListener('click', handleYes);
            confirmNo.addEventListener('click', handleNo);
        });
    }

    // 添加清空消息的方法
    async clearMessages() {
        const messagesContainer = this.dialog.querySelector('#chat-messages');
        if (messagesContainer) {
            // 使用自定义确认对话框
            const confirmed = await this.showConfirmDialog();
            if (confirmed) {
                // 清空消息容器
                messagesContainer.innerHTML = '';
                // 切换到介绍页面
                this.switchToIntro();
            }
        }
    }

    // 修改 initializeEventListeners 方法，添加清空按钮的事件监听
    initializeEventListeners() {
        if (!this.dialog) {
            console.log('Dialog not created, cannot initialize event listeners');
            return;
        }
    
        console.log('Initializing event listeners');
    
        // 获取元素
        const loginBtn = this.dialog.querySelector('#loginButton');
        const loginView = this.dialog.querySelector('#login-view');
        const introContent = this.dialog.querySelector('#intro-content');
        const backButton = this.dialog.querySelector('#back-to-intro');
    
        console.log('Elements found:', {
            loginBtn: loginBtn ? 'Found' : 'Not found',
            loginView: loginView ? 'Found' : 'Not found',
            introContent: introContent ? 'Found' : 'Not found',
            backButton: backButton ? 'Found' : 'Not found'
        });
    
        // 监听登录按钮点击
        if (loginBtn) {
            console.log('Adding click event to login button');
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Login button clicked');
                if (loginView && introContent) {
                    loginView.style.display = 'block';
                    introContent.style.display = 'none';
                    console.log('Switched to login view');
                } else {
                    console.log('Login view or intro content not found:', {
                        loginView: !!loginView,
                        introContent: !!introContent
                    });
                }
            });
        }
    
        // 监听返回按钮点击
        if (backButton) {
            console.log('Adding click event to back button');
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Back button clicked');
                if (loginView && introContent) {
                    loginView.style.display = 'none';
                    introContent.style.display = 'block';
                    console.log('Switched back to intro view');
                }
            });
        }
    
        // 监听 Google 登录按钮
        const googleLoginBtn = this.dialog.querySelector('.google-login-btn');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                console.log('Google login button clicked');
                // 这里添加 Google 登录逻辑
            });
        }
    
        // 监听邮箱登录按钮
        const loginSubmitBtn = this.dialog.querySelector('.login-submit-btn');
        if (loginSubmitBtn) {
            loginSubmitBtn.addEventListener('click', () => {
                console.log('Login submit button clicked');
                // 这里添加邮箱登录逻辑
            });
        }
    
        // 监听发送验证码按钮
        const sendCodeBtn = this.dialog.querySelector('.send-code-btn');
        if (sendCodeBtn) {
            sendCodeBtn.addEventListener('click', () => {
                console.log('Send code button clicked');
                // 这里添加发送验证码逻辑
            });
        }

        const closeButton = this.dialog.querySelector('#close-chat');
        const clearButton = this.dialog.querySelector('#clear-messages');
        const sendButton = this.dialog.querySelector('#send-message');
        const input = this.dialog.querySelector('#user-input');

        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearMessages());
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => this.hide());
        }

        if (input) {
            // 添加输入框自适应高度功能
            const adjustHeight = () => {
                input.style.height = 'auto';
                input.style.height = input.scrollHeight + 'px';
            };

            // 监听输入事件以调整高度
            input.addEventListener('input', adjustHeight);

            // 监听回车键发送消息
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });

            // 初始化时调整一次高度
            adjustHeight();
        }

        if (sendButton && input) {
            sendButton.addEventListener('click', () => this.handleSendMessage());
        }

        // 防止事件冒泡的代码保持不变
        this.dialog.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        this.dialog.addEventListener('selectstart', (e) => {
            e.stopPropagation();
        });

        this.dialog.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });
    }

    async handleSendMessage() {
        if (!this.isInitialized) {
            console.log('Dialog not initialized yet, cannot send message');
            return;
        }
    
        const input = this.dialog.querySelector('#user-input');
        if (!input) {
            console.error('Input element not found');
            return;
        }
    
        const message = input.value.trim();
        
        if (message) {
            input.value = '';
            input.style.height = 'auto';
            
            // 确保切换到聊天视图
            if (this.isIntroView) {
                this.switchToChat();
            }
    
            this.addMessage(message, 'user');
    
            const typingIndicator = this.showTypingIndicator();
    
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.removeTypingIndicator(typingIndicator);
                this.addMessage('我收到了你的消息：' + message, 'ai');
            } catch (error) {
                console.error('Error processing message:', error);
                this.removeTypingIndicator(typingIndicator);
                this.addMessage('抱歉，处理消息时出现错误。', 'ai');
            }
        }
    }
}
// 将 ChatDialog 暴露到全局，但提供冲突处理
window.ChatDialog = ChatDialog;

// 提供一个恢复原始值的方法（如果需要的话）
window.ChatDialog.noConflict = function() {
    window.ChatDialog = originalChatDialog;
    return ChatDialog;
};
})();