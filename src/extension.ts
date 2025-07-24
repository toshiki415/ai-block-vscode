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

		webviewView.webview.html = this._getHtmlForWebview('<h1>AIプレビュー</h1><p>AIが生成中です...</p>', '');

		try {
			const html = `
				<h2>ユーザープロフィール</h2>
				<p>名前: 石田隼基</p>
			`;

			const result = await ai_block("モダンなカードデザインにして", html);

			webviewView.webview.html = this._getHtmlForWebview(result.html, result.css);

		} catch (error) {
			console.error(error);
			webviewView.webview.html = this._getHtmlForWebview('<h1>エラー</h1><p>結果の生成に失敗しました。</p>', '');
		}
	}

	private _getHtmlForWebview(htmlContent: string, cssContent: string) {
		// ウェブビューで実行されるメインスクリプトのローカルパスを取得し、ウェブビューで使用できる URI に変換します。

		const escapeHtml = (unsafe: string) => {
			return unsafe
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#039;");
		};

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>AI Preview</title>
				<style>
					body {
						font-family: sans-serif;
						padding: 1rem;
					}
					.code-container {
						position: relative;
						margin-top: 0.5rem;
					}
					pre {
						font-family: monospace;
						background-color: #000000;
						padding: 1rem;
						border: 1px solid #ddd;
						border-radius: 4px;
						white-space: pre-wrap;
						word-break: break-all;
					}
					.copy-btn {
						position: absolute;
						top: 0.5rem;
						right: 0.5rem;
						padding: 4px 8px;
						font-size: 12px;
						cursor: pointer;
						border: 1px solid #ccc;
						border-radius: 4px;
						background-color: #e9e9e9;
					}
					.copy-btn:hover {
						background-color: #dcdcdc;
					}
				</style>
			</head>
			<body>
				<h2>html:</h2>
				<div class="code-container">
					<pre id="html-code">${escapeHtml(htmlContent)}</pre>
					<button class="copy-btn" data-target-id="html-code">コピー</button>
				</div>

				<h2>css:</h2>
				<div class="code-container">
					<pre id="css-code">${cssContent}</pre>
					<button class="copy-btn" data-target-id="css-code">コピー</button>
				</div>

				<script>
					const buttons = document.querySelectorAll('.copy-btn');

					buttons.forEach(button => {
						button.addEventListener('click', (e) => {
							// どのコードをコピーするかのIDを取得
							const targetId = e.currentTarget.getAttribute('data-target-id');
							const codeElement = document.getElementById(targetId);

							if (codeElement) {
								const textToCopy = codeElement.innerText;

								// クリップボードに書き込む
								navigator.clipboard.writeText(textToCopy).then(() => {
									// 成功したらボタンの文字を変更
									const originalText = e.currentTarget.textContent;
									e.currentTarget.textContent = 'コピーしました！';

									// 2秒後に元の文字に戻す
									setTimeout(() => {
										e.currentTarget.textContent = originalText;
									}, 2000);
								}).catch(err => {
									console.error('コピーに失敗しました', err);
								});
							}
						});
					});
				</script>
			</body>
			</html>`;
	}
}