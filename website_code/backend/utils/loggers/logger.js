import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// define __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function attachmentRoutingLogger(app, routerPath, router, logsFileName) {
    const logsDirectory = path.join(__dirname, "../../logs");
    if (!fs.existsSync(logsDirectory)) {
        fs.mkdirSync(logsDirectory, { recursive: true });
    }

    const logsStream = fs.createWriteStream(
        path.join(logsDirectory, logsFileName),
        { flags: "a" }
    );

    // Attach logging middleware only. Route mounting happens in app.controller.js.
    app.use(routerPath, morgan("combined", { stream: logsStream }));
    app.use(routerPath, morgan("dev"));
}
