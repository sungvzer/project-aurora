import express, { NextFunction, Request, Response } from 'express';
import { appNameArt } from './utils/ascii';
import { defaultError } from './routes/common/default';
import { requireAuthentication } from './middleware/authentication';
import { setJsonAPIType, SingleResourceResponse } from './utils/jsonAPI';
import { verifyJsonApiRequest } from './middleware/jsonAPI';
import { postSignup } from './routes/post/signup';
import { getRoutes } from './routes/get/routes';
import { postLogout } from './routes/post/logout';
import { postLogin } from './routes/post/login';
import { regenerateToken } from './routes/post/refreshToken';
import userRouter from './routers/user';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import { getVerify } from './routes/get/verify';
import { requestPasswordReset } from './routes/post/requestPasswordReset';
import { resetPassword } from './routes/post/resetPassword';
import colors from 'colors/safe';
import { invalidateSessions } from './routes/post/invalidateSessions';

const environmentCheckup = (): void => {
    console.log(colors.yellow('INFO: Running environment checkup'));
    const environmentVariables = [
        'PORT',
        'MYSQL_HOST',
        'MYSQL_PORT',
        'MYSQL_PASSWORD_DEV',
        'MYSQL_PASSWORD_PROD',
        'REDIS_HOST',
        'REDIS_PORT',
        'SHOW_ENDPOINTS',
        'SHOW_TABLE',
        'SHOW_TITLE_AS_ASCII_ART',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'SMTP_USER',
        'SMTP_PASS',
        'SMTP_SERVER',
        'SMTP_PORT',
    ];

    const missingVariables: string[] = [];
    for (const variable of environmentVariables) {
        if (process.env[variable] == null) {
            missingVariables.push(variable);
        }
    }
    if (missingVariables.length !== 0) {
        console.log(colors.red('ERROR: environment checkup failed'));
        console.log('These variables should be set:');
        console.log(JSON.stringify(missingVariables));
        process.exit();
    }

    console.log(colors.green('SUCCESS: environment checkup completed'));
};
environmentCheckup();

if (JSON.parse(process.env.SHOW_TITLE_AS_ASCII_ART)) console.log(appNameArt);
else console.log('Aurora v1.0');

const app = express();

/**
 * Allow CORS
 */
const whitelist = ['http://breeze:4500', 'http://localhost:4500', 'http://192.168.1.214:4500', '*'];
const corsOptions: CorsOptions = {
    credentials: true,
    origin: (origin, callback) => {
        if (whitelist.includes(origin) || whitelist.includes('*')) {
            return callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};

app.use(cors(corsOptions));

/**
 * Libraries and middleware
 */
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ type: ['application/vnd.api+json', 'application/json'] }));
app.use(express.text());
app.use(setJsonAPIType);

/**
 * Error Handling
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
    const response: SingleResourceResponse = new SingleResourceResponse('error');
    if (!err) {
        next();
    }
    if (err instanceof SyntaxError) {
        const error = {
            status: undefined,
            message: undefined,
            type: undefined,
            ...err,
        };
        if (error.status === 400 && 'body' in err) {
            response
                .addError({
                    title: 'Malformed JSON body',
                    detail: 'A request was sent with a malformed JSON body. Please check the request and try again.',
                    status: '400',
                    code: 'ERR_MALFORMED_JSON',
                    source: req.body,
                })
                .addLink('JSON standard', 'https://www.json.org/json-en.html');
            res.status(400).json(response.close());
        }
    }
});

/**
 * Routes
 */
app.post('/signup', verifyJsonApiRequest, postSignup);
app.get('/routes', getRoutes);
app.get('/verify', requireAuthentication, getVerify);
app.post('/login', verifyJsonApiRequest, postLogin);
app.post('/logout', requireAuthentication, postLogout);
app.post('/refreshToken', regenerateToken);
app.post('/request_password_reset', verifyJsonApiRequest, requestPasswordReset);
app.post('/reset_password', verifyJsonApiRequest, resetPassword);
app.post('/invalidate_sessions', requireAuthentication, invalidateSessions);

app.use('/users', userRouter);
app.use('*', defaultError);

app.disable('x-powered-by');

export default app;
