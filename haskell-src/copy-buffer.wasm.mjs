import fs from "fs";
export default fs.promises.readFile("copy-buffer.wasm").then(bufferSource => WebAssembly.compile(bufferSource));
