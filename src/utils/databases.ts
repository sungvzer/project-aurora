/* eslint-disable @typescript-eslint/ban-types */
import mysql2 from 'mysql2';
import { ENVIRONMENT } from './secrets';
import { createClient } from 'redis';
import { RedisClientType } from 'redis';
import * as jwt from 'jsonwebtoken';
import ErrorOr from '../models/ErrorOr';
import * as commonErrors from './errors';

export interface LastInsertId extends mysql2.RowDataPacket {
    'LAST_INSERT_ID()': number;
}

const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    password:
        ENVIRONMENT === 'Development'
            ? process.env.MYSQL_PASSWORD_DEV
            : process.env.MYSQL_PASSWORD_PROD,
    port: parseInt(process.env.MYSQL_PORT),
    database: 'aurora',
    user: ENVIRONMENT === 'Development' ? 'aurora_dev' : 'aurora_prod',
    timezone: '+00:00',
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

// FIXME: RedisModules, RedisScripts
export const getRedisConnection = async (): Promise<RedisClientType<{}, {}>> => {
    const client = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });
    client.on('error', (err) => {
        throw err;
    });
    await client.connect();
    return client;
};

export const {
    periodicRefreshTokenCleanup,
    invalidateSessionsForRefreshToken,
    invalidateAllSessionsForUser,
} = new (class {
    count = -1;
    // FIXME: Same FIXME as above
    connection: RedisClientType<{}, {}>;

    /**
     * Delete all sessions from Redis database for a certain user's id.
     * This will prevent refreshing tokens on ALL sessions, even the one that requested this action.
     * @param userId The user's ID
     */
    invalidateAllSessionsForUser = async (userId: number): Promise<void> => {
        if (this.connection == null) {
            this.connection = await getRedisConnection();
        }

        const result = await this.connection.keys(`${userId}-*`);
        if (!result) {
            return;
        }

        for (const key of result) {
            await this.connection.del(key);
        }
        return;
    };

    /**
     * Delete all sessions from Redis database for a certain user's refresh token
     * @param refreshToken Refresh token for the user.
     * @returns The user ID from the refresh token
     */
    invalidateSessionsForRefreshToken = async (refreshToken: string): Promise<ErrorOr<number>> => {
        let userId: number = undefined;
        if (this.connection == null) {
            this.connection = await getRedisConnection();
        }
        try {
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, payload) => {
                if (err) {
                    throw err; // This is the only way I found to propagate errors without external variables
                }
                userId = payload['userHeaderID'];
            });
        } catch (error) {
            return new ErrorOr({ error: commonErrors.invalidRefreshToken });
        }

        const result = await this.connection.keys(`${userId}-*`);
        if (!result || !result.includes(`${userId}-${refreshToken}`)) {
            return new ErrorOr({ error: commonErrors.invalidRefreshToken });
        }

        for (const key of result) {
            if (key === `${userId}-${refreshToken}`) {
                continue;
            }
            await this.connection.del(key);
        }
        return new ErrorOr({ value: userId });
    };

    periodicRefreshTokenCleanup = async () => {
        this.count++;
        if (this.connection == null) {
            this.connection = await getRedisConnection();
        }
        if (this.count % 10 !== 0) {
            return;
        }
        const keys = await this.connection.KEYS('*');
        for (const key of keys) {
            const value = await this.connection.get(key);
            let toDelete = false;
            jwt.verify(value, process.env.JWT_REFRESH_SECRET, (err) => {
                if (err && err.message.indexOf('expired') != -1) toDelete = true;
            });
            if (toDelete) {
                await this.connection.del(key);
            }
        }
    };
})();
