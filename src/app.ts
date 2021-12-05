import express, { Request, Response, NextFunction } from 'express';
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

if (JSON.parse(process.env.SHOW_TITLE_AS_ASCII_ART))
    console.log(appNameArt);
else
    console.log("Aurora v1.0");

const app = express();


/**
 * Allow CORS
 */
app.use((req: Request, res: Response, next: NextFunction): void => {
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

/**
 * Libraries and middleware
 */
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ type: ["application/vnd.api+json", "application/json"] }));
app.use(express.text());
app.use(setJsonAPIType);


/**
 * Error Handling
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
    let response: SingleResourceResponse = new SingleResourceResponse("error");

    if (err instanceof SyntaxError) {
        const error = { status: undefined, message: undefined, type: undefined, ...err };
        if (error.status === 400 && 'body' in err) {
            response.addError({
                "title": "Malformed JSON body",
                "detail": "A request was sent with a malformed JSON body. Please check the request and try again.",
                "status": "400",
                "code": "ERR_MALFORMED_JSON",
                "source": req.body
            }).addLink("JSON standard", "https://www.json.org/json-en.html");
            res.status(400).json(
                response.close()
            );
        }
    }
});


/**
 * Routes
 */
app.post('/signup', verifyJsonApiRequest, postSignup);
app.get('/routes', getRoutes);
app.post('/login', verifyJsonApiRequest, postLogin);
app.post('/logout', requireAuthentication, verifyJsonApiRequest, postLogout);
app.post('/refreshToken', verifyJsonApiRequest, regenerateToken);

app.use('/users', userRouter);
app.use('*', defaultError);

app.disable('x-powered-by');

export default app;
