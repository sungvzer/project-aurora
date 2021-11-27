import express, { Request, Response, NextFunction } from 'express';
import { endpointList } from './utils/endpoints';
import { ENVIRONMENT } from './utils/secrets';
import { appNameArt } from './utils/ascii';
import { postSignup, postLogin, getUserSettings, postLogout, getUserTransactions } from './controllers/userController';
import { getRoutes } from './controllers/apiController';
import { regenerateToken, requireAuthentication } from './controllers/authenticationController';
import { setJsonAPIType, SingleResourceResponse } from './utils/jsonAPI';
import { verifyJsonApiRequest } from './controllers/jsonAPIController';

if (JSON.parse(process.env.SHOW_TITLE_AS_ASCII_ART))
    console.log(appNameArt);
else
    console.log("Aurora v1.0");

const app = express();
const port: number = parseInt(process.env.PORT);


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
app.get('/users/:id/settings', requireAuthentication, getUserSettings);
app.get('/users/:id/transactions', requireAuthentication, getUserTransactions);

/**
 * Main Point of the application
 */
app.listen(port, () => {
    let showTable: boolean = JSON.parse(process.env.SHOW_TABLE),
        showEndpoints: boolean = JSON.parse(process.env.SHOW_ENDPOINTS);
    if (showTable)
        console.table({ "Port": port, "Environment": ENVIRONMENT });
    if (showEndpoints)
        endpointList(app);
});
