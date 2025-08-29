import * as vscode from 'vscode';
import { ai_block } from "./ai-block";

export function activate(context: vscode.ExtensionContext) {

	const provider = new AiBlockViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(AiBlockViewProvider.viewType, provider));
	}

class AiBlockViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'aiblock.preview';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public async resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// ウェブビューでスクリプトを許可する
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview();

		webviewView.webview.onDidReceiveMessage(async (message) => {
			switch (message.command) {
				case 'generate':
					try {
						this._view?.webview.postMessage({ command: 'showLoading' });
						const result = await ai_block(message.prompt, message.html);
						this._view?.webview.postMessage({ command: 'showResult', html: result.html, css: result.css });
					} catch(error) {
						console.error(error);
						this._view?.webview.postMessage({ command: 'showError', message: '結果の生成に失敗しました。' });
					}
					return;
			}
		});
	}

	private _getHtmlForWebview() {
		const scriptUri = this._view?.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		return `<!DOCTYPE html>
			<html lang="ja">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>AI Preview</title>
				<style>
					body {
                        font-family: sans-serif;
                        padding: 1rem;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    textarea, input {
                        width: 100%;
                        padding: 8px;
                        margin-bottom: 10px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        box-sizing: border-box; /* paddingを含めてwidth 100%にする */
                    }
                    textarea {
                        height: 150px;
                        resize: vertical;
                    }
                    button {
                        width: 100%;
                        padding: 10px;
                        border: none;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                        margin-bottom: 20px;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .result-container {
                        margin-top: 1rem;
                    }
                    pre {
                        background-color: var(--vscode-textBlockQuote-background);
                        padding: 1rem;
                        border: 1px solid var(--vscode-textBlockQuote-border);
                        border-radius: 4px;
                        white-space: pre-wrap;
                        word-break: break-all;
                    }
                    .hidden {
                        display: none;
                    }
				</style>
			</head>
			<body>
				<h2>変換したいHTML</h2>
				<textarea id="html-input" placeholder="ここにHTMLコードを貼り付け"></textarea>

				<h2>AIへの指示</h2>
				<input type="text" id="prompt-input" placeholder="例：モダンなカードデザインにして">

				<button id="generate-btn">AIで生成する</button>

				<div id="loading-indicator" class="hidden">
					<p>AIが生成中です...</p>
				</div>

				<div id="result-container" class="hidden">
					<h2>HTML Result:</h2>
					<pre id="html-result"></pre>

					<h2>CSS Result:</h2>
					<pre id="css-result"></pre>
				</div>

				<div id="error-container" class="hidden">
					<h2>エラー</h2>
					<p id="error-message"></p>
				</div>

				<script>
					(function() {
						const vscode = acquireVsCodeApi();

						const generateBtn = document.getElementById('generate-btn');
						const htmlInput = document.getElementById('html-input');
						const promptInput = document.getElementById('prompt-input');

						const loadingIndicator = document.getElementById('loading-indicator');
						const resultContainer = document.getElementById('result-container');
						const errorContainer = document.getElementById('error-container');

						const htmlResult = document.getElementById('html-result');
						const cssResult = document.getElementById('css-result');
						const errorMessage = document.getElementById('error-message');

						generateBtn.addEventListener('click', () => {
							const html = htmlInput.value;
							const prompt = promptInput.value;

							if (!html || !prompt) {
								return;
							}

							vscode.postMessage({
								command: 'generate',
								html: html,
								prompt: prompt
							});
						});

						window.addEventListener('message', event => {
							const message = event.data;

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
				</script>
			</body>
			</html>`;
	}
}