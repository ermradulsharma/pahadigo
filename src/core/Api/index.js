import { getToken } from '@/app/utils/authUtils.js';
import { adminApi } from './admin.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

const fetcher = async (url, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };
    if (options.body instanceof FormData) delete headers['Content-Type'];
    const res = await fetch(url, { ...options, headers });

    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) data = await res.json();
    else if (contentType && contentType.includes('application/pdf')) data = await res.blob();
    else data = { message: RESPONSE_MESSAGES.ERROR.GENERIC };
    if (!res.ok) throw new Error(RESPONSE_MESSAGES.ERROR.GENERIC);
    return data;
};

const api = { admin: adminApi(fetcher) };
export default api;
