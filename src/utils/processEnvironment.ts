declare namespace NodeJS {
    export interface ProcessEnv {
        /** Port on which the server listens to */
        PORT: string;

        /** MySQL server address */
        MYSQL_HOST: string;

        /** MySQL server port */
        MYSQL_PORT: string;

        /** MySQL server password for the development user */
        MYSQL_PASSWORD_DEV: string;

        /** Redis server address */
        REDIS_HOST: string;

        /** Redis server port */
        REDIS_PORT: string;

        /** If the startup screen should show the endpoint list */
        SHOW_ENDPOINTS: string;

        /** If the startup screen should show the config table */
        SHOW_TABLE: string;

        /** If the startup screen should show the application title as ASCII art */
        SHOW_TITLE_AS_ASCII_ART: string;

        /** Access JSON Web Token private key */
        JWT_SECRET: string;

        /** Refresh JSON Web Token private key */
        JWT_REFRESH_SECRET: string;

        /** SMTP Server username */
        SMTP_USER: string;

        /** SMTP Server password */
        SMTP_PASS: string;

        /** SMTP Server address */
        SMTP_SERVER: string;

        /** SMTP Server port */
        SMTP_PORT: string;
    }
}
