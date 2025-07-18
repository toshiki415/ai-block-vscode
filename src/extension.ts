import * as vscode from 'vscode';

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

	public resolveWebviewView(
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

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// ウェブビューで実行されるメインスクリプトのローカルパスを取得し、ウェブビューで使用できる URI に変換します。

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>AI Preview</title>
			</head>
			<body>
				<h1>AIプレビュー</h1>
				<p>ここに結果が表示されます。</p>
			</body>
			</html>`;
	}
}