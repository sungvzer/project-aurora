import { RowDataPacket } from 'mysql2';
import * as dbController from '../controllers/databaseController';
import { hashPassword } from '../utils/argon';
import CurrencyCode from './CurrencyCode';
import ErrorModel from './ErrorModel';

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

        const userId = await User.findUserByEmail(email);
        if (userId != -1) {
            return { error: true, message: `User with email ${email} already exists` };
        }
        // Original query is: 
        // CALL`aurora`.`SP_InsertUserIntoDatabase`(firstName, middleName, lastName, birthday, email, passwordHash, darkMode, abbreviatedFormat, currencyCode, insertedIdOutVariable);

        await connection.beginTransaction();
        await connection.execute("CALL`aurora`.`SP_InsertUserIntoDatabase`(?, ?, ?, ?, ?, ?, ?, ?, ?, @insertedID);", [firstName, middleName, lastName, birthday, email, passwordHash, 0, 1, currencyCode]);
        await connection.commit();
        return { error: false, message: `User created` };
    }

    static async findUserByEmail(email: string): Promise<number> {
        const connection = await dbController.getDatabaseConnection();
        const [result] = await connection.execute<RowDataPacket[]>('SELECT UserCredentialID FROM UserCredential WHERE UserEmail=?;', [email]);

        if (result.length > 0)
            return result[0]['UserCredentialID'];
        return -1;
    }

}
