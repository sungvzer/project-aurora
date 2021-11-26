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
    - [Fields](#fields)
    - [Responses](#responses-1)
  - [POST /login](#post-login)
    - [Description](#description-2)
    - [Headers](#headers-2)
    - [Fields](#fields-1)
    - [Responses](#responses-2)
  - [POST /logout](#post-logout)
    - [Description](#description-3)
    - [Headers](#headers-3)
    - [Fields](#fields-2)
    - [Responses](#responses-3)
  - [GET /user/{id}/settings](#get-useridsettings)
    - [Description](#description-4)
    - [Headers](#headers-4)
    - [Fields](#fields-3)
    - [Responses](#responses-4)
  - [GET /user/{id}/transactions](#get-useridtransactions)
    - [Description](#description-5)
    - [Headers](#headers-5)
    - [Fields](#fields-4)
    - [Responses](#responses-5)

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

### Fields

No fields are required.

### Responses

An example response will be:

```http
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Connection: close

{
  "error": false,
  "routes": {
    "get": [
      "/getRoute1"
    ],
    "post": [
      "/postRoute1",
      "/postRoute2"
    ],
    "put": [
      "/putRoute1"
    ],
    "patch": [
      "/patchRoute1",
      "/patchRoute2"
    ],
    "delete": [
      "/deleteRoute1"
    ],
  }
}
```

## POST /login

### Description

Log in to an existing user.

### Headers

`Content-Type: application/json`

### Fields

- `email`: a string representing the user email. Any email **will** be converted to lowercase. Example: `email@example.com`.

- `password`: plain text password string. Will be hashed and salted using `argon2` before being compared to the saved hashes. Example: `VerySecurePassword`.

### Responses

If it succeeds, the request will return the following response:

```http
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": false,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySGVhZGVySUQiOjIsImlhdCI6MTYzNjA2MjEwMiwiZXhwIjoxNjM2MDYzMDAyfQ.IyoeAywnHqGBN6XWECtXFiUFRfLIgl-sr2XjmXRTtr8",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySGVhZGVySUQiOjIsImlhdCI6MTYzNjA2MjEwMn0.2g_tvIrY89KWw_bnPme0Pc68wsE0gN-wUgxznqhYgX8"
}
```

The `accessToken` value needs to be used everywhere authentication is needed, as a [JSON Web Token](https://jwt.io/). By default, these tokens will expire after 15 minutes.

`refreshToken`s, instead, do not expire, and will be invalidated once used for the first time; their purpose is to get a new pair of tokens whenever the `accessToken` expires.

Should any of the two fields be missing, the following response will be returned:

```http
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": [
    "Email should not be blank",
    "Password should not be blank"
  ]
}
```

If the email is not valid, this response will be returned:

```http
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": [
    "Email is not valid"
  ]
}
```

When a wrong email is provided:

```http
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": "No user credentials found for email example@example.it"
}
```

When a wrong password is provided:

```http
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": "Wrong password"
}
```

## POST /logout

### Description

Deletes a user's refresh token, practically invalidating the access token at the expiry date.

It's an **authenticated** endpoint. This means you need to first obtain an `accessToken` by [logging in](#post-login).

### Headers

`Authorization: Bearer {accessToken}`

`Content-Type: application/json`

### Fields

- `refreshToken`: the refresh token to be invalidated.

### Responses

If it succeeds, the request will return the following response:

```http
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": false,
  "message": "User logged out successfully"
}
```

If the `refreshToken` is omitted:

```http
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": "No refresh token provided"
}
```

If the `refreshToken` is provided, but does not belong to any user:

```http
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": "Refresh token doesn't belong to any session"
}
```

Should - by any chance - the payloads be missing in any of the two tokens:

```http
HTTP/1.1 403 Forbidden
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": "Invalid access or refresh token(s)"
}
```

If refresh and access token refer to different users in their payload:

```http
HTTP/1.1 403 Forbidden
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": "Tokens refer to different users"
}
```

## GET /user/{id}/settings

### Description

List user's settings.

It's an **authenticated** endpoint. This means you need to first obtain an `accessToken` by [logging in](#post-login).

### Headers

`Authorization: Bearer {accessToken}`

### Fields

- `accessToken`: JWT string obtained via the login process.

### Responses

Unless an [authentication error](#authentication-errors) occurs, the response will be:

```http
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": false,
  "settings": {
    "abbreviatedFormat": 1,
    "currency": 50,
    "darkMode": 0
  }
}
```

## GET /user/{id}/transactions

### Description

List user's transactions, filtered by query parameters.

It's an **authenticated** endpoint. This means you need to first obtain an `accessToken` by [logging in](#post-login).

### Headers

`Authorization: Bearer {accessToken}`

### Fields

These need to be included in the GET query string. For example: `/users/2/transactions?currency=USD`

- `minAmount` and `maxAmount` define the range of filtering for the transactions' amounts. 

- `startDate` and `endDate` define the range of filtering for the transactions' dates.

- `currency` represents the **only** currency code that will get included in the result.

- `tag` refers to the transactions' tags.

### Responses

Unless an [authentication error](#authentication-errors) occurs, the response will be:

```http
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": false,
  "transactions": [
    {
      "amount": -520189,
      "currency": "USD",
      "date": "2021-11-03T23:00:00.000Z",
      "tag": "Hospital bill"
    },
    {
      "amount": -1799,
      "currency": "USD",
      "date": "2021-11-06T23:00:00.000Z",
      "tag": "Streaming service subscription"
    },
    # ... 
  ]
}
```

`transactions` *can* be an empty array if no transactions matching the query were found.

The `amount` field is an integer where the last two digits are the "cents" part; if we look at the first transaction, for example, the amount is -\$5,201.89.
