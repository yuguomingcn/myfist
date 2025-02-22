// 获取扩展的 URL
const extensionUrl = chrome.runtime.getURL('');

// 创建并注入字体样式
const style = document.createElement('style');
style.textContent = `
@font-face {
    font-family: 'Font Awesome 6 Free';
    font-style: normal;
    font-weight: 900;
    font-display: block;
    src: url('${extensionUrl}fonts/webfonts/fa-solid-900.woff2') format('woff2');
}

.fas {
    font-family: 'Font Awesome 6 Free';
    font-weight: 900;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    display: inline-block;
    font-style: normal;
    font-variant: normal;
    line-height: 1;
    text-rendering: auto;
}

.fa-arrows-rotate:before {
    content: "\\f021";
}

.fa-copy:before {
    content: "\\f0c5";
}

/* 添加旋转动画效果（可选） */
@keyframes fa-spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.fa-spin {
    animation: fa-spin 2s linear infinite;
}
`;

document.head.appendChild(style);