import { RowDataPacket } from 'mysql2';
import * as dbController from '../controllers/databaseController';
import { hashPassword } from '../utils/argon';
import CurrencyCode from './CurrencyCode';
import ErrorModel from './APIError';
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
    static async create(user: UserDatabaseInsertModel): Promise<ErrorModel> {
        const connection = await dbController.getDatabaseConnection();
        const firstName = user.firstName;
        const middleName = user.middleName;
        const lastName = user.lastName;
        const email = user.email;
        const birthday = user.birthday;
        const passwordHash = await hashPassword(user.plainTextPassword);
        const currencyCode = user.currencyCode;

        const userFoundOrError = await User.getUserIdByEmail(email);

        // If a user could be found
        if (userFoundOrError.hasValue()) {
            return { error: true, message: `User with email ${email} already exists` };
        }
        // Original query is: 
        // CALL`aurora`.`SP_InsertUserIntoDatabase`(firstName, middleName, lastName, birthday, email, passwordHash, darkMode, abbreviatedFormat, currencyCode, insertedIdOutVariable);

        await connection.beginTransaction();
        await connection.execute("CALL`aurora`.`SP_InsertUserIntoDatabase`(?, ?, ?, ?, ?, ?, ?, ?, ?, @insertedID);", [firstName, middleName, lastName, birthday, email, passwordHash, 0, 1, currencyCode]);
        await connection.commit();
        return { error: false, message: `User created` };
    }

    static async getSettingsById(id: number): Promise<ErrorOr<UserSettings>> {
        const connection = await dbController.getDatabaseConnection();
        const [result] = await connection.execute<RowDataPacket[]>('SELECT * FROM UserDataHeader INNER JOIN UserSetting ON UserDataHeader.UserSettingID = UserSetting.UserSettingID WHERE UserDataHeaderID = ?', [id]);

        if (result.length == 0) {
            return new ErrorOr<UserSettings>({
                isError: true,
                message: "No settings found for user " + id,
                value: null
            });
        }

        return new ErrorOr<UserSettings>({
            isError: false,
            message: null,
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
                isError: true,
                message: `No user with email ${email} found`,
                value: null,
            });

        return new ErrorOr<number>({
            value: result[0]['UserCredentialID'],
            isError: false,
            message: null
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
                isError: false,
                message: null,
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
            isError: false,
            message: null,
            value: transactionArray
        });
    }

    static async getCredentialsByEmail(email: string): Promise<ErrorOr<UserCredentials>> {
        const connection = await dbController.getDatabaseConnection();

        const [result] = await connection.execute<RowDataPacket[]>("SELECT * FROM UserCredential WHERE UserEmail = ?", [email]);

        if (result.length == 0) {
            return new ErrorOr<UserCredentials>({
                isError: true,
                message: `No user credentials found for email ${email}`,
                value: null,
            });
        }

        return new ErrorOr<UserCredentials>({
            isError: false,
            message: null,
            value: {
                "email": email,
                "passwordHash": result[0]['UserPasswordHash'],
                "lastModifiedAt": new Date(Date.now()),
            },
        });
    }
}
