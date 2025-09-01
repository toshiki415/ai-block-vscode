// このスクリプトはウェブビュー内で実行されます。
// メインの VS Code API には直接アクセスできません。

(function () {
    const vscode = acquireVsCodeApi();

    const oldState = /** @type {{ html?: string, prompt?: string }} */ (vscode.getState()) || {};

    const generateBtn = /** @type {HTMLButtonElement} */ (document.getElementById('generate-btn'));
    const htmlInput = /** @type {HTMLTextAreaElement} */ (document.getElementById('html-input'));
    const promptInput = /** @type {HTMLInputElement} */ (document.getElementById('prompt-input'));
    
    const loadingIndicator = /** @type {HTMLElement} */ (document.getElementById('loading-indicator'));
    const resultContainer = /** @type {HTMLElement} */ (document.getElementById('result-container'));
    const errorContainer = /** @type {HTMLElement} */ (document.getElementById('error-container'));

    const htmlResult = /** @type {HTMLElement} */ (document.getElementById('html-result'));
    const cssResult = /** @type {HTMLElement} */ (document.getElementById('css-result'));
    const errorMessage = /** @type {HTMLElement} */ (document.getElementById('error-message'));

    htmlInput.value = oldState.html || '';
    promptInput.value = oldState.prompt || '';

    function saveState() {
        // 状態を更新する
        vscode.setState({
            html: htmlInput.value,
            prompt: promptInput.value
        });
    }

    htmlInput.addEventListener('input', saveState);
    promptInput.addEventListener('input', saveState);

    generateBtn.addEventListener('click', () => {
        const html = htmlInput.value;
        const prompt = promptInput.value;

        if (!html || !prompt) {
            return;
        }

        // 拡張機能本体にメッセージを送信
        vscode.postMessage({
            command: 'generate',
            html: html,
            prompt: prompt
        });
    });

    // エクステンションからウェブビューに送信されるメッセージの処理
    window.addEventListener('message', event => {
        const message = event.data; // 拡張機能が送信した json データ

        loadingIndicator.classList.add('hidden');
        resultContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');

        switch (message.command) {
            case 'showLoading':
                loadingIndicator.classList.remove('hidden');
                break;
            case 'showResult':
                htmlResult.textContent = message.html;
                cssResult.textContent = message.css;
                resultContainer.classList.remove('hidden');
                break;
            case 'showError':
                errorMessage.textContent = message.message;
                errorContainer.classList.remove('hidden');
                break;
        }
    });
}());