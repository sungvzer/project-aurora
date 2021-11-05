import express, { Request, Response, NextFunction } from 'express';
import { endpointList } from './utils/endpoints';
import { ENVIRONMENT } from './utils/secrets';
import { appNameArt } from './utils/ascii';
import { postSignup, postLogin, getUserSettings, postLogout } from './controllers/userController';
import { getRoutes } from './controllers/apiController';
import { regenerateToken, requireAuthentication } from './controllers/authenticationController';

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
 * Libraries
 */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.text());

/**
 * Routes
 */
app.post('/signup', postSignup);
app.get('/routes', getRoutes);
app.post('/login', postLogin);
app.post('/logout', requireAuthentication, postLogout);
app.post('/refreshToken', regenerateToken);
app.get('/users/:id/settings', requireAuthentication, getUserSettings);

/**
 * Error Handling
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
    if (err instanceof SyntaxError) {
        const error = { status: undefined, message: undefined, type: undefined, ...err };
        if (error.status === 400 && 'body' in err) {
            res.status(400).json({
                error: true,
                message: "Malformed JSON body"
            });
        }
    }
});

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
