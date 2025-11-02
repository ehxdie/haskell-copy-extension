import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

const originalWASI = require("wasi").WASI;
require("wasi").WASI = function (options: any) {
  if (!options.version) {
    options.version = "preview1";
  }
  return new originalWASI(options);
};

let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("Haskell Copy Extension");
  outputChannel.show(true);
  outputChannel.appendLine("Starting extension activation...");

  try {
    const extensionPath = context.extensionPath;
    const wasmPath = path.join(
      extensionPath,
      "haskell-src",
      "copy-buffer.wasm"
    );
    const reqPath = path.join(
      extensionPath,
      "haskell-src",
      "copy-buffer.req.mjs"
    );
    const rtsPath = path.join(extensionPath, "haskell-src", "rts.mjs");

    // sanity check
    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WASM file not found at ${wasmPath}`);
    }

    const wasmBuffer: Buffer = fs.readFileSync(wasmPath);

    // Convert Buffer to a Uint8Array (ArrayBufferView), so it's valid as BufferSource
    // const wasmUint8 = new Uint8Array(
    //   wasmBinary.buffer,
    //   wasmBinary.byteOffset,
    //   wasmBinary.byteLength
    // );

    // Extract a proper ArrayBuffer
    const arrayBuffer = wasmBuffer.buffer.slice(
      wasmBuffer.byteOffset,
      wasmBuffer.byteOffset + wasmBuffer.byteLength
    ) as ArrayBuffer;

    const rts = await import(rtsPath);
    const req = await import(reqPath);

    // patch in the compiled module
    req.default.module = await WebAssembly.compile(arrayBuffer);

    req.default.wasiOptions = req.default.wasiOptions || {
      version: "preview1",
      args: [],
      env: {},
      preopens: {},
    };

    const instance = await rts.newAsteriusInstance(req.default);
    outputChannel.appendLine(
      "WASM module loaded; exports: " + Object.keys(instance.exports).join(", ")
    );

    // this in‑memory JS buffer is our fallback if Haskell string‑conversion exports are missing
    let jsBuffer = "";

    // helper to decode a C‑string from wasm memory
    function decodeCString(ptr: number): string {
      const mem = new Uint8Array(
        (instance.exports.memory as WebAssembly.Memory).buffer
      );
      let end = ptr;
      while (mem[end] !== 0) end++;
      return new TextDecoder().decode(mem.subarray(ptr, end));
    }

    // ⬇️ Append Command
    const appendDisposable = vscode.commands.registerCommand(
      "haskell-copy-extension.appendToBuffer",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const text = editor.document.getText(editor.selection);
        if (!text) return;

        outputChannel.appendLine(`Appending: ${text}`);
        try {
          // only call into Haskell if both newCString & appendToBuffer exist
          if (
            typeof instance.exports.newCString === "function" &&
            typeof instance.exports.appendToBuffer === "function"
          ) {
            // allocate & write the text into wasm memory
            const cstrPtr = await instance.exports.newCString!(text);
            await instance.exports.appendToBuffer!(cstrPtr);

            // read it back into jsBuffer
            if (typeof instance.exports.getBuffer === "function") {
              const bufPtr = await instance.exports.getBuffer!();
              // prefer peekCString if available
              if (typeof instance.exports.peekCString === "function") {
                jsBuffer = await instance.exports.peekCString!(bufPtr);
              } else {
                jsBuffer = decodeCString(bufPtr);
              }
            }
          } else {
            outputChannel.appendLine(
              "Haskell string FFI not available; using JS fallback"
            );
            jsBuffer = jsBuffer ? `${jsBuffer}\n${text}` : text;
          }

          await vscode.env.clipboard.writeText(jsBuffer);
          vscode.window.showInformationMessage("Text appended to buffer");
          outputChannel.appendLine("Append successful");
        } catch (e: any) {
          outputChannel.appendLine("Error in append operation: " + e.message);
          // last‑ditch fallback
          jsBuffer = jsBuffer ? `${jsBuffer}\n${text}` : text;
          await vscode.env.clipboard.writeText(jsBuffer);
          vscode.window.showErrorMessage("Append failed, used JS fallback");
        }
      }
    );

    // ⬇️ Clear Command
    const clearDisposable = vscode.commands.registerCommand(
      "haskell-copy-extension.clearBuffer",
      async () => {
        outputChannel.appendLine("Clearing buffer");
        try {
          if (typeof instance.exports.clearBuffer === "function") {
            await instance.exports.clearBuffer!();
          }
          jsBuffer = "";
          await vscode.env.clipboard.writeText(" ");
          vscode.window.showInformationMessage("Copy buffer cleared");
        } catch (e: any) {
          outputChannel.appendLine(
            "Error clearing Haskell buffer: " + e.message
          );
          jsBuffer = "";
          await vscode.env.clipboard.writeText(" ");
          vscode.window.showErrorMessage("Clear failed, JS fallback used");
        }
      }
    );

    // ⬇️ Get Buffer Command
    const getDisposable = vscode.commands.registerCommand(
      "haskell-copy-extension.getBuffer",
      async () => {
        outputChannel.appendLine("Displaying buffer");
        try {
          let content: string;
          if (typeof instance.exports.getBuffer === "function") {
            const bufPtr = await instance.exports.getBuffer!();
            if (typeof instance.exports.peekCString === "function") {
              content = await instance.exports.peekCString!(bufPtr);
            } else {
              content = decodeCString(bufPtr);
            }
          } else {
            content = jsBuffer;
          }
          const doc = await vscode.workspace.openTextDocument({
            content,
            language: "text",
          });
          await vscode.window.showTextDocument(doc);
        } catch (e: any) {
          outputChannel.appendLine("Error getting buffer: " + e.message);
          const doc = await vscode.workspace.openTextDocument({
            content: jsBuffer,
            language: "text",
          });
          await vscode.window.showTextDocument(doc);
          vscode.window.showErrorMessage(
            "Failed to get buffer, JS fallback used"
          );
        }
      }
    );

    context.subscriptions.push(
      appendDisposable,
      clearDisposable,
      getDisposable,
      outputChannel
    );
    outputChannel.appendLine("Extension activated");
  } catch (e: any) {
    outputChannel.appendLine("Activation error: " + e.stack || e.message);
    vscode.window.showErrorMessage(
      "Extension failed to activate: " + e.message
    );
  }
}

export function deactivate() {
  if (outputChannel) {
    outputChannel.appendLine("Extension deactivated");
  }
}
