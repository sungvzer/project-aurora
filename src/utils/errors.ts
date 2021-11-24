import { Error } from './jsonAPI';

export const wrongCredentials: Error = {
    code: "ERR_WRONG_CREDENTIALS",
    detail: `A wrong email or password were used. I'm not gonna tell you which though.`,
    status: "400",
    title: "Wrong email or password"
};
export const invalidAuthTokenError: Error = {
    code: "ERR_INVALID_AUTH_TOKEN",
    detail: "The authorization token provided with this request is not valid",
    status: "400",
    title: "Invalid Authorization Token"
};
export const invalidRefreshTokenError: Error = {
    code: "ERR_INVALID_REFRESH_TOKEN",
    detail: "The refresh token provided with this request is not valid",
    status: "403",
    title: "Invalid Refresh Token"
};

export const expiredAuthTokenError: Error = {
    code: "ERR_EXPIRED_AUTH_TOKEN",
    detail: "The authorization token provided with this request is expired",
    status: "400",
    title: "Expired Authorization Token"
};

export const genericJWTError: Error = {
    code: "ERR_GENERIC_JWT",
    detail: "Something went wrong processing your token. Please try logging in again.",
    status: "400",
    title: "Generic JWT Error"
};

export const missingAuthorizationError: Error = {
    status: "400",
    code: "ERR_MISSING_AUTH",
    detail: "The request is missing the Authorization: Bearer token necessary for authentication.\nThis is an authenticated route.",
    title: "Missing authorization header"
};
export const noRefreshTokenError: Error = {
    status: "400",
    code: "ERR_NO_REFRESH_TOKEN",
    title: "No refresh token provided",
};

export const invalidAmountError: Error = {
    code: "ERR_INVALID_AMOUNT",
    detail: "An amount must be an integer. The last two digits will be considered decimals.",
    title: "Invalid amount",
    status: "400"
};

export const blankEmailError: Error = {
    "status": "400",
    "code": "ERR_EMAIL_BLANK",
    "detail": "A blank email was provided",
    "title": "Email should not be blank",
};

export const blankPasswordError: Error = {
    "status": "400",
    "code": "ERR_PASSWORD_BLANK",
    "detail": "A blank password was provided",
    "title": "Password should not be blank"
};

export const blankFirstNameError: Error = {
    "status": "400",
    "code": "ERR_FIRST_NAME_BLANK",
    "detail": "An empty first name was provided",
    "title": "First name should not be blank"
};

export const blankLastNameError: Error = {
    "status": "400",
    "code": "ERR_LAST_NAME_BLANK",
    "detail": "An empty last name was provided",
    "title": "Last name should not be blank"
};

export const blankBirthdayError: Error = {
    "status": "400",
    "code": "ERR_BIRTHDAY_BLANK",
    "detail": "An blank birthday was provided",
    "title": "Birthday should not be blank"
};

export const blankCurrencyCodeError: Error = {
    "status": "400",
    "code": "ERR_CURRENCY_CODE_BLANK",
    "detail": "An blank currency code was provided",
    "title": "Currency code should not be blank"
};

export const invalidCurrencyCodeError: Error = {
    "status": "400",
    "code": "ERR_CURRENCY_CODE_INVALID",
    "detail": "An invalid currency code was provided",
    "title": "Currency code is not valid"
};

export const invalidEmailError: Error = {
    "status": "400",
    "code": "ERR_EMAIL_INVALID",
    "detail": "An invalid email was provided",
    "title": "Email is not valid"
};
export const invalidDateError: Error = {
    "status": "400",
    "code": "ERR_DATE_INVALID",
    "detail": "All dates must be formatted using ISO 8601",
    "title": "Provided date is not valid",
    "links": { "about": "https://en.wikipedia.org/wiki/ISO_8601" },
};

export const invalidRefreshToken: Error = {
    status: "403",
    code: "ERR_INVALID_REFRESH_TOKEN",
    title: "Invalid refresh token",
    detail: "The refresh token provided is not valid or refers to a different user"
};