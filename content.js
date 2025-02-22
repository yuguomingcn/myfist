/**
 * Content Script for Text Processing Assistant
 * Last Updated: 2025-02-21 07:07:58
 * Author: yuguomingcn
 */
let chatDialog = null;

// 创建功能按钮容器
function createActionButtons() {
    const container = document.createElement('div');
    container.id = 'action-buttons-container';
    container.style.display = 'none';
    container.innerHTML = `
        <button class="action-button" data-action="ask" title="询问AI">询问AI</button>
        <button class="action-button" data-action="translate" title="翻译">翻译</button>
        <button class="action-button" data-action="summarize" title="归纳要点">归纳要点</button>
        <button class="action-button" data-action="rewrite" title="改写">改写</button>
        <button class="action-button" data-action="expand" title="扩写">扩写</button>
        <button class="action-button" data-action="shorten" title="缩写">缩写</button>
        <button class="action-button" data-action="grammar" title="语法检查">语法检查</button>
    `;
    document.body.appendChild(container);
    return container;
}
// 显示功能按钮
function showActionButtons(selectedText, mouseEvent) {
    const container = document.getElementById('action-buttons-container') || createActionButtons();
    
    // 仅当按钮容器不可见时更新位置
    if (container.style.display === 'none') {
        container.style.position = 'fixed';
        container.style.left = `${mouseEvent.clientX}px`;
        container.style.top = `${mouseEvent.clientY}px`;

        // 确保按钮容器在视口内
        const containerRect = container.getBoundingClientRect();
        if (containerRect.right > window.innerWidth) {
            container.style.left = `${window.innerWidth - containerRect.width - 20}px`;
        }
        if (containerRect.bottom > window.innerHeight) {
            container.style.top = `${window.innerHeight - containerRect.height - 20}px`;
        }
    }
    
    container.style.display = 'flex';

    // 为每个按钮添加点击事件
    container.querySelectorAll('.action-button').forEach(button => {
        button.onclick = (event) => {
            event.stopPropagation();
            event.preventDefault();
            const action = button.dataset.action;
            const currentText = window.getSelection().toString().trim();
            handleAction(action, currentText, container);
        };
    });

    // 防止按钮容器的点击事件冒泡
    container.addEventListener('mousedown', (event) => {
        event.stopPropagation();
        event.preventDefault();
    });
}

