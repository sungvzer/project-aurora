# API Endpoint definitions

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

## POST /signup - Create a new user

### Description

It requires the `Content-Type: application/json` header.

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

