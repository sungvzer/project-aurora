# API Endpoint definitions

## Table of contents

- [API Endpoint definitions](#api-endpoint-definitions)
  - [Table of contents](#table-of-contents)
  - [Common errors](#common-errors)
    - [Malformed JSON](#malformed-json)
    - [Authentication errors](#authentication-errors)
  - [POST /signup](#post-signup)
    - [Description](#description)
    - [Headers](#headers)
    - [Fields](#fields)
    - [Responses](#responses)
  - [GET /routes](#get-routes)
    - [Description](#description-1)
    - [Headers](#headers-1)
    - [Fields](#fields-1)
    - [Responses](#responses-1)
  - [POST /login](#post-login)
    - [Description](#description-2)
    - [Headers](#headers-2)
    - [Fields](#fields-2)
    - [Responses](#responses-2)
  - [POST /logout](#post-logout)
    - [Description](#description-3)
    - [Headers](#headers-3)
    - [Fields](#fields-3)
    - [Responses](#responses-3)
  - [GET /user/{id}/settings](#get-useridsettings)
    - [Description](#description-4)
    - [Headers](#headers-4)
    - [Fields](#fields-4)
    - [Responses](#responses-4)

## Common errors

This list contains common errors and their responses.

### Malformed JSON

Happens whenever a request contains incorrect JSON syntax.

The response will be:

```http
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Connection: close

{
  "error": true,
  "message": "Malformed JSON body"
}
```

### Authentication errors

Whenever an authenticated route is requested, a middleware parses the request for an `accessToken`.

If the request gets authenticated, it will simply get passed on to the next handler.

Should the `Authorization: Bearer {jsonWebToken}` header be missing or malformed, these responses will be sent:

Header missing:

```http
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": "Missing Authorization header"
}
```

Malformed header or invalid access token:

```http
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": "Invalid authorization token"
}
```

Expired access token:

```http
HTTP/1.1 403 Forbidden
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "message": "jwt expired"
}
```

## POST /signup

### Description

Create a new user.

### Headers

`Content-Type: application/json`

### Fields

- `birthday`: an ISO 8601 formatted date string representing the user birth date. The format **must** be `YYYY-MM-DD`. Example: `1986-02-12`.

- `email`: a string representing the user email. Any email **will** be converted to lowercase. Example: `email@example.com`.

- `password`: plain text password string required for signing up. Will be hashed and salted using `argon2` before being stored in a database. Example: `VerySecurePassword`.

- `firstName`, `lastName`, `middleName`: strings that represent, in order, the first, last and middle name of the user. Example: `John`, `Doe`, `J`.

- `currency`: three-letter uppercase string. Must be one of the [ISO 4217](https://www.iban.com/currency-codes) currency codes.

 Of these fields, only `middleName` is optional.

An example of a correct `HTTP POST` request to this endpoint can be found at [this link](../examples/request/post/signup.http).

### Responses

In case of a successful request: the following response is returned:

```http
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Connection: close

{
  "error": false,
  "message": "User signed up correctly"
}
```

Depending on which field is missing from the request, the following response is returned:

```http
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Connection: close

{
  "error": true,
  "message": [
    "Email should not be blank",
    "Password should not be blank",
    "First name should not be blank",
    "Last name should not be blank",
    "Birthday should not be blank",
    "Currency code should not be blank",
    "Currency code is not valid",
    "Email is not valid",
    "Birthday should be a valid ISO date"
  ]
}
```

If a user with the corresponding `email` is found in the database, the response will be:

```http
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Headers: *
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Connection: close

{
  "error": true,
  "message": "User with email example@example.com already exists"
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
