import { Response } from 'superagent';
import request from 'supertest';
import app from '../src/app';
import CurrencyCode from '../src/models/CurrencyCode';
import User from '../src/models/User';
import * as err from '../src/utils/errors';

const userEmail = 'test_user@example.com';
const userPassword = 'testPassword123';

let signupTemplate = {
    data: {
        type: 'SignupData',
        attributes: {},
    },
};
let loginTemplate = {
    data: {
        type: 'UserCredentials',
        attributes: {},
    },
};

let logoutTemplate = {
    data: {
        type: 'RefreshToken',
        attributes: {},
    },
};

let signupAttributes = {
    email: userEmail,
    password: userPassword,
    lastName: 'Mirco',
    firstName: 'Marco',
    currency: 'USD',
    birthday: '1995-12-19',
    middleName: 'Morco',
};
let loginAttributes = {
    email: userEmail,
    password: userPassword,
};

let logoutAttributes = {
    refreshToken: '',
};

const randomString = (length = 8) => {
    // Declare all characters
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Pick characers randomly
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
};

describe('User account journey', () => {
    let deletedIsError: boolean = false;
    let idIsError: boolean = false;
    beforeAll(async () => {
        let idOrError = await User.getUserIdByEmail(userEmail);
        if (!idOrError.isError()) {
            let deletedOrError = await User.delete(idOrError.value);
            deletedIsError = deletedOrError.isError();
        }
        idIsError = idOrError.isError();
    });

    afterAll(async () => {
        let idOrError = await User.getUserIdByEmail(userEmail);
        if (!idOrError.isError()) {
            let deletedOrError = await User.delete(idOrError.value);
            deletedIsError = deletedOrError.isError();
        }
        idIsError = idOrError.isError();
    });

    test('Pre-test deletion is successful', () => {
        expect(deletedIsError).toBe(false);
    });

    describe('Signup', () => {
        let req: { data: any };

        beforeEach(async () => {
            let idOrError = await User.getUserIdByEmail(userEmail);
            if (!idOrError.isError()) {
                let deletedOrError = await User.delete(idOrError.value);
                deletedIsError = deletedOrError.isError();
            }
            idIsError = idOrError.isError();

            // Reset request before every test
            req = { ...signupTemplate };
            req.data.attributes = signupAttributes;
        });

        describe('Blank checks', () => {
            const testWithout = async (parameter: string): Promise<void> => {
                let value = req.data.attributes[parameter];
                delete req.data.attributes[parameter];

                let response = await request(app).post('/signup').send(req);

                expect(response.statusCode).toBe(400);
                expect(response.body.data).toBeUndefined();
                expect(response.body.errors).not.toBeUndefined();
                expect(response.body.errors).toEqual(expect.arrayContaining([]));

                req.data.attributes[parameter] = value;
                return;
            };

            test('Blank email', async () => {
                await testWithout('email');
            });
            test('Blank middle name should proceed normally', async () => {
                let value = req.data.attributes.middleName;
                delete req.data.attributes.middleName;

                let response = await request(app).post('/signup').send(req);

                expect(response.statusCode).toBe(201);
                expect(response.body.data).not.toBeUndefined();
                expect(response.body.errors).toBeUndefined();

                req.data.attributes.middleName = value;
                return;
            });
            test('Blank password', async () => {
                await testWithout('password');
            });
            test('Blank first name', async () => {
                await testWithout('firstName');
            });
            test('Blank last name', async () => {
                await testWithout('lastName');
            });
            test('Blank birthday', async () => {
                await testWithout('birthday');
            });
            test('Blank currency code', async () => {
                await testWithout('currency');
            });
        });

        describe('Validity checks', () => {
            const testChanging = async <T>(attribute: string, to: T): Promise<Response> => {
                let from = req.data.attributes[attribute];
                req.data.attributes[attribute] = to;

                let response = await request(app).post('/signup').send(req);

                expect(response.statusCode).toBe(400);
                expect(response.body.data).toBeUndefined();
                expect(response.body.errors).not.toBeUndefined();

                req.data.attributes[attribute] = from;
                return response;
            };

            test('Email', async () => {
                let response = await testChanging('email', 'testing123');
                expect(response.body.errors).toContainEqual(err.invalidEmail);
            });
            test('Currency code', async () => {
                let response = await testChanging('currency', 'testing123');
                expect(response.body.errors).toContainEqual(err.invalidCurrencyCode);
            });

            test('Date', async () => {
                let response = await testChanging('birthday', 'testing123');
                expect(response.body.errors).toContainEqual(err.invalidDate);
            });
        });

        test('Signup is successful', async () => {
            let response = await request(app).post('/signup').send(req);

            expect(response.statusCode).toBe(201);
            expect(response.body).not.toBeUndefined();
            expect(response.body.errors).toBeUndefined();
            expect(response.body.data).not.toBeUndefined();
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('attributes');
            expect(response.body.data).toHaveProperty('type');

            for (let key in signupTemplate.data.attributes) {
                if (!signupTemplate.data.attributes.hasOwnProperty(key) || key === 'password') {
                    break;
                }
                expect(response.body.data.attributes).toHaveProperty(key);
            }
        });

        test('Signup fails if email already exists', async () => {
            await request(app).post('/signup').send(req);
            let response = await request(app).post('/signup').send(req);

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('errors');
            expect(response.body).not.toHaveProperty('data');
            expect(response.body.errors).toContainEqual({
                code: 'ERR_USER_ALREADY_EXISTS',
                detail: 'User with email ' + userEmail + ' already exists',
                title: 'User already exists',
                status: '409',
            });
        });
    });

    describe('Login/Logout', () => {
        let req: { data: any };

        let accessToken = '';
        let refreshToken = '';

        describe('Login', () => {
            beforeEach(async () => {
                // Reset request before every test
                req = { ...loginTemplate };
                req.data.attributes = loginAttributes;
            });

            // Logout after every test so it doesn't clog up Redis
            afterEach(async () => {
                let logoutResponse = await request(app)
                    .post('/logout')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                        data: {
                            type: 'RefreshToken',
                            attributes: {
                                refreshToken: refreshToken,
                            },
                        },
                    });
            });

            describe('Empty checks', () => {
                const testWithout = async (parameter: string): Promise<Response> => {
                    let value = req.data.attributes[parameter];
                    delete req.data.attributes[parameter];

                    let response = await request(app).post('/login').send(req);

                    expect(response.statusCode).toBe(400);
                    expect(response.body.data).toBeUndefined();
                    expect(response.body.errors).not.toBeUndefined();
                    expect(response.body.errors).toEqual(expect.arrayContaining([]));

                    req.data.attributes[parameter] = value;
                    return response;
                };

                test('Blank email', async () => {
                    let response = await testWithout('email');
                    expect(response.body.errors).toContainEqual(err.blankEmail);
                });
                test('Blank password', async () => {
                    let response = await testWithout('password');
                    expect(response.body.errors).toContainEqual(err.blankPassword);
                });
            });
            describe('Validity checks', () => {
                const testChanging = async <T>(
                    attribute: string,
                    to: T,
                    expectedStatusCode = 400,
                ): Promise<Response> => {
                    let from = req.data.attributes[attribute];
                    req.data.attributes[attribute] = to;

                    let response = await request(app).post('/login').send(req);

                    expect(response.statusCode).toBe(expectedStatusCode);
                    expect(response.body.data).toBeUndefined();
                    expect(response.body.errors).not.toBeUndefined();

                    req.data.attributes[attribute] = from;
                    return response;
                };

                test('Invalid Email', async () => {
                    let response = await testChanging('email', 'testing123');
                    expect(response.body.errors).toContainEqual(err.invalidEmail);
                });

                test('Non-existing user', async () => {
                    let response = await testChanging(
                        'email',
                        `${randomString(10)}@${randomString(5)}.com`,
                        404,
                    );
                    expect(response.body.errors).toContainEqual(err.wrongCredentials);
                });

                test('Wrong password', async () => {
                    let response = await testChanging('password', `${randomString(15)}`, 401);
                    expect(response.body.errors).toContainEqual(err.wrongCredentials);
                });
            });

            test('Login successfully', async () => {
                let response = await request(app).post('/login').send(req);
                expect(response.statusCode).toBe(200);
                expect(response.body).not.toHaveProperty('errors');
                expect(response.body).toHaveProperty('data');
                expect(response.body.data).toHaveProperty('id');
                expect(response.body.data).toHaveProperty('type');
                expect(response.body.data).toHaveProperty('attributes');

                expect(response.body.data.attributes).toHaveProperty('accessToken');
                expect(response.body.data.attributes).toHaveProperty('refreshToken');
                accessToken = response.body.data.attributes.accessToken;
                refreshToken = response.body.data.attributes.refreshToken;
            });
        });

        describe('Logout', () => {
            beforeEach(async () => {
                // Reset request before every test
                req = { ...logoutTemplate };
                req.data.attributes = logoutAttributes;

                // Login before each test

                let loginReq = { ...loginTemplate };
                loginReq.data.attributes = loginAttributes;
                let response = await request(app).post('/login').send(loginReq);
                accessToken = response.body.data.attributes.accessToken;
                refreshToken = response.body.data.attributes.refreshToken;
                req.data.attributes.refreshToken = refreshToken;
            });

            // Logout after every test so it doesn't clog up Redis
            afterEach(async () => {
                let logoutResponse = await request(app)
                    .post('/logout')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                        data: {
                            type: 'RefreshToken',
                            attributes: {
                                refreshToken: refreshToken,
                            },
                        },
                    });
            });

            describe('Empty checks', () => {
                const testWithout = async (parameter: string): Promise<Response> => {
                    let value = req.data.attributes[parameter];
                    delete req.data.attributes[parameter];

                    let response = await request(app)
                        .post('/logout')
                        .set('Authorization', `Bearer ${accessToken}`)
                        .send(req);

                    expect(response.statusCode).toBe(400);
                    expect(response.body.data).toBeUndefined();
                    expect(response.body.errors).not.toBeUndefined();
                    expect(response.body.errors).toEqual(expect.arrayContaining([]));

                    req.data.attributes[parameter] = value;
                    return response;
                };

                test('Blank refreshToken', async () => {
                    let response = await testWithout('refreshToken');
                    expect(response.body.errors).toContainEqual(err.noRefreshToken);
                });
                test('No authorization token', async () => {
                    let response = await request(app).post('/logout').send(req);
                    expect(response.statusCode).toBe(400);
                    expect(response.body.data).toBeUndefined();
                    expect(response.body.errors).not.toBeUndefined();
                    expect(response.body.errors).toEqual(expect.arrayContaining([]));
                    expect(response.body.errors).toContainEqual(err.missingAuthorization);
                });
            });
            describe('Validity checks', () => {
                test('Invalid Authorization/No valid JWT', async () => {
                    let response = await request(app)
                        .post('/logout')
                        .set('Authorization', `Bearer djwoeihwgrf823hrngf2ync873rcy782tb78`)
                        .send(req);
                    expect(response.statusCode).toBe(403);
                    expect(response.body.data).toBeUndefined();
                    expect(response.body.errors).not.toBeUndefined();
                    expect(response.body.errors).toEqual(expect.arrayContaining([]));
                    expect(response.body.errors).toContainEqual(err.genericJWT);
                });
            });
            test('Logout successfully', async () => {
                let response = await request(app)
                    .post('/logout')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send(req);
                expect(response.statusCode).toBe(200);
                expect(response.body).not.toHaveProperty('errors');
                expect(response.body).toHaveProperty('meta');
                expect(response.body.meta).toHaveProperty('message');
                expect(response.body.meta.message).toBe('User logged out successfully');
            });
        });
    });

    describe('Deletion', () => {
        let id = '';
        let req: { data: any };
        let accessToken = '',
            refreshToken = '';

        beforeEach(async () => {
            let loginReq = { ...loginTemplate };
            loginReq.data.attributes = loginAttributes;
            let response = await request(app).post('/login').send(loginReq);
            accessToken = response.body.data.attributes.accessToken;
            refreshToken = response.body.data.attributes.refreshToken;
            id = response.body.data.id;
        });

        afterEach(async () => {
            await request(app)
                .post('/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    data: {
                        type: 'RefreshToken',
                        attributes: {
                            refreshToken: refreshToken,
                        },
                    },
                });
        });

        describe('Authorization', () => {
            test('Fails if no bearer token is provided', async () => {
                let response = await request(app).delete(`/users/${id}`).send();

                expect(response.statusCode).toBe(400);
                expect(response.body).not.toHaveProperty('data');
                expect(response.body).toHaveProperty('errors');
                expect(response.body.errors).toContainEqual(err.missingAuthorization);
            });

            test('Fails if requested user id is not the same as logged user id', async () => {
                // Ensure at least another user is there
                let newEmail = `${randomString()}@${randomString(3)}.com`;
                let idOrError = await User.create({
                    plainTextPassword: 'password',
                    middleName: '',
                    birthday: new Date(Date.now()),
                    currencyCode: CurrencyCode.EUR,
                    email: newEmail,
                    firstName: 'test',
                    lastName: 'user',
                });
                let newID = idOrError.value;
                let response = await request(app)
                    .delete(`/users/${newID}`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send();

                expect(response.statusCode).toBe(403);
                expect(response.body).not.toHaveProperty('data');
                expect(response.body).toHaveProperty('errors');
                expect(response.body.errors).toContainEqual(err.userIdMismatch);
                await User.delete((await User.getUserIdByEmail(newEmail)).value);
            });
        });
        test('User gets deleted successfully', async () => {
            let response = await request(app)
                .delete(`/users/${id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send();

            expect(response.statusCode).toBe(204);
            expect(response.body).toStrictEqual({});
        });
    });
});
