import { RowDataPacket } from 'mysql2';
import * as dbController from '../controllers/databaseController';
import { hashPassword } from '../utils/argon';
import CurrencyCode from './CurrencyCode';
import ErrorOr from './ErrorOr';

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
    currency: CurrencyCode,
    darkMode: boolean,
    abbreviatedFormat: boolean;
}

export interface UserCredentials {
    email: string;
    passwordHash: string;
    lastModifiedAt: Date;
}

export interface UserTransaction {
    amount: number;
    currency: CurrencyCode;
    date: string;
    tag: string;
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
    static async create(user: UserDatabaseInsertModel): Promise<ErrorOr<number>> {
        const connection = await dbController.getDatabaseConnection();
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
                }
            });
        }
        // Original query is: 
        // CALL`aurora`.`SP_InsertUserIntoDatabase`(firstName, middleName, lastName, birthday, email, passwordHash, darkMode, abbreviatedFormat, currencyCode, insertedIdOutVariable);

        await connection.beginTransaction();
        const [x] = await connection.execute("CALL`aurora`.`SP_InsertUserIntoDatabase`(?, ?, ?, ?, ?, ?, ?, ?, ?, @insertedID);", [firstName, middleName, lastName, birthday, email, passwordHash, 0, 1, currencyCode]);
        await connection.commit();
        return new ErrorOr<number>(
            { value: x[0][0].insertedID }
        );
    }

    static async getSettingsById(id: number): Promise<ErrorOr<UserSettings>> {
        const connection = await dbController.getDatabaseConnection();
        const [result] = await connection.execute<RowDataPacket[]>('SELECT * FROM UserDataHeader INNER JOIN UserSetting ON UserDataHeader.UserSettingID = UserSetting.UserSettingID WHERE UserDataHeaderID = ?', [id]);

        if (result.length == 0) {
            return new ErrorOr<UserSettings>({
                error: {
                    code: "ERR_NO_USER_SETTINGS",
                    detail: "No user settings were found for id " + id,
                    status: "404",
                    title: "No settings found"
                }
            });
        }

        return new ErrorOr<UserSettings>({
            value: {
                abbreviatedFormat: result[0]['AbbreviatedFormat'],
                currency: result[0]['UserCurrencyID'],
                darkMode: result[0]['DarkMode']
            }
        });
    }

    static async getUserIdByEmail(email: string): Promise<ErrorOr<number>> {
        const connection = await dbController.getDatabaseConnection();
        const [result] = await connection.execute<RowDataPacket[]>('SELECT UserCredentialID FROM UserCredential WHERE UserEmail=?;', [email]);

        if (result.length == 0)
            return new ErrorOr<number>({
                error: {
                    code: "ERR_NO_USER_FOUND",
                    detail: `No user with email ${email} could be found`,
                    status: "404",
                    title: "No user found"
                }
            });

        return new ErrorOr<number>({
            value: result[0]['UserCredentialID'],
        });
    }

    static async getTransactionsById(id: number, queryOptions: TransactionQueryOptions): Promise<ErrorOr<UserTransaction[]>> {
        const connection = await dbController.getDatabaseConnection();

        let parameters: string[] = [id.toString(),];
        let sql = 'SELECT UserTransactionAmount, UserTransactionDate, UserTransactionTag, CurrencyCode FROM Transaction INNER JOIN Currency ON Transaction.UserTransactionCurrencyID = Currency.CurrencyID WHERE UserDataHeaderID = ? ';

        if (queryOptions.currency) {
            sql += ' AND CurrencyCode = ? ';
            parameters.push(queryOptions.currency);
        }
        if (queryOptions.tag) {
            sql += ' AND UserTransactionTag = ? ';
            parameters.push(queryOptions.tag);
        }
        if (queryOptions.startDate) {
            sql += ' AND UserTransactionDate >= ? ';
            parameters.push(queryOptions.startDate.toISOString());
        }
        if (queryOptions.endDate) {
            sql += ' AND UserTransactionDate <= ? ';
            parameters.push(queryOptions.endDate.toISOString());
        }
        if (queryOptions.minAmount) {
            sql += ' AND UserTransactionAmount >= ? ';
            parameters.push(queryOptions.minAmount.toString());
        }
        if (queryOptions.maxAmount) {
            sql += ' AND UserTransactionAmount <= ? ';
            parameters.push(queryOptions.maxAmount.toString());
        }

        const [result] = await connection.execute<RowDataPacket[]>(sql, parameters);
        let transactionArray: UserTransaction[] = [];
        if (result.length == 0) {
            return new ErrorOr<UserTransaction[]>({
                value: []
            });
        }

        /**
         * UserTransactionAmount, UserTransactionDate, UserTransactionTag, CurrencyCode
         */
        for (let row of result) {
            transactionArray.push({ amount: row['UserTransactionAmount'], currency: row['CurrencyCode'], date: row['UserTransactionDate'].toISOString(), tag: row['UserTransactionTag'] });
        }

        return new ErrorOr<UserTransaction[]>({
            value: transactionArray
        });
    }

    static async getCredentialsByEmail(email: string): Promise<ErrorOr<UserCredentials>> {
        const connection = await dbController.getDatabaseConnection();

        const [result] = await connection.execute<RowDataPacket[]>("SELECT * FROM UserCredential WHERE UserEmail = ?", [email]);

        if (result.length == 0) {
            return new ErrorOr<UserCredentials>({
                error: {
                    code: "ERR_NO_USER_FOUND",
                    detail: `No user with email ${email} could be found`,
                    status: "404",
                    title: "No user found"
                }
            });
        }

        return new ErrorOr<UserCredentials>({
            value: {
                "email": email,
                "passwordHash": result[0]['UserPasswordHash'],
                "lastModifiedAt": new Date(Date.now()),
            },
        });
    }
}
