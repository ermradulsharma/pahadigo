export default async function () {
    if (globalThis.__MONGOINSTANCE) {
        await globalThis.__MONGOINSTANCE.stop();
    }
}
