import mysql2 from 'mysql2';
import { ENVIRONMENT } from './secrets';
import { createClient } from 'redis';
import { RedisClientType } from '@node-redis/client/dist/lib/client';

export interface LastInsertId extends mysql2.RowDataPacket {
    "LAST_INSERT_ID()": number;
}

const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    password: process.env.MYSQL_PASSWORD_DEV,
    port: parseInt(process.env.MYSQL_PORT),
    database: "aurora",
    // TODO: This needs to be changed once we reach production
    user: ENVIRONMENT === 'Development' ? "aurora_dev" : "aurora_dev",
    timezone: '+00:00'
};

const pool = mysql2.createPool(mysqlConfig);

export const getDatabaseConnection = async () => {
    return pool.promise();
};

export const getRedisConnection = async (): Promise<RedisClientType<{}, {}>> => {
    const client = createClient({ url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` });
    client.on('error', (err) => { console.log(err); throw err; });
    await client.connect();
    return client;
};
