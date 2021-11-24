import { CustomSanitizer, Meta } from 'express-validator';
import validator from 'validator';

function editJwtObjectAttribute(object: any, attribute: string, value: any): object {
    let returned = { ...object };
    returned["attributes"] = { ...object.attributes };
    returned["attributes"][attribute] = value;
    return returned;;
}

export interface Validators<Return> {
    jwtEmail(): Return,
};

export const jwtObjectHasEmail = (input: any, meta: Meta): any => {
    return input["attributes"]["email"];
};


export const jwtObjectHasPassword = (input: any, meta: Meta): any => {
    return input["attributes"]["password"];
};

export const jwtObjectHasValidEmail = (input: any, meta: Meta): any => {
    if (input["attributes"]["email"]) {
        const email = input["attributes"]["email"];
        return validator.isEmail(email);
    }
};

export const jwtObjectSanitizeEmail: CustomSanitizer = (input, meta): any => {
    let email = input["attributes"]["email"];
    email = validator.normalizeEmail(email, { gmail_remove_dots: false, all_lowercase: true });
    let returnedObject = editJwtObjectAttribute(input, "email", email);

    return returnedObject;
};
