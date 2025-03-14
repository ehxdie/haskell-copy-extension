import * as rts from "./rts.mjs";
import module from "./copy-buffer.wasm.mjs";
import req from "./copy-buffer.req.mjs";
module.then(m => rts.newAsteriusInstance(Object.assign(req, {module: m}))).then(i => {
i.exports.main().catch(err => {if (!(err.startsWith('ExitSuccess') || err.startsWith('ExitFailure '))) i.fs.writeNonMemory(2, `CopyBuffer: ${err}
`)});
});
