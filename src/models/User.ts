import { ResultSetHeader, RowDataPacket } from "mysql2";
import * as dbController from "../utils/databases";
import { hashPassword } from "../utils/argon";
import * as err from "../utils/errors";
import CurrencyCode from "./CurrencyCode";
import ErrorOr from "./ErrorOr";
import UserTransaction from "./UserTransaction";

export interface UserDatabaseInsertModel {
    firstName: string;
    middleName: string;
    lastName: string;
    birthday: Date;
    email: string;
    plainTextPassword: string;
    currencyCode: CurrencyCode;
}

export interface UserSettings {
    currency: CurrencyCode;
    darkMode: boolean;
    abbreviatedFormat: boolean;
}

export interface UserCredentials {
    email: string;
    passwordHash: string;
    lastModifiedAt: Date;
}

export interface TransactionQueryOptions {
    minAmount?: number;
    maxAmount?: number;
    currency?: CurrencyCode;
    startDate?: Date;
    endDate?: Date;
    tag?: string;
}

export default class User {
    static async getBalanceById(
        userId: number
    ): Promise<ErrorOr<Map<CurrencyCode, number>>> {
        let map = new Map<CurrencyCode, number>();
        for (let code of Object.values(CurrencyCode)) {
            map.set(code, 0);
        }

        if (!(await User.exists(userId))) {
            return new ErrorOr({ error: err.userNotFound });
        }

        let sql =
            "SELECT SUM(UserTransactionAmount) AS Balance, CurrencyCode FROM aurora.Transaction INNER JOIN aurora.Currency ON UserTransactionCurrencyID = CurrencyID WHERE UserDataHeaderID = ? GROUP BY CurrencyCode;";
        const connection = await dbController.getDatabaseConnection();
        let [result] = await connection.execute<RowDataPacket[]>(sql, [userId]);

        for (let pair of result) {
            map.set(pair["CurrencyCode"], pair["Balance"]);
        }

        return new ErrorOr({ value: map });
    }
    static async deleteTransaction(
        userId: number,
        transactionId: number
    ): Promise<ErrorOr<boolean>> {
        let sql =
            "SELECT UserTransactionID, UserDataHeaderID FROM Transaction WHERE UserTransactionID = ?;";
        let params = [transactionId];

        const connection = await dbController.getDatabaseConnection();
        let [result] = await connection.execute<RowDataPacket[]>(sql, params);
        if (result.length === 0) {
            return new ErrorOr({
                error: err.transactionNotFound,
            });
        }

        let transactionOwner = result[0]["UserDataHeaderID"];
        if (transactionOwner !== userId) {
            return new ErrorOr({ error: err.userIdMismatch });
        }

        let [header] = await connection.execute<ResultSetHeader>(
            "DELETE FROM Transaction WHERE UserTransactionID = ?;",
            [transactionId]
        );

        if (header.affectedRows === 0) {
            return new ErrorOr({ error: err.transactionNotFound });
        }
        return new ErrorOr({ value: true });
    }

    static async create(
        user: UserDatabaseInsertModel
    ): Promise<ErrorOr<number>> {
        const pool = await dbController.getDatabaseConnection();
        const firstName = user.firstName || null;
        const middleName = user.middleName || null;
        const lastName = user.lastName || null;
        const email = user.email;
        const birthday = user.birthday;
        const passwordHash = await hashPassword(user.plainTextPassword);
        const currencyCode = user.currencyCode;

        const userFoundOrError = await User.getUserIdByEmail(email);

        // If a user could be found
        if (userFoundOrError.hasValue()) {
            return new ErrorOr<number>({
                error: {
                    code: "ERR_USER_ALREADY_EXISTS",
                    detail: "User with email " + email + " already exists",
                    title: "User already exists",
                    status: "409",
                },
            });
        }
        // Original query is:
        // CALL`aurora`.`SP_InsertUserIntoDatabase`(firstName, middleName, lastName, birthday, email, passwordHash, darkMode, abbreviatedFormat, currencyCode, insertedIdOutVariable);

        let conn = await pool.getConnection();
        await conn.beginTransaction();
        const [x] = await conn.execute(
            "CALL`aurora`.`SP_InsertUserIntoDatabase`(?, ?, ?, ?, ?, ?, ?, ?, ?, @insertedID);",
            [
                firstName,
                middleName,
                lastName,
                birthday,
                email,
                passwordHash,
                0,
                1,
                currencyCode,
            ]
        );
        await conn.commit();
        conn.release();
        return new ErrorOr<number>({ value: x[0][0].insertedID });
    }

    static async getSettingsById(id: number): Promise<ErrorOr<UserSettings>> {
        const connection = await dbController.getDatabaseConnection();
        const [result] = await connection.execute<RowDataPacket[]>(
            "SELECT * FROM UserDataHeader INNER JOIN UserSetting ON UserDataHeader.UserSettingID = UserSetting.UserSettingID INNER JOIN Currency ON UserSetting.UserCurrencyID = Currency.CurrencyID WHERE UserDataHeaderID = ?",
            [id]
        );

        if (result.length == 0) {
            return new ErrorOr<UserSettings>({
                error: {
                    code: "ERR_NO_USER_SETTINGS",
                    detail: "No user settings were found for id " + id,
                    status: "404",
                    title: "No settings found",
                },
            });
        }

        return new ErrorOr<UserSettings>({
            value: {
                abbreviatedFormat: result[0]["AbbreviatedFormat"],
                currency: result[0]["CurrencyCode"],
                darkMode: result[0]["DarkMode"],
            },
        });
    }

