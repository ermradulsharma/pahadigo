const createChalkMock = () => {
    const fn = (...args) => args.join(' ');
    const proxy = new Proxy(fn, {
        get(target, prop) {
            if (prop === 'level') return 0;
            if (prop === 'supportsColor') return false;
            if (prop === 'default') return proxy;
            if (typeof prop === 'symbol' || prop === 'then' || prop === 'catch') {
                return Reflect.get(target, prop);
            }
            return proxy;
        },
        apply(target, thisArg, args) {
            return args.join(' ');
        }
    });
    return proxy;
};

const chalkMock = createChalkMock();

export default chalkMock;
export const chalkStderr = chalkMock;
export const supportsColor = false;
export const supportsColorStderr = false;
