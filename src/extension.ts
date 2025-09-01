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

			// そして、拡張機能の `media` ディレクトリにあるコンテンツだけを読み込むようにウェブビューを制限する。
			localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

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

	private _getHtmlForWebview(webview: vscode.Webview) {
		// ウェブビューで実行されるメインスクリプトへのローカルパス
		const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');

		// そして、このスクリプトをウェブビューにロードするために使用する URI を指定します。
		const scriptUri = webview.asWebviewUri(scriptPath);

		// CSSスタイルへのローカルパス
		const stylesPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css');

		// スタイルをウェブビューにロードするための Uri
		const stylesUri = webview.asWebviewUri(stylesPath);

		// nonceを使用して、特定のスクリプトの実行のみを許可する。
    	const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="ja">
			<head>
				<meta charset="UTF-8">

				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesUri}" rel="stylesheet">

				<title>AI Preview</title>
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

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}