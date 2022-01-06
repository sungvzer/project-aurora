import { CustomSanitizer, CustomValidator } from 'express-validator';
import validator from 'validator';
import Type from './typeof';

function editResourceAttribute(toChange: object, attribute: string, value: unknown): object {
    if (!Object.prototype.hasOwnProperty.call(toChange, 'attributes')) return;
    const returned = { ...toChange };
    returned['attributes'] = { ...toChange['attributes'] };
    returned['attributes'][attribute] = value;
    return returned;
}

export const resourceObjectHas = (str: string): CustomValidator => {
    return (input) => input['attributes'][str] != null;
};

export const resourceObjectValidateEmail = (input: unknown): boolean => {
    if (input['attributes']['email']) {
        const email = input['attributes']['email'];
        return validator.isEmail(email);
    }
    return false;
};

export const dataIsArray = (input: unknown): boolean => {
    return Array.isArray(input);
};

export const dataHas = (str: string): CustomValidator => {
    return (input) => input[str];
};

/**
 * This function does not validate if email is present or not, please check with `jwtObjectHas` and `jwtObjectValidateEmail`
 */
export const resourceObjectSanitizeEmail: CustomSanitizer = (input): object => {
    if (!input || !input['attributes'] || !input['attributes']['email']) {
        return null;
    }
    let email = input['attributes']['email'];
    email = validator.normalizeEmail(email, {
        gmail_remove_dots: false,
        all_lowercase: true,
    });
    const returnedObject = editResourceAttribute(input, 'email', email);

    return returnedObject;
};

export const isValidResourceObject = (input: object) => {
    const checkInput = (input: object): boolean => {
        const allowedResourceKeys = ['id', 'type', 'attributes', 'relationships', 'links', 'meta'];

        if (!input) {
            return false;
        }

        if (!input['id'] && !input['type']) {
            return false;
        }
        for (let prop in input) {
            prop = prop.toLowerCase();
            if (allowedResourceKeys.indexOf(prop) === -1) {
                return false;
            }
        }
        return true;
    };

    if (Array.isArray(input)) {
        for (const member of input) {
            if (!checkInput(member)) {
                return false;
            }
        }
        return true;
    } else {
        return checkInput(input);
    }
};

export const resourceObjectAttributeIs = (attribute: string, type: Type): CustomValidator => {
    return (input) => {
        return typeof input['attributes'][attribute] === type;
    };
};