// 处理不同的动作
async function handleAction(action, text, buttonContainer) {
    let prompt = '';
    let title = '';
    let result = '';

    switch (action) {
        case 'ask':
            if (!chatDialog) {
                chatDialog = new ChatDialog();
            }
            chatDialog.show(text);
            return; // 直接返回，不显示弹窗
        case 'translate':
            prompt = `请将以下文本翻译成中文：\n${text}`;
            title = '翻译结果';
            result = `[翻译响应示例]\n${text}`;
            break;
        case 'summarize':
            prompt = `请归纳以下内容的要点：\n${text}`;
            title = '内容要点';
            result = `[要点归纳示例]\n${text}`;
            break;
        case 'rewrite':
            prompt = `请改写以下文本，保持意思不变：\n${text}`;
            title = '改写结果';
            result = `[改写示例]\n${text}`;
            break;
        case 'expand':
            prompt = `请扩写以下内容，增加细节和说明：\n${text}`;
            title = '扩写结果';
            result = `[扩写示例]\n${text}`;
            break;
        case 'shorten':
            prompt = `请将以下内容缩写，保持核心意思：\n${text}`;
            title = '缩写结果';
            result = `[缩写示例]\n${text}`;
            break;
        case 'grammar':
            prompt = `请检查以下文本的语法，并给出修改建议：\n${text}`;
            title = '语法检查';
            result = `[语法检查示例]\n${text}`;
            break;
    }

    const existingPopup = document.getElementById('result-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    showResultPopup(result, title, text, buttonContainer);
}

// 显示结果弹窗
function showResultPopup(result, title = '结果', originalText, buttonContainer) {
    const popup = document.createElement('div');
    popup.id = 'result-popup';
    
    // 设置弹窗内容不可选择，但保持输入控件可交互
    popup.style.cssText = `
        user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        /* 确保弹窗总是显示在最上层 */
        z-index: 2147483647;
    `;
    
    const content = `
        <div class="popup-header">
            ${title}
        </div>
        <div class="popup-content">
            <div class="result-text">${result}</div>
        </div>
        <div class="popup-bottom">
            <div class="popup-bottom-left">
                ${title === '翻译结果' ? `
                    <div class="select-wrapper" style="
                        position: relative;
                        display: inline-block;
                    ">
                        <select class="language-select" style="
                            appearance: none;
                            -webkit-appearance: none;
                            -moz-appearance: none;
                            padding: 5px 24px 5px 10px;
                            border: 1px solid #ccc;
                            border-radius: 4px;
                            background: #fff;
                            cursor: pointer;
                            font-size: 14px;
                            color: #333;
                            min-width: 120px;
                            /* 重要：覆盖可能的外部样式 */
                            position: relative;
                            z-index: 2147483647;
                            box-sizing: border-box;
                            margin: 0;
                            height: auto;
                            line-height: 1.5;
                        ">
                            <option value="en" style="
                                background: #fff;
                                color: #333;
                                font-size: 14px;
                                padding: 5px;
                            ">English</option>
                            <option value="zh" style="
                                background: #fff;
                                color: #333;
                                font-size: 14px;
                                padding: 5px;
                            ">简体中文</option>
                        </select>
                        <div style="
                            content: '';
                            position: absolute;
                            right: 8px;
                            top: 50%;
                            transform: translateY(-50%);
                            width: 0;
                            height: 0;
                            border-left: 5px solid transparent;
                            border-right: 5px solid transparent;
                            border-top: 5px solid #333;
                            pointer-events: none;
                        "></div>
                    </div>
                ` : ''}
                <div class="icon-group">
                    <button class="icon-button" title="重新生成">
                        <i class="fas fa-arrows-rotate"></i>
                    </button>
                    <button class="icon-button" title="复制内容">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="popup-bottom-right">
                <button class="continue-button">继续询问</button>
            </div>
        </div>
    `;
    
    popup.innerHTML = content;
    document.body.appendChild(popup);

    // 设置弹窗位置（固定在按钮下方）
    const buttonRect = buttonContainer.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.left = `${buttonRect.left}px`;
    popup.style.top = `${buttonRect.bottom + 10}px`;

    // 视口边界检查
    const popupRect = popup.getBoundingClientRect();
    if (popupRect.right > window.innerWidth) {
        popup.style.left = `${window.innerWidth - popupRect.width - 20}px`;
    }
    if (popupRect.bottom > window.innerHeight) {
        popup.style.top = `${buttonRect.top - popupRect.height - 10}px`;
    }

    // 单独处理下拉菜单的点击事件
    const languageSelect = popup.querySelector('.language-select');
    if (languageSelect) {
        // 允许下拉菜单交互
        languageSelect.style.userSelect = 'text';
        languageSelect.style.webkitUserSelect = 'text';
        languageSelect.style.msUserSelect = 'text';
        
        // 防止下拉菜单点击事件冒泡，但允许正常交互
        languageSelect.addEventListener('mousedown', (event) => {
            event.stopPropagation();
        });
        
        // 监听选择变化
        languageSelect.addEventListener('change', (event) => {
            event.stopPropagation();
            console.log('语言切换为：', event.target.value);
            // 这里可以添加语言切换的处理逻辑
        });
    }

    // 防止弹窗的点击事件冒泡，但允许下拉菜单正常工作
    popup.addEventListener('mousedown', (event) => {
        if (!event.target.closest('select')) {
            event.stopPropagation();
            event.preventDefault();
        }
    });

    // 复制按钮功能
    const copyButton = popup.querySelector('.icon-button[title="复制内容"]');
    if (copyButton) {
        copyButton.onclick = function(event) {
            event.stopPropagation();
            event.preventDefault();
            const resultText = popup.querySelector('.result-text').textContent;
            navigator.clipboard.writeText(resultText).then(() => {
                console.log('内容已复制到剪贴板');
            });
        };
    }

    // 重新生成按钮功能
    const regenerateButton = popup.querySelector('.icon-button[title="重新生成"]');
    if (regenerateButton) {
        regenerateButton.onclick = function(event) {
            event.stopPropagation();
            event.preventDefault();
            const icon = this.querySelector('i');
            icon.classList.add('fa-spin');
            setTimeout(() => icon.classList.remove('fa-spin'), 2000);
        };
    }

    // 继续询问按钮功能
    const continueButton = popup.querySelector('.continue-button');
    if (continueButton) {
        continueButton.onclick = function(event) {
            event.stopPropagation();
            event.preventDefault();
            console.log('继续询问');
        };
    }
}

// 监听文档点击事件 - 同时处理弹窗和功能按钮的隐藏
document.addEventListener('mousedown', (event) => {
    const popup = document.getElementById('result-popup');
    const container = document.getElementById('action-buttons-container');
    
    // 如果点击位置不在弹窗或功能按钮区域内
    if (!event.target.closest('#result-popup') && 
        !event.target.closest('#action-buttons-container')) {
        // 同时隐藏弹窗和功能按钮
        if (popup) popup.remove();
        if (container) container.style.display = 'none';
    }
});

// 监听选择文本事件
document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    
    if (selectedText) {
        showActionButtons(selectedText, e);
    }
});

// 阻止右键菜单
document.addEventListener('contextmenu', (e) => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    if (selectedText) {
        e.preventDefault();
    }
});

// 监听来自扩展图标的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleDialog") {
        if (!chatDialog) {
            chatDialog = new ChatDialog();
        }
        chatDialog.toggle();
    }
});