    static async getUserIdByEmail(email: string): Promise<ErrorOr<number>> {
        const connection = await dbController.getDatabaseConnection();
        const [result] = await connection.execute<RowDataPacket[]>(
            "SELECT UserCredentialID FROM UserCredential WHERE UserEmail=?;",
            [email]
        );

        if (result.length == 0)
            return new ErrorOr<number>({
                error: err.wrongCredentials,
            });

        return new ErrorOr<number>({
            value: result[0]["UserCredentialID"],
        });
    }

    static async getTransactionsByUserId(
        id: number,
        queryOptions: TransactionQueryOptions
    ): Promise<ErrorOr<UserTransaction[]>> {
        const connection = await dbController.getDatabaseConnection();

        let parameters: string[] = [id.toString()];
        let sql =
            "SELECT UserTransactionID, UserTransactionAmount, UserTransactionDate, UserTransactionTag, CurrencyCode FROM Transaction INNER JOIN Currency ON Transaction.UserTransactionCurrencyID = Currency.CurrencyID WHERE UserDataHeaderID = ? ";

        if (queryOptions.currency) {
            sql += " AND CurrencyCode = ? ";
            parameters.push(queryOptions.currency);
        }
        if (queryOptions.tag) {
            sql += " AND UserTransactionTag = ? ";
            parameters.push(queryOptions.tag);
        }
        if (queryOptions.startDate) {
            sql += " AND UserTransactionDate >= ? ";
            parameters.push(queryOptions.startDate.toISOString());
        }
        if (queryOptions.endDate) {
            sql += " AND UserTransactionDate <= ? ";
            parameters.push(queryOptions.endDate.toISOString());
        }
        if (queryOptions.minAmount) {
            sql += " AND UserTransactionAmount >= ? ";
            parameters.push(queryOptions.minAmount.toString());
        }
        if (queryOptions.maxAmount) {
            sql += " AND UserTransactionAmount <= ? ";
            parameters.push(queryOptions.maxAmount.toString());
        }

        const [result] = await connection.execute<RowDataPacket[]>(
            sql,
            parameters
        );
        let transactionArray: UserTransaction[] = [];
        if (result.length == 0) {
            return new ErrorOr<UserTransaction[]>({
                value: [],
            });
        }

        /**
         * UserTransactionAmount, UserTransactionDate, UserTransactionTag, CurrencyCode
         */
        for (let row of result) {
            transactionArray.push({
                id: row["UserTransactionID"],
                amount: row["UserTransactionAmount"],
                currency: row["CurrencyCode"],
                date: row["UserTransactionDate"].toISOString().substring(0, 10),
                tag: row["UserTransactionTag"],
            });
        }

        return new ErrorOr<UserTransaction[]>({
            value: transactionArray,
        });
    }
    static async getTransactionById(
        id: number
    ): Promise<ErrorOr<UserTransaction>> {
        const connection = await dbController.getDatabaseConnection();

        let sql =
            "SELECT UserTransactionID, UserTransactionAmount, UserTransactionDate, UserTransactionTag, CurrencyCode FROM Transaction INNER JOIN Currency ON Transaction.UserTransactionCurrencyID = Currency.CurrencyID WHERE UserTransactionID = ?";

        const [result] = await connection.execute<RowDataPacket[]>(sql, [id]);
        let transactionArray: UserTransaction[] = [];
        if (result.length == 0) {
            return new ErrorOr<UserTransaction>({
                error: err.transactionNotFound,
            });
        }

        /**
         * UserTransactionAmount, UserTransactionDate, UserTransactionTag, CurrencyCode
         */
        for (let row of result) {
            transactionArray.push({
                id: row["UserTransactionID"],
                amount: row["UserTransactionAmount"],
                currency: row["CurrencyCode"],
                date: row["UserTransactionDate"].toISOString().substring(0, 10),
                tag: row["UserTransactionTag"],
            });
        }

        return new ErrorOr<UserTransaction>({
            value: transactionArray[0],
        });
    }

    static async getCredentialsByEmail(
        email: string
    ): Promise<ErrorOr<UserCredentials>> {
        const connection = await dbController.getDatabaseConnection();

        const [result] = await connection.execute<RowDataPacket[]>(
            "SELECT * FROM UserCredential WHERE UserEmail = ?",
            [email]
        );

        if (result.length == 0) {
            return new ErrorOr<UserCredentials>({
                error: err.wrongCredentials,
            });
        }

        return new ErrorOr<UserCredentials>({
            value: {
                email: email,
                passwordHash: result[0]["UserPasswordHash"],
                lastModifiedAt: new Date(Date.now()),
            },
        });
    }

    static async exists(id: number): Promise<boolean> {
        const connection = await dbController.getDatabaseConnection();

        const [result] = await connection.execute<RowDataPacket[]>(
            "SELECT UserDataHeaderID FROM UserDataHeader WHERE UserDataHeaderID = ?",
            [id]
        );

        return result.length !== 0;
    }

    static async delete(id: number): Promise<ErrorOr<boolean>> {
        const userExists = await User.exists(id);
        if (!userExists) {
            return new ErrorOr({
                error: err.userNotFound,
            });
        }

        const connection = await dbController.getDatabaseConnection();
        await connection.execute<RowDataPacket[]>("CALL SP_DeleteUser(?);", [
            id,
        ]);

        return new ErrorOr({
            value: true,
        });
    }
}
