declare module 'copy-buffer.mjs' {
    interface Exports {
        appendToBuffer: (cstr: string) => void;
        getBuffer: () => string;
        clearBuffer: () => void;
    }
    const load: () => Promise<{ instance: { exports: Exports } }>;
    export { load };
}