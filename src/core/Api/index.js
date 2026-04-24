import { getToken } from '@/core/Helpers/authUtils';
import { adminApi } from './admin';

const fetcher = async (url, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Something went wrong');
    return data;
};

const api = {
    admin: adminApi(fetcher)
};

export default api;
