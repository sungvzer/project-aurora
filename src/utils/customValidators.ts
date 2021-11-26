import { CustomSanitizer, Meta, CustomValidator } from 'express-validator';
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

export const jwtObjectHas = (str: string): CustomValidator => {
    return (input, meta) => input["attributes"][str];
};

export const jwtObjectValidateEmail = (input: any, meta: Meta): any => {
    if (input["attributes"]["email"]) {
        const email = input["attributes"]["email"];
        return validator.isEmail(email);
    }
};

/** 
 * This function does not validate if email is present or not, please check with `jwtObjectHas` and `jwtObjectValidateEmail`
 */
export const jwtObjectSanitizeEmail: CustomSanitizer = (input, meta): any => {
    if (!input || !input["attributes"] || !input["attributes"]["email"]) {
        return null;
    }
    let email = input["attributes"]["email"];
    email = validator.normalizeEmail(email, { gmail_remove_dots: false, all_lowercase: true });
    let returnedObject = editJwtObjectAttribute(input, "email", email);

    return returnedObject;
};
