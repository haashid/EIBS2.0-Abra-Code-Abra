
const OriginalURL = globalThis.URL;
class PatchedURL extends OriginalURL {
    constructor(url, base) {
        console.log(`[Patch] new URL('${url}', '${base}')`);
        if (url === '/rest' && !base) {
            console.log("Fixing...");
            super(url, "https://sentinel.unweil.me");
            return;
        }
        super(url, base);
    }
}
globalThis.URL = PatchedURL;

try {
    const u = new URL('/rest');
    console.log("Success:", u.toString());
} catch (e) {
    console.error("Failed:", e.message);
}
