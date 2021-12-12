import app from "./app";
import { endpointList } from "./utils/endpoints";
import { ENVIRONMENT } from "./utils/secrets";
const port: number = parseInt(process.env.PORT);

app.listen(port, () => {
    let showTable: boolean = JSON.parse(process.env.SHOW_TABLE),
        showEndpoints: boolean = JSON.parse(process.env.SHOW_ENDPOINTS);
    if (showTable) console.table({ Port: port, Environment: ENVIRONMENT });
    if (showEndpoints) endpointList(app);
});
