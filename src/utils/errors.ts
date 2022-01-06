import { Error } from './jsonAPI';

export const wrongParameterType: Error = {
    code: 'ERR_WRONG_PARAMETER_TYPE',
    detail: 'The parameter type for {{param.name}} is wrong. The correct type is {{param.type}}',
    title: 'Wrong parameter type',
    status: '400',
};

export const missingInvalidateSessionsParameter: Error = {
    code: 'ERR_MISSING_INVALIDATE_SESSIONS_PARAMETER',
    detail: 'The required parameter for invalidating sessions is missing',
    title: 'Missing "invalidateSessions" parameter',
    status: '400',
};

export const noResetKey: Error = {
    code: 'ERR_NO_RESET_KEY',
    detail: 'The required reset key is missing',
    title: 'No reset key provided',
    status: '400',
};

export const invalidResetKey: Error = {
    code: 'ERR_INVALID_RESET_KEY',
    detail: 'The reset key used is invalid',
    title: 'Invalid reset key',
    status: '400',
};
export const wrongCredentials: Error = {
    code: 'ERR_WRONG_CREDENTIALS',
    detail: "A wrong email or password were used. I'm not gonna tell you which though.",
    status: '400',
    title: 'Wrong email or password',
};

export const personalInfoNotFound: Error = {
    code: 'ERR_INFO_NOT_FOUND',
    detail: 'Personal info for this user could not be retrieved, probably due to an internal error.',
    status: '500',
    title: 'Personal info not found',
};

export const invalidAuthToken: Error = {
    code: 'ERR_INVALID_AUTH_TOKEN',
    detail: 'The authorization token provided with this request is not valid',
    status: '400',
    title: 'Invalid Authorization Token',
};

export const invalidUserId: Error = {
    code: 'ERR_INVALID_USER_ID',
    detail: 'An empty or invalid id parameter was provided',
    status: '400',
    title: 'Invalid User ID',
};

export const invalidTransactionId: Error = {
    code: 'ERR_INVALID_TRANSACTION_ID',
    detail: 'An empty or invalid id parameter was provided',
    status: '400',
    title: 'Invalid Transaction ID',
};

export const userNotFound: Error = {
    code: 'ERR_USER_NOT_FOUND',
    detail: 'The requested user could not be found',
    status: '404',
    title: 'User not found',
};
export const transactionNotFound: Error = {
    code: 'ERR_TRANSACTION_NOT_FOUND',
    detail: 'The requested transaction could not be found',
    status: '404',
    title: 'Transaction not found',
};

export const userIdMismatch: Error = {
    code: 'ERR_USER_ID_MISMATCH',
    detail: 'The request could not be fulfilled as the provided user id is different from the one contained in the authentication token',
    status: '403',
    title: 'User id mismatch',
};

export const expiredAuthToken: Error = {
    code: 'ERR_EXPIRED_AUTH_TOKEN',
    detail: 'The authorization token provided with this request is expired',
    status: '400',
    title: 'Expired Authorization Token',
};

export const genericJWT: Error = {
    code: 'ERR_GENERIC_JWT',
    detail: 'Something went wrong processing your token. Please try logging in again.',
    status: '400',
    title: 'Generic JWT Error',
};

export const missingAuthorization: Error = {
    status: '400',
    code: 'ERR_MISSING_AUTH',
    detail: 'The request is missing the Access Token necessary for authentication. This is an authenticated route.',
    title: 'Missing authorization cookie',
};
export const noRefreshToken: Error = {
    status: '400',
    code: 'ERR_NO_REFRESH_TOKEN',
    title: 'No refresh token provided',
};

export const invalidAmount: Error = {
    code: 'ERR_INVALID_AMOUNT',
    detail: 'An amount must be an integer. The last two digits will be considered decimals.',
    title: 'Invalid amount',
    status: '400',
};

export const blankEmail: Error = {
    status: '400',
    code: 'ERR_EMAIL_BLANK',
    detail: 'A blank email was provided',
    title: 'Email should not be blank',
};

export const blankAmount: Error = {
    status: '400',
    code: 'ERR_AMOUNT_BLANK',
    detail: 'A blank amount was provided',
    title: 'Amount should not be blank',
};

