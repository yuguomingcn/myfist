/**
 * Dialog Component for AI Text Assistant
 * Created: 2025-02-22 06:34:23
 * Author: yuguomingcn
 */

class ChatDialog {
    constructor() {
        this.dialog = null;
        this.isVisible = false;
        this.isInitialized = false;
        this.isIntroView = true;  // 添加视图状态标记
    }

    async create() {
        console.log('Creating dialog...');
        // 创建主对话框容器
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
        `;

        // 先将dialog添加到文档中
        document.body.appendChild(this.dialog);

        try {
            // 加载外部HTML
            const response = await fetch(chrome.runtime.getURL('dialog.html'));
            const html = await response.text();
            
            // 提取 style 内容
            const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
            const styleContent = styleMatch ? styleMatch[1] : '';
            
            // 创建并添加样式
            if (styleContent) {
                const styleElement = document.createElement('style');
                styleElement.textContent = styleContent;
                document.head.appendChild(styleElement);
            }
            
            // 提取和添加 body 内容
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('.chat-container');
            
            if (content) {
                this.dialog.appendChild(content);
                this.initializeEventListeners();
                this.isInitialized = true;
                this.showIntroduction(); // 替换原来的 addWelcomeMessage
                console.log('Dialog initialization completed');
            } else {
                console.error('Failed to find .chat-container in loaded HTML');
            }
        } catch (error) {
            console.error('Error loading dialog HTML:', error);
        }
    }

    // 修改 show 方法，确保在有选中文本时切换到聊天视图
    async show(selectedText = '') {
        console.log('Showing dialog...');
        if (!this.dialog || !this.isInitialized) {
            await this.create();
        }

        if (!this.isInitialized) {
            console.log('Dialog not initialized yet, waiting...');
            return;
        }

        this.dialog.style.right = '0';
        this.isVisible = true;

        // 根据触发方式决定显示哪个视图
        if (selectedText) {
            this.switchToChat();  // 如果有选中文本，切换到聊天视图
            this.addMessage(selectedText, 'user');
            this.addMessage('您想对这段文字做什么？', 'ai');
        } else if (!this.isIntroView) {
            // 如果当前在聊天视图且没有选中文本，保持在聊天视图
            this.switchToChat();
        } else {
            this.switchToIntro();  // 否则显示介绍页面
        }
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


    // 添加视图切换方法
    switchToIntro() {
        const introView = this.dialog.querySelector('#introduction-view');
        const chatView = this.dialog.querySelector('#chat-view');
        if (introView && chatView) {
            introView.style.display = 'block';
            chatView.style.display = 'none';
            this.isIntroView = true;
        }
    }

    switchToChat() {
        const introView = this.dialog.querySelector('#introduction-view');
        const chatView = this.dialog.querySelector('#chat-view');
        if (introView && chatView) {
            introView.style.display = 'none';
            chatView.style.display = 'flex';
            this.isIntroView = false;
        }
    }

    hide() {
        if (this.dialog) {
            this.dialog.style.right = '-350px';
            this.isVisible = false;
        }
    }

    toggle(selectedText = '') {
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
        messageDiv.className = `message ${type}-message`;
        
        // 确保滚动到底部的函数
        const scrollToBottom = () => {
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                // 添加一个额外的检查，以确保真正滚动到底部
                requestAnimationFrame(() => {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
            scrollToBottom(); // 思考动画滚动到底部
    
            await new Promise(resolve => setTimeout(resolve, 1500));
    
            // 替换为实际消息内容
            messageDiv.innerHTML = `
                <div class="message-content typing-effect">
                    ${text.split('').map(char => `<span>${char}</span>`).join('')}
                </div>
                <div class="message-actions">
                    <button class="message-action-button refresh-button" title="刷新">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                        </svg>
                    </button>
                    <button class="message-action-button copy-button" title="复制">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                </div>
            `;
    
            const messageContent = messageDiv.querySelector('.message-content');
            const spans = messageContent.querySelectorAll('span');
    
            // 显示消息内容
            messageContent.classList.add('show');
    
            // 为每个字符添加延迟动画
            spans.forEach((span, index) => {
                setTimeout(() => {
                    span.style.animation = 'typewriter 0.05s ease forwards';
                    if (index === spans.length - 1) {
                        setTimeout(() => {
                            scrollToBottom(); // 打字效果完成后再次滚动到底部
                        }, 50);
                    }
                }, index * 50);
            });
    
        } else {
            // 用户消息直接显示
            messageDiv.innerHTML = `
                <div class="message-content">${text}</div>
                <div class="message-actions">
                    <button class="message-action-button refresh-button" title="刷新">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                        </svg>
                    </button>
                    <button class="message-action-button copy-button" title="复制">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
            scrollToBottom(); // 用户消息滚动到底部
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

    // 添加清空消息的方法
    clearMessages() {
        const messagesContainer = this.dialog.querySelector('#chat-messages');
        if (messagesContainer) {
            // 显示确认对话框
            if (confirm('确定要清空所有对话记录吗？')) {
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
            console.error('Dialog not created, cannot initialize event listeners');
            return;
        }

        const closeButton = this.dialog.querySelector('#close-chat');
        const clearButton = this.dialog.querySelector('#clear-messages');
        const sendButton = this.dialog.querySelector('#send-message');
        const input = this.dialog.querySelector('#user-input');

        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearMessages());
        }

        // 其他现有的事件监听保持不变
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hide());
        }

        if (sendButton && input) {
            sendButton.addEventListener('click', () => this.handleSendMessage());

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });

            input.addEventListener('input', function() {
                this.style.height = 'auto';
                const newHeight = Math.min(this.scrollHeight, 120);
                this.style.height = newHeight + 'px';
            });
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

// 添加全局错误处理
window.onerror = function(msg, url, line, col, error) {
    console.error('Global error:', msg, 'at', url, 'line:', line);
    return false;
};

// 导出 ChatDialog 类
window.ChatDialog = ChatDialog;