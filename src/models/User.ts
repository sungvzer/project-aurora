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

        const userFoundOrError = await User.findUserByEmail(email);

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

    static async findUserByEmail(email: string): Promise<ErrorOr<number>> {
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

}
