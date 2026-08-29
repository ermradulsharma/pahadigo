/**
 * IndexNow Protocol Helper
 * Notifies search engines (Bing, Yandex, Seznam) instantly when URLs are created or updated.
 */
export async function notifyIndexNow(urls = []) {
    if (!urls || urls.length === 0) return { success: false, message: 'No URLs provided' };

    const host = 'pahadigo.co.in';
    const key = process.env.INDEXNOW_KEY || 'pahadigo-indexnow-key-2026';
    const keyLocation = `https://${host}/${key}.txt`;

    const payload = {
        host,
        key,
        keyLocation,
        urlList: Array.isArray(urls) ? urls : [urls]
    };

    try {
        const response = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        return {
            success: response.status === 200 || response.status === 202,
            status: response.status,
            urls: payload.urlList
        };
    } catch (error) {
        return { success: false, error: error?.message || String(error) };
    }
}
