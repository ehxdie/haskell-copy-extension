import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wasmPath = path.join(__dirname, 'copy-buffer.wasm');

export default fs.promises.readFile(wasmPath)
    .then(buffer => WebAssembly.compile(buffer));
