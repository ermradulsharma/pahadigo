import Cookies from 'js-cookie';

export const getToken = () => {
    if (typeof window === 'undefined') return null;
    return Cookies.get('token');
};

export const getRole = () => {
    if (typeof window === 'undefined') return null;
    return Cookies.get('role');
};

export const setToken = (token, role, rememberMe = false) => {
    if (typeof window === 'undefined') return;

    const options = {
        secure: window.location.protocol === 'https:',
        sameSite: 'strict',
        expires: rememberMe ? 30 : undefined // 30 days or session
    };

    Cookies.set('token', token, options);
    Cookies.set('role', role, options);
};

export const removeToken = () => {
    if (typeof window === 'undefined') return;
    Cookies.remove('token');
    Cookies.remove('role');
};

export default { getToken, getRole, setToken, removeToken };
