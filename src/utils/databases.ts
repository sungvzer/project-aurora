import mysql2 from "mysql2";
import { ENVIRONMENT } from "./secrets";
import { createClient } from "redis";
import { RedisClientType } from "redis";
import * as jwt from "jsonwebtoken";

export interface LastInsertId extends mysql2.RowDataPacket {
    "LAST_INSERT_ID()": number;
}

const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    password:
        ENVIRONMENT === "Development"
            ? process.env.MYSQL_PASSWORD_DEV
            : process.env.MYSQL_PASSWORD_PROD,
    port: parseInt(process.env.MYSQL_PORT),
    database: "aurora",
    user: ENVIRONMENT === "Development" ? "aurora_dev" : "aurora_prod",
    timezone: "+00:00",
};

const pool = mysql2.createPool(mysqlConfig);
pool.getConnection((err, conn) => {
    if (err) {
        throw err;
    }
    conn.release();
});

export const getDatabaseConnection = async () => {
    return pool.promise();
};

export const getRedisConnection = async (): Promise<
    RedisClientType<{}, {}>
> => {
    const client = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });
    client.on("error", (err) => {
        throw err;
    });
    await client.connect();
    return client;
};

export const { periodicRefreshTokenCleanup } = new (class {
    count = -1;
    connection: RedisClientType<{}, {}>;
    periodicRefreshTokenCleanup = async () => {
        this.count++;
        if (this.connection == null) {
            this.connection = await getRedisConnection();
        }
        if (this.count % 10 !== 0) {
            return;
        }
        const keys = await this.connection.KEYS("*");
        for (const key of keys) {
            const value = await this.connection.get(key);
            let toDelete = false;
            jwt.verify(value, process.env.JWT_REFRESH_SECRET, (err) => {
                if (err && err.message.indexOf("expired") != -1)
                    toDelete = true;
            });
            if (toDelete) {
                await this.connection.del(key);
            }
        }
    };
})();
