
import https from 'https';

const endpoint = 'https://sentinel.unweil.me';

console.log(`Pinging ${endpoint} to check server time...`);

https.get(endpoint, (res) => {
    const serverDateHeader = res.headers['date'];
    if (serverDateHeader) {
        const serverTime = new Date(serverDateHeader).getTime();
        const localTime = Date.now();
        const diff = serverTime - localTime;

        console.log(`Server Time: ${new Date(serverTime).toISOString()}`);
        console.log(`Local Time:  ${new Date(localTime).toISOString()}`);
        console.log(`Diff (ms):   ${diff}`);
        console.log(`Diff (min):  ${diff / 60000}`);

        console.log(`\nSuggested Offset Variable:`);
        console.log(`const SKEW_OFFSET_MS = ${diff};`);
    } else {
        console.log("No Date header found in response.");
        console.log("Headers:", res.headers);
    }
}).on('error', (e) => {
    console.error("Error:", e.message);
});
