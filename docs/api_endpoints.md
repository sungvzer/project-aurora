# API Endpoint definitions

## Table of contents

- [API Endpoint definitions](#api-endpoint-definitions)
  - [Table of contents](#table-of-contents)
  - [JSON:API Specification](#jsonapi-specification)
    - [Resources](#resources)
  - [Common errors](#common-errors)
    - [`ERR_MALFORMED_JSON`: Malformed JSON](#err_malformed_json-malformed-json)
    - [`ERR_INVALID_BODY`: Invalid JSON:API body](#err_invalid_body-invalid-jsonapi-body)
  - [Authentication errors](#authentication-errors)
    - [`ERR_MISSING_AUTH` : Authorization Header missing](#err_missing_auth--authorization-header-missing)
    - [`ERR_INVALID_AUTH_TOKEN`: Malformed header or invalid access token](#err_invalid_auth_token-malformed-header-or-invalid-access-token)
    - [`ERR_EXPIRED_AUTH_TOKEN`: Expired access token](#err_expired_auth_token-expired-access-token)
  - [POST /signup](#post-signup)
    - [Description](#description)
    - [Headers](#headers)
    - [Resource type](#resource-type)
    - [Attributes](#attributes)
    - [Responses](#responses)
  - [GET /routes](#get-routes)
    - [Description](#description-1)
    - [Headers](#headers-1)
    - [Resource type](#resource-type-1)
    - [Attributes](#attributes-1)
    - [Responses](#responses-1)
  - [POST /login](#post-login)
    - [Description](#description-2)
    - [Headers](#headers-2)
    - [Resource type](#resource-type-2)
    - [Attributes](#attributes-2)
    - [Responses](#responses-2)
  - [POST /logout](#post-logout)
    - [Description](#description-3)
    - [Headers](#headers-3)
    - [Resource type](#resource-type-3)
    - [Attributes](#attributes-3)
    - [Responses](#responses-3)
  - [GET /users/{id}/settings](#get-usersidsettings)
    - [Description](#description-4)
    - [Headers](#headers-4)
    - [Resource type](#resource-type-4)
    - [Attributes](#attributes-4)
    - [Responses](#responses-4)
  - [GET /users/{id}/transactions/{:transactionID?}](#get-usersidtransactionstransactionid)
    - [Description](#description-5)
    - [Headers](#headers-5)
    - [Resource type](#resource-type-5)
    - [Attributes](#attributes-5)
    - [Fields](#fields)
    - [Responses](#responses-5)
  - [POST /refreshToken](#post-refreshtoken)
    - [Description](#description-6)
    - [Headers](#headers-6)
    - [Resource type](#resource-type-6)
    - [Attributes](#attributes-6)
    - [Responses](#responses-6)
  - [DELETE /users/{:id}](#delete-usersid)
    - [Description](#description-7)
    - [Headers](#headers-7)
    - [Resource type](#resource-type-7)
    - [Attributes](#attributes-7)
    - [Responses](#responses-7)

## JSON:API Specification

This API is aiming to be almost fully compliant to the [JSON:API](https://jsonapi.org/format/1.0) specification, with the goal of sticking to a standard, and not re-inventing the wheel.

We say *almost* fully because there are some shenanigans with Express and headers that makes it not 100% compliant to the standard.

The [`jsonAPI.ts`](../src/utils/jsonAPI.ts) file will probably get polished and then released as a stand-alone library in the future, so that this specification can be adopted and implemented by many.

Every response sent by the API will be in the format of the specification, read more to get insights on parsing and processing.

### Resources

Every communication that requires an exchange of resources will happen through the JSON:API specification. This means that, if the client needs to send two objects, both of the same type, like

```json
{
    "name": "Woofie",
    "family": "Canidae",
    "color": "Brown"
}
```

and

```json
{
    "name": "Felix",
    "family": "Felidae",
    "color": "White"
}
```

Both of type `animal`, the client will send them like this:

```json
{
    "data": [
        {
            "type": "animal",
            "attributes": {
                "name": "Felix",
                "family": "Felidae",
                "color": "White"
            }
        },
        {
            "type": "animal",
            "attributes": {
                "name": "Woofie",
                "family": "Canidae",
                "color": "Brown"
            }
        }
    ]
}
```

## Common errors

This list contains common errors and their responses.

### `ERR_MALFORMED_JSON`: Malformed JSON

Happens whenever a request contains incorrect JSON syntax.

One element in the `errors` array will be:

```json
{
    "title": "Malformed JSON body",
    "detail": "A request was sent with a malformed JSON body. Please check the request and try again.",
    "status": "400",
    "code": "ERR_MALFORMED_JSON"
}
```

### `ERR_INVALID_BODY`: Invalid JSON:API body

This error will get sent whenever and endpoint requests a JSON:API compliant body, but finds a malformed one.

```json
{
    "status": "400",
    "code": "ERR_INVALID_BODY",
    "title": "Invalid request body",
    "detail": "Request's body is invalid. Please check again and make sure to follow the JSON:API v1.0 specification.",
    "links": {
        "about": {
            "meta": {
                "title": "JSON:API Specification"
            },
            "href": "https://jsonapi.org/format/1.0/"
        }
    }
}
```

## Authentication errors

Whenever an authenticated route is requested, a middleware parses the request for an `accessToken`.

If the request gets authenticated, it will simply get passed on to the next handler.

### `ERR_MISSING_AUTH` : Authorization Header missing

```json
{
    "status": "400",
    "code": "ERR_MISSING_AUTH",
    "detail": "The request is missing the Authorization: Bearer token necessary for authentication.\nThis is an authenticated route.",
    "title": "Missing authorization header"
}
```

### `ERR_INVALID_AUTH_TOKEN`: Malformed header or invalid access token

```json
{
    "code": "ERR_INVALID_AUTH_TOKEN",
    "detail": "The authorization token provided with this request is not valid",
    "status": "400",
    "title": "Invalid Authorization Token"
}
```

### `ERR_EXPIRED_AUTH_TOKEN`: Expired access token

```json
{
    "code": "ERR_EXPIRED_AUTH_TOKEN",
    "detail": "The authorization token provided with this request is expired",
    "status": "400",
    "title": "Expired Authorization Token"
};
```

## POST /signup

### Description

Create a new user.

### Headers

`Content-Type: application/json`

### Resource type

`SignupData`

### Attributes

- `birthday`: an ISO 8601 formatted date string representing the user birth date. The format **must** be `YYYY-MM-DD`. Example: `1986-02-12`.

- `email`: a string representing the user email. Any email **will** be converted to lowercase. Example: `email@example.com`.

- `password`: plain text password string required for signing up. Will be hashed and salted using `argon2` before being stored in a database. Example: `VerySecurePassword`.

- `firstName`, `lastName`, `middleName`: strings that represent, in order, the first, last and middle name of the user. Example: `John`, `Doe`, `J`.

- `currency`: three-letter uppercase string. Must be one of the [ISO 4217](https://www.iban.com/currency-codes) currency codes.

 Of these fields, only `middleName` is optional.

### Responses

In case of a successful request: the status `201: Created` and the following response are returned:

```json
{
  "data": {
    "id": "new user id",
    "type": "user",
    "attributes": {
        /* Same attributes sent by the request, without plain text password */
    }
  }
}
```

Depending on which field is missing from the request, the following errors can be returned:

```json
{
    "errors": [
        {
            "status": "400",
            "code": "ERR_EMAIL_BLANK",
            "detail": "A blank email was provided",
            "title": "Email should not be blank"
        },
        {
            "status": "400",
            "code": "ERR_PASSWORD_BLANK",
            "detail": "A blank password was provided",
            "title": "Password should not be blank"
        },
        {
            "status": "400",
            "code": "ERR_FIRST_NAME_BLANK",
            "detail": "An empty first name was provided",
            "title": "First name should not be blank"
        },
        {
            "status": "400",
            "code": "ERR_LAST_NAME_BLANK",
            "detail": "An empty last name was provided",
            "title": "Last name should not be blank"
        },
        {
            "status": "400",
            "code": "ERR_BIRTHDAY_BLANK",
            "detail": "An blank birthday was provided",
            "title": "Birthday should not be blank"
        },
        {
            "status": "400",
            "code": "ERR_CURRENCY_CODE_BLANK",
            "detail": "An blank currency code was provided",
            "title": "Currency code should not be blank"
        },
        {
            "status": "400",
            "code": "ERR_CURRENCY_CODE_INVALID",
            "detail": "An invalid currency code was provided",
            "title": "Currency code is not valid"
        },
        {
            "status": "400",
            "code": "ERR_EMAIL_INVALID",
            "detail": "An invalid email was provided",
            "title": "Email is not valid"
        },
        {
            "status": "400",
            "code": "ERR_DATE_INVALID",
            "detail": "All dates must be formatted using ISO 8601",
            "title": "Provided date is not valid",
            "links": {
                "about": "https://en.wikipedia.org/wiki/ISO_8601"
            }
        }
    ]
}
```

If a user with the corresponding `email` is found in the database, the response will be:

```json
{
    "errors": [
        {
            "code": "ERR_USER_ALREADY_EXISTS",
            "detail": "User with email /* email */ already exists",
            "title": "User already exists",
            "status": "409"
        }
    ]
}
```

## GET /routes

### Description

Returns all possible routes in a JSON format.

### Headers

No headers are required.

### Resource type

No body is required.

### Attributes

No body is required

### Responses

An example response will be:

```json
{
    "data": {
        "id": "0",
        "type": "Routes",
        "attributes": {
            "get": [
                "/routes",
                "/users/:id/settings",
                "/users/:id/transactions"
            ],
            "post": [
                "/signup",
                "/login",
                "/logout",
                "/refreshToken"
            ],
            "put": [],
            "patch": [],
            "delete": []
        }
    }
}
```

## POST /login

### Description

Log in to an existing user.

### Headers

`Content-Type: application/json`

### Resource type

`UserCredentials`

### Attributes

- `email`: a string representing the user email. Any email **will** be converted to lowercase. Example: `email@example.com`.

- `password`: plain text password string. Will be hashed and salted using `argon2` before being compared to the saved hashes. Example: `VerySecurePassword`.

### Responses

If it succeeds, the request will return the following response:

```json
{
    "data": {
        "id": "2",
        "type": "Credentials",
        "attributes": {
            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySGVhZGVySUQiOjIsImlhdCI6MTYzNzkyNTY3MywiZXhwIjoxNjM3OTI2NTczfQ.e_gf4V9xPTN1A0Wu1XV56bxENpOMf9dEHkmMz82aeVE",
            "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySGVhZGVySUQiOjIsImlhdCI6MTYzNzkyNTY3M30.PJO7UIr4mhUnYaEq7ImeSRaGcCF4kwyI05hdp9W8Jh0"
        }
    }
}
```

The `accessToken` value needs to be used everywhere authentication is needed, as a [JSON Web Token](https://jwt.io/). By default, these tokens will expire after 15 minutes.

`refreshToken`s, instead, do not expire, and will be invalidated once used for the first time; their purpose is to get a new pair of tokens whenever the `accessToken` expires.

Should any of the two fields be missing, the following response will be returned:

```json
{
    "errors": [
        {
            "status": "400",
            "code": "ERR_EMAIL_BLANK",
            "detail": "A blank email was provided",
            "title": "Email should not be blank"
        },
        {
            "status": "400",
            "code": "ERR_PASSWORD_BLANK",
            "detail": "A blank password was provided",
            "title": "Password should not be blank"
        },
        {
            "status": "400",
            "code": "ERR_EMAIL_INVALID",
            "detail": "An invalid email was provided",
            "title": "Email is not valid"
        }
    ]
}
```

If the email is not valid, this response will be returned:

```json
{
    "errors": [
        {
            "status": "400",
            "code": "ERR_EMAIL_INVALID",
            "detail": "An invalid email was provided",
            "title": "Email is not valid"
        }
    ]
}
```

Should an email or password be wrong, this response will be returned:

```json
{
    "errors": [
        {
            "code": "ERR_WRONG_CREDENTIALS",
            "detail": "A wrong email or password were used. I'm not gonna tell you which though.",
            "status": "400",
            "title": "Wrong email or password"
        }
    ]
}
```

## POST /logout

### Description

Deletes a user's refresh token, practically invalidating the access token at the expiry date.

It's an **authenticated** endpoint. This means you need to first obtain an `accessToken` by [logging in](#post-login).

### Headers

`Authorization: Bearer {accessToken}`

`Content-Type: application/json`

### Resource type

`RefreshToken`

### Attributes

- `refreshToken`: the refresh token to be invalidated.

### Responses

If it succeeds, the request will return the following response:

```json
{
  "meta": {
    "message": "User logged out successfully"
  }
}
```

If the `refreshToken` is omitted:

```json
{
  "errors": [
    {
      "status": "400",
      "code": "ERR_NO_REFRESH_TOKEN",
      "title": "No refresh token provided"
    }
  ]
}
```

If the `refreshToken` is provided, but does not belong to any user, or it is provided but is invalid (e.g. payloads missing or mismatch):

```json
{
  "errors": [
    {
      "status": "403",
      "code": "ERR_INVALID_REFRESH_TOKEN",
      "title": "Invalid refresh token",
      "detail": "The refresh token provided is not valid or refers to a different user"
    }
  ]
}
```

## GET /users/{id}/settings

### Description

List user's settings.

It's an **authenticated** endpoint. This means you need to first obtain an `accessToken` by [logging in](#post-login).

### Headers

`Authorization: Bearer {accessToken}`

### Resource type

No body is required

### Attributes

No body is required.

### Responses

Unless an [authentication error](#authentication-errors) occurs, the response will be:

```json
{
  "data": {
    "id": "2",
    "type": "UserSettings",
    "attributes": {
      "abbreviatedFormat": 1, // 1 or 0 represents true or false
      "currency": "EUR",
      "darkMode": 0 // 1 or 0 represents true or false
    }
  }
}
```

## GET /users/{id}/transactions/{:transactionID?}

### Description

List user's transactions, filtered by query parameters.

Optionally, it is possible to get a single transaction by providing the - optional - `transactionID`.

It's an **authenticated** endpoint. This means you need to first obtain an `accessToken` by [logging in](#post-login).

### Headers

`Authorization: Bearer {accessToken}`

### Resource type

No body is required.

### Attributes

No body is required.

### Fields

These need to be included in the GET query string. For example: `/users/2/transactions?currency=USD`

- `minAmount` and `maxAmount` define the range of filtering for the transactions' amounts. 

- `startDate` and `endDate` define the range of filtering for the transactions' dates.

- `currency` represents the **only** currency code that will get included in the result.

- `tag` refers to the transactions' tags.

### Responses

Unless an [authentication error](#authentication-errors) occurs, the response will be:

`transactionID` omitted:

```json
{
    "data": [
        {
            "id": "1",
            "type": "UserTransaction",
            "attributes": {
                "amount": -5189,
                "currency": "USD",
                "date": "2021-11-03T23:00:00.000Z",
                "tag": "Hospital bill"
            }
        },
        {
            "id": "2",
            "type": "UserTransaction",
            "attributes": {
                "amount": -4887,
                "currency": "EUR",
                "date": "2021-11-06T23:00:00.000Z",
                "tag": "Food"
            }
        },
        {
            "id": "3",
            "type": "UserTransaction",
            "attributes": {
                "amount": 3677,
                "currency": "USD",
                "date": "2021-11-06T23:00:00.000Z",
                "tag": "Food"
            }
        }
        /* ... */
    ]
}
```

`data` *can* be an empty array if no transactions matching the query were found.

If `transactionID` is provided:

```json
{
    "data": {
        "id": "1",
        "type": "UserTransaction",
        "attributes": {
            "amount": -5189,
            "currency": "USD",
            "date": "2021-11-03T23:00:00.000Z",
            "tag": "Hospital bill"
        }
    }
}
```

Should the transaction not be found:

```json
{
    "errors": [
        {
            "code": "ERR_TRANSACTION_NOT_FOUND",
            "detail": "The requested transaction could not be found",
            "status": "404",
            "title": "Transaction not found"
        }
    ]   
}
```

The `amount` field is an integer where the last two digits are the "cents" part; if we look at the first transaction, for example, the amount is -\$5,201.89.

## POST /refreshToken

### Description

Refreshes `accessToken` and `refreshToken` after the first expires.

### Headers

No header is required.

### Resource type

`RefreshToken`

### Attributes

- `refreshToken`: the token provided through the /login endpoint.

### Responses

In the case of a succesful request, the response will be:

```json
{
  "data": {
    "id": /* User ID related to the tokens */,
    "type": "AuthTokenPair",
    "attributes": {
      "accessToken": /* New access token */,
      "refreshToken": /* New refresh token */
    }
  }
}
```

If the `refreshToken` is omitted:

```json
{
  "errors": [
    {
      "status": "400",
      "code": "ERR_NO_REFRESH_TOKEN",
      "title": "No refresh token provided"
    }
  ]
}
```

If the `refreshToken` is provided, but does not belong to any user, or it is provided but is invalid (e.g. payloads missing or mismatch):

```json
{
  "errors": [
    {
      "status": "403",
      "code": "ERR_INVALID_REFRESH_TOKEN",
      "title": "Invalid refresh token",
      "detail": "The refresh token provided is not valid or refers to a different user"
    }
  ]
}
```

## DELETE /users/{:id}

### Description

Deletes a user.

It's an **authenticated** endpoint. This means you need to first obtain an `accessToken` by [logging in](#post-login).

### Headers

`Authorization: Bearer {accessToken}`

### Resource type

No body is required.

### Attributes

No body is required.

### Responses

Unless an [authentication error](#authentication-errors) occurs, the response will be a `204 No Content` status code, with no body whatsoever.

If the `id` URL parameter is empty, invalid, or malformed:

```json
{
    "errors": [
        {
            "code": "ERR_INVALID_USER_ID",
            "detail": "An empty or invalid id parameter was provided",
            "status": "400",
            "title": "Invalid User ID"
        }
    ]
}
```

If the user ID in the authentication token is different from the `id` URL parameter:

```json
{
    "errors": [
        {
            "code": "ERR_USER_ID_MISMATCH",
            "detail": "The request could not be fulfilled as the provided user id is different from the one contained in the authentication token",
            "status": "403",
            "title": "User id mismatch"
        }
    ]
}
```

If the user is not found:

```json
{
    "errors": [
        {
            "code": "ERR_USER_NOT_FOUND",
            "detail": "The requested user could not be found",
            "status": "404",
            "title": "User not found"
        }
    ]
}
```
