import express from 'express';
import { endpointList } from './utils/endpoints';
import body_parser from 'body-parser';
import { ENVIRONMENT } from './utils/secrets';
import { appNameArt } from './utils/ascii';

if (JSON.parse(process.env.SHOW_TITLE_AS_ASCII_ART))
    console.log(appNameArt);
else
    console.log("Aurora v1.0");

const app = express();
const port = parseInt(process.env.PORT);


/**
 * Allow CORS
 */
app.use((req, res, next): void => {
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

/**
 * Libraries
 */
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use(body_parser.text());

/**
 * Routes
 */

/**
 * Error Handling
 */
app.use((err: Error, req, res, next): void => {
    if (err instanceof SyntaxError) {
        const error = { status: undefined, message: undefined, type: undefined, ...err };
        if (error.status === 400 && 'body' in err) {
            res.status(400).json({ error: "bad json", message: error.message, type: error.type, body: req.body });
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
