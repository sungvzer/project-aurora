const lowerAlphabet = 'abcdefghijklmnopqrstuvwxyz';
const upperAlphabet = lowerAlphabet.toUpperCase();
const numbers = '0123456789';

export interface RandomStringOptions {
    lowerCase?: boolean;
    upperCase?: boolean;
    withNumbers?: boolean;
    additionalCharacters?: string;
}

export default (
    length = 16,
    options: RandomStringOptions = {
        lowerCase: true,
        upperCase: false,
        withNumbers: true,
        additionalCharacters: '',
    },
): string => {
    let str = '';
    let index: number;
    let alphabet = '';
    if (options.lowerCase) {
        alphabet += lowerAlphabet;
    }
    if (options.upperCase) {
        alphabet += upperAlphabet;
    }
    if (options.withNumbers) {
        alphabet += numbers;
    }
    if (options.additionalCharacters) {
        alphabet += options.additionalCharacters;
    }

    for (let i = 0; i < length; i++) {
        index = Math.random() * alphabet.length;
        index = Math.floor(index);
        str += alphabet.charAt(index);
    }
    return str;
};
