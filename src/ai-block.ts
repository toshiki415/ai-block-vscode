import { GoogleGenerativeAI } from '@google/generative-ai';
import * as vscode from 'vscode';

type GeneratedCode = {
    html: string;
    css: string;
}

export async function ai_block(
    prompt: string,
    targetHtml: string
) : Promise<GeneratedCode> {
     // VS Codeの設定からAPIキーを取得
    const config = vscode.workspace.getConfiguration('aiblock');
    const apikey = config.get<string>('geminiApiKey');

    if (!apikey) {
        // APIキーが設定されていない場合、ユーザーに設定を促すエラーメッセージを表示
        vscode.window.showErrorMessage(
            'Gemini APIキーが設定されていません。VSCodeの設定で "aiblock.geminiApiKey" を設定してください。'
        );
        throw new Error("APIキーが設定されていません。");
    }

    const genAI = new GoogleGenerativeAI(apikey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const fullPrompt = `
        あなたはプロのフロントエンジニアです。
        ユーザーから渡されたHTMLと、変更の指示を受け取ります。
        その指示に従って、HTMLと、そのHTMLを装飾するためのCSSコードを生成してください。

        以下のルールに厳密に従ってください
        - 回答は必ずJSON形式でなければなりません。
        - JSONオブジェクトは 'html' と 'css' の2つのキーを持つ必要があります。
        - 'html' の値は変更後のHTMLコード（文字列）です。
        - 'css' の値は生成されたCSSコード（文字列）です。
        - JSONを囲む\`\`\`jsonや\`\`\`のようなMarkdownのコードブロック識別子を絶対に含めないでください。
        - 回答には純粋なJSONオブジェクトのみとしてください。説明や他のテキストは一切不要です。

        ユーザーからの指示: ${prompt}
        対象のHTML: ${targetHtml}
    `;

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();
    console.log('API Raw Response:', responseText); // デバッグ用に生の応答をログに出力

    try {
        // 応答からJSONオブジェクトの部分だけを正規表現で抽出
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('APIの応答にJSONオブジェクトが見つかりませんでした。');
        }

        const jsonString = jsonMatch[0];
        const parsedResponse = JSON.parse(jsonString);

        return parsedResponse as GeneratedCode;

    } catch (error) {
        console.error('JSONの解析に失敗しました。', error);
        console.error('失敗した応答テキスト:', responseText); // 解析に失敗した文字列をログに出力
        // エラーを再スローして、extension.tsのcatchブロックで処理できるようにする
        throw new Error('APIからの応答をJSONとして解析できませんでした。');
    }
}