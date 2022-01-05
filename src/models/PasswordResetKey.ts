import { getDatabaseConnection } from '../utils/databases';
import random from '../utils/random';
import ErrorOr from './ErrorOr';
import User from './User';
import * as err from '../utils/errors';
import { millisecondsInAnHour } from '../utils/time';
import { RowDataPacket } from 'mysql2/promise';
import assert from 'assert';

export interface Key {
    userId: number;
    expiresOn: Date;
    key: string;
}

export default class PasswordResetKey {
    public static async produce(email: string): Promise<ErrorOr<Key>> {
        let userIdOrError = await User.getUserIdByEmail(email);
        if (userIdOrError.isError()) {
            return new ErrorOr({ error: userIdOrError.error });
        }

        const pool = await getDatabaseConnection();
        const generatedKey = this.generate();

        const expiresOn = new Date(Date.now() + millisecondsInAnHour); // We expire it after a single hour due to security reasons.

        // Query
        let sql =
            'INSERT INTO `PasswordResetKey` (`UserDataHeaderID`, `Key`, `ExpiresOn`) VALUES (?, ?, ?);';
        let result = await pool.execute(sql, [userIdOrError.value, generatedKey, expiresOn]);

        return new ErrorOr({
            value: {
                expiresOn: expiresOn,
                key: generatedKey,
                userId: userIdOrError.value,
            },
        });
    }

    public static async consume(key: string): Promise<ErrorOr<number>> {
        const pool = await getDatabaseConnection();
        let [result] = await pool.execute<RowDataPacket[]>(
            'SELECT PasswordResetKeyID, UserDataHeaderID FROM `PasswordResetKey` WHERE `PasswordResetKey`.`Key`=?;',
            [key],
        );

        if (result.length === 0) {
            return new ErrorOr({
                error: err.invalidResetKey,
            });
        }

        let idToBeDeleted = result[0].PasswordResetKeyID;
        let userId = result[0].UserDataHeaderID;

        assert(idToBeDeleted != null);
        [result] = await pool.execute<RowDataPacket[]>(
            'DELETE FROM `PasswordResetKey` WHERE `PasswordResetKeyID` = ?;',
            [idToBeDeleted],
        );
        return new ErrorOr({
            value: userId,
        });
    }

    private static generate(): string {
        return random(64);
    }
}