export const blankDate: Error = {
    status: '400',
    code: 'ERR_DATE_BLANK',
    detail: 'A blank date was provided',
    title: 'Date should not be blank',
};

export const blankTag: Error = {
    status: '400',
    code: 'ERR_TAG_BLANK',
    detail: 'A blank tag was provided',
    title: 'Tag should not be blank',
};

export const blankPassword: Error = {
    status: '400',
    code: 'ERR_PASSWORD_BLANK',
    detail: 'A blank password was provided',
    title: 'Password should not be blank',
};

export const blankFirstName: Error = {
    status: '400',
    code: 'ERR_FIRST_NAME_BLANK',
    detail: 'An empty first name was provided',
    title: 'First name should not be blank',
};

export const blankLastName: Error = {
    status: '400',
    code: 'ERR_LAST_NAME_BLANK',
    detail: 'An empty last name was provided',
    title: 'Last name should not be blank',
};

export const blankDataField: Error = {
    status: '400',
    code: 'ERR_DATA_BLANK',
    detail: 'As per the JSON:API specification, this endpoint needs a top-level object with a "data" field',
    title: 'Data field should not be blank',
};

export const blankBirthday: Error = {
    status: '400',
    code: 'ERR_BIRTHDAY_BLANK',
    detail: 'An blank birthday was provided',
    title: 'Birthday should not be blank',
};

export const blankCurrencyCode: Error = {
    status: '400',
    code: 'ERR_CURRENCY_CODE_BLANK',
    detail: 'An blank currency code was provided',
    title: 'Currency code should not be blank',
};

export const invalidCurrencyCode: Error = {
    status: '400',
    code: 'ERR_CURRENCY_CODE_INVALID',
    detail: 'An invalid currency code was provided',
    title: 'Currency code is not valid',
};

export const invalidEmail: Error = {
    status: '400',
    code: 'ERR_EMAIL_INVALID',
    detail: 'An invalid email was provided',
    title: 'Email is not valid',
};

export const invalidDate: Error = {
    status: '400',
    code: 'ERR_DATE_INVALID',
    detail: 'All dates must be formatted using ISO 8601',
    title: 'Provided date is not valid',
    links: { about: 'https://en.wikipedia.org/wiki/ISO_8601' },
};

export const invalidRefreshToken: Error = {
    status: '403',
    code: 'ERR_INVALID_REFRESH_TOKEN',
    title: 'Invalid refresh token',
    detail: 'The refresh token provided is not valid or refers to a different user',
};

export const invalidRequestBody: Error = {
    status: '400',
    code: 'ERR_INVALID_BODY',
    title: 'Invalid request body',
    detail: "Request's body is invalid. Please check again and make sure to follow the JSON:API v1.0 specification.",
    links: {
        about: {
            meta: {
                title: 'JSON:API Specification',
            },
            href: 'https://jsonapi.org/format/1.0/',
        },
    },
};

export const unsupportedIdInRequest: Error = {
    code: 'ERR_UNSUPPORTED_ID',
    detail: 'This endpoint does not accept an id as part of the resource object. Please refer to the documentation for further info.',
    status: '403',
    title: 'Providing id is not supported',
};

export const internal: Error = {
    code: 'ERR_INTERNAL_LOGIN_AGAIN',
    detail: 'Internal server error. Please try again. Should the error occur repeatedly, report this to https://github.com/sungvzer/project-aurora/issues',
    status: '500',
    title: 'Internal server error',
};

export const invalidDarkModeValue: Error = {
    code: 'ERR_INVALID_DARK_MODE_VALUE',
    detail: 'An invalid value was inserted for this setting. Expected a number. Valid values are 0 (Light mode) and 1 (Dark mode)',
    status: '400',
    title: 'Invalid dark mode value',
};

export const invalidAbbreviatedAmountValue: Error = {
    code: 'ERR_INVALID_ABBREVIATED_AMOUNT_VALUE',
    detail: 'An invalid value was inserted for this setting. Expected a number. Valid values are 0 (Long amount) and 1 (Abbreviated amount)',
    status: '400',
    title: 'Invalid abbreviated amount value',
};
