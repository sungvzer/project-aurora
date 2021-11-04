import * as mysql2 from 'mysql2/promise';
import { ENVIRONMENT } from '../utils/secrets';

export interface LastInsertId extends mysql2.RowDataPacket {
    "LAST_INSERT_ID()": number;
}

export const getDatabaseConnection = async () => {
    return await mysql2.createConnection({
        host: process.env.MYSQL_HOST,
        password: process.env.MYSQL_PASSWORD_DEV,
        port: parseInt(process.env.MYSQL_PORT),
        database: "aurora",
        // TODO: This needs to be changed once we reach production
        user: ENVIRONMENT === 'Development' ? "aurora_dev" : "aurora_dev",
    });
};
