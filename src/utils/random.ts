const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

export default (length = 16): string => {
    let str = '';
    let index: number;
    for (let i = 0; i < length; i++) {
        index = Math.random() * alphabet.length;
        index = Math.floor(index);
        str += alphabet.charAt(index);
    }
    return str;
};
