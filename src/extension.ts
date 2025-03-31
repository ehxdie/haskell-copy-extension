import * as vscode from 'vscode';
import * as path from 'path';

let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel('Haskell Copy Extension');
	outputChannel.show(true);
	outputChannel.appendLine('Starting extension activation...');

	try {
		// Dynamically import the modules from haskell-src folder
		// @ts-ignore
		const rts = await import('../haskell-src/rts.mjs');
		// @ts-ignore
		const wasmModule = await import('../haskell-src/copy-buffer.wasm.mjs');
		// @ts-ignore
		const req = await import('../haskell-src/copy-buffer.req.mjs');

		outputChannel.appendLine('Imported WebAssembly modules');

		// Initialize the Haskell runtime
		const module = await wasmModule.default;
		const instance = await rts.newAsteriusInstance(Object.assign(req.default, { module }));
		outputChannel.appendLine('WebAssembly module loaded successfully');

		// Command to append text to the buffer
		const appendDisposable = vscode.commands.registerCommand('haskell-copy-extension.appendToBuffer', async () => {
			const editor = vscode.window.activeTextEditor;
			outputChannel.appendLine('Append command triggered');

			if (editor) {
				const selection = editor.selection;
				const text = editor.document.getText(selection);

				if (text) {
					outputChannel.appendLine(`Appending text: ${text}`);

					// Convert JS string to C string and append to buffer
					const cString = await instance.exports.newCString(text);
					await instance.exports.appendToBuffer(cString);

					// Get buffer content
					const bufferPtr = await instance.exports.getBuffer();
					const bufferStr = await instance.exports.peekCString(bufferPtr);

					// Update clipboard
					await vscode.env.clipboard.writeText(bufferStr);

					outputChannel.appendLine('Text appended and clipboard updated');
					vscode.window.showInformationMessage('Text appended to buffer');
				}
			}
		});

		// Command to clear the buffer
		const clearDisposable = vscode.commands.registerCommand('haskell-copy-extension.clearBuffer', async () => {
			outputChannel.appendLine('Clear command triggered');
			await instance.exports.clearBuffer();
			await vscode.env.clipboard.writeText(''); // Clear the clipboard
			outputChannel.appendLine('Buffer cleared');
			vscode.window.showInformationMessage('Copy buffer cleared.');
		});

		// Command to display buffer content
		const getBufferDisposable = vscode.commands.registerCommand('haskell-copy-extension.getBuffer', async () => {
			outputChannel.appendLine('Get buffer command triggered');
			const bufferPtr = await instance.exports.getBuffer();
			const bufferStr = await instance.exports.peekCString(bufferPtr);

			// Create a new document with the buffer contents
			const document = await vscode.workspace.openTextDocument({
				content: bufferStr,
				language: 'text'
			});
			await vscode.window.showTextDocument(document);

			outputChannel.appendLine('Buffer content displayed');
		});

		// Register commands with the extension context
		context.subscriptions.push(appendDisposable, clearDisposable, getBufferDisposable, outputChannel);
		outputChannel.appendLine('Extension activated successfully');

	} catch (error:any) {
		outputChannel.appendLine(`Error during activation: ${error}`);
		console.error('Failed to initialize extension:', error);
		vscode.window.showErrorMessage(`Failed to initialize: ${error.message}`);
	}
}

export function deactivate() {
	// Clean up if necessary
	outputChannel.appendLine('Extension deactivated');
}