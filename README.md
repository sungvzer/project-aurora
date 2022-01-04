# Aurora :star:

Aurora is a free-to-use, self-hostable accounting API that can be used to keep track of personal expenses.

Throughout the API, the [JSON:API](https://jsonapi.org/) specification is used to maintain consistency and structure. The aim is to simplify access to this API by using a consolidated specification:

_Request_

```http
GET http://aurora:3000/users/12/transactions HTTP1.1
Cookie: AccessToken=[...]; RefreshToken=[...]
```

_Response_

```json
{
    "data": [
        {
            "id": "22077",
            "type": "UserTransaction",
            "attributes": {
                "amount": 1599,
                "currency": "EUR",
                "date": "2021-11-07",
                "tag": "Burger"
            }
        }
    ],
    "jsonapi": {
        "version": "1.0"
    }
}
```

## Table of contents

-   [Table of contents](#table-of-contents)
-   [Features](#features)
-   [Installation](#installation)
    -   [System Requirements](#system-requirements)
-   [Running the API server](#running-the-api-server)
    -   [Environment variables](#environment-variables)
    -   [Dependencies](#dependencies)
    -   [Running](#running)
    -   [Debugging](#debugging)
-   [Contributing](#contributing)
-   [License](#license)

## Features

-   :man: :woman: Manage user account:
    -   :lock: User access managed via authentication with [JSON Web Tokens](https://jwt.io), no session stored on the database
    -   :envelope: Password restoring mechanism via SMTP emails
-   :wrench: Manage user settings for a front-end UI:
    -   :crescent_moon: Dark Mode/ :sunny: Light Mode
    -   :moneybag: Abbreviated amount format (e.g. 10'000'00'.00 -> 10M)
    -   :heavy_dollar_sign: Favorite currency (e.g. EUR, USD...)
-   :heavy_plus_sign: Add transactions
-   :mag: Query transactions
-   :x: Delete transactions
-   :pencil: Edit transactions

## Installation

At this stage of development, installing Aurora requires some configuration and it's not a one-line command:

### System Requirements

**Note:** These steps will not include network configuration.

To run an instance of Aurora, you first need to have these programs up and running on the system:

-   MySQL (Development version is MariaDB 10.6.5)

    -   There needs to be a database on this server called `aurora`
    -   An user with which tables need to be created
    -   And an user - `aurora_dev` which the API will use.

-   Redis (Development version is v6.2.6)

-   NodeJS (Development version is v14.18.2)

-   The usage of [pnpm](https://pnpm.io/) is highly recommended

## Running the API server

These steps will make sure no errors occur when running the API server

First, clone the repo and move into it:

    git clone https://github.com/sungvzer/project-aurora.git && cd project-aurora

### Environment variables

Create a new `.env` file into the root of the project, then set these variables:

| Name                   | Type    | Description                                             | Example                              |
| ---------------------- | ------- | ------------------------------------------------------- | ------------------------------------ |
| PORT                   | Integer | Port the API will listen to                             | `3000 `                              |
| MYSQL_HOST             | String  | MySQL database hostname (IP or name)                    | `localhost / 127.0.0.1 `             |
| MYSQL_PORT             | Integer | MySQL database port                                     | `3306 `                              |
| MYSQL_PASSWORD_DEV     | String  | MySQL database `aurora_dev` user password               | `AuroraPassword123 `                 |
| REDIS_HOST             | String  | Redis database hostname (IP or name)                    | `localhost / 127.0.0.1 `             |
| REDIS_PORT             | Integer | Redis database port                                     | `6000 `                              |
| SHOW_ENDPOINTS         | Boolean | Whether to log endpoints on startup                     | `true `                              |
| SHOW_TABLE             | Boolean | Whether to show a configuration table on startup        | `false `                             |
| SHOW_TITLE_AS_ASCI_ART | Boolean | Whether to show an ASCII art-style title on startup     | `false `                             |
| JWT_SECRET             | String  | JWT Access Tokens secret key                            | `s7tRqhDbqwAe `                      |
| JWT_REFRESH_SECRET     | String  | JWT Refresh Tokens secret key (DO NOT MATCH JWT_SECRET) | `cuEQYe5Z56uN `                      |
| SMTP_USER              | String  | Production SMTP Server User                             | `aurora_smtp@provider.com `          |
| SMTP_PASS              | String  | Production SMTP Server Password                         | `aurora_secure_password1234 `        |
| SMTP_SERVER            | String  | Production SMTP Server Address (IP or name)             | `102.200.255.12 / smtp.provider.com` |
| SMTP_PORT              | Integer | Production SMTP Server Port                             | `25 `                                |

### Dependencies

Run `pnpm install` or the chosen npm/yarn equivalent to install all dependencies.

Check that a `node_modules` folder is created in the project root.

### Running

To run the project, run

    pnpm run release

### Debugging

To build the project a single time:

    pnpx tsc

To build the project as you work on it:

    pnpm run watch

To build and run on watch-mode:

    pnpm run watchDebug

or

    pnpm run watchRelease

To build and run single-shot:

    pnpm run debug

To run a prebuilt version:

    pnpm start

## Contributing

Every contribution is highly welcome! Feel free to visit the following links to take part in this journey:

-   Visit the [Issue Tracker](https://github.com/sungvzer/project-aurora/issues) to see the current active bugs and enhancement suggestions, or to create one of your own!
-   Our source code is available on [GitHub](https://github.com/sungvzer/project-aurora), where you're reading this!

## License

The project is licensed under the GPL 3.0 license.
