/**
 * Dialog Component for AI Text Assistant
 * Created: 2025-02-22 06:34:23
 * Author: yuguomingcn
 */

class ChatDialog {
    constructor() {
        this.dialog = null;
        this.isVisible = false;
        this.isInitialized = false;  // 添加初始化状态标志
        console.log('ChatDialog initialized');
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
                this.isInitialized = true;  // 标记初始化完成
                this.addWelcomeMessage();
                console.log('Dialog initialization completed');
            } else {
                console.error('Failed to find .chat-container in loaded HTML');
            }
        } catch (error) {
            console.error('Error loading dialog HTML:', error);
        }
    }

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

        if (selectedText) {
            this.addMessage(selectedText, 'user');
            this.addMessage('您想对这段文字做什么？', 'ai');
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
        
        if (type === 'ai') {
            // 首先显示思考动画
            messageDiv.innerHTML = `
                <div class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
            // 等待思考动画显示 1.5 秒
            await new Promise(resolve => setTimeout(resolve, 1500));
    
            // 替换为实际消息内容
            messageDiv.innerHTML = `
                <div class="message-content typing-effect">
                    ${text.split('').map(char => `<span>${char}</span>`).join('')}
                </div>
                <div class="message-actions">
                    <button class="message-action-button refresh-button" title="刷新">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
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
                }, index * 50); // 每个字符之间间隔 50ms
            });
    
        } else {
            // 用户消息直接显示
            messageDiv.innerHTML = `
                <div class="message-content">${text}</div>
                <div class="message-actions">
                    <button class="message-action-button refresh-button" title="刷新">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                        </svg>
                    </button>
                    <button class="message-action-button copy-button" title="复制">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                </div>
            `;
        }
        
        if (type === 'user') {
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

    addWelcomeMessage() {
        if (this.isInitialized) {
            this.addMessage('有什么可以帮助你的吗？', 'ai');
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

    initializeEventListeners() {
        if (!this.dialog) {
            console.error('Dialog not created, cannot initialize event listeners');
            return;
        }

        const closeButton = this.dialog.querySelector('#close-chat');
        const sendButton = this.dialog.querySelector('#send-message');
        const input = this.dialog.querySelector('#user-input');

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

        // 防止事件冒泡
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