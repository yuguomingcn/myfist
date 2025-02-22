/**
 * Dialog Component for AI Text Assistant
 * Created: 2025-02-22 06:34:23
 * Author: yuguomingcn
 */

class ChatDialog {
    constructor() {
        this.dialog = null;
        this.isVisible = false;
        console.log('ChatDialog initialized');
    }

    create() {
        console.log('Creating dialog...');
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

        // 加载外部HTML
        fetch(chrome.runtime.getURL('dialog.html'))
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const content = doc.querySelector('.chat-container');
                this.dialog.appendChild(content);
                this.initializeEventListeners();
                this.addWelcomeMessage();
            })
            .catch(error => {
                console.error('Error loading dialog HTML:', error);
            });

        document.body.appendChild(this.dialog);
    }

    show(selectedText = '') {
        if (!this.dialog) {
            this.create();
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

    addMessage(text, type) {
        const messagesContainer = this.dialog.querySelector('#chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const now = new Date();
        const time = now.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">${text}</div>
            <div class="message-time">${time}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addWelcomeMessage() {
        this.addMessage('有什么可以帮助你的吗？', 'ai');
    }

    showTypingIndicator() {
        const messagesContainer = this.dialog.querySelector('#chat-messages');
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
        const closeButton = this.dialog.querySelector('#close-chat');
        const sendButton = this.dialog.querySelector('#send-message');
        const input = this.dialog.querySelector('#user-input');

        closeButton.addEventListener('click', () => this.hide());

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
        const input = this.dialog.querySelector('#user-input');
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

window.onerror = function(msg, url, line, col, error) {
    console.error('Global error:', msg, 'at', url, 'line:', line);
    return false;
};

window.ChatDialog = ChatDialog;