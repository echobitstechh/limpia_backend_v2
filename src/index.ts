import { config } from "dotenv";
config();
import express, { Request, Response, NextFunction } from "express";
import nocache from "nocache";
import session from "express-session";
import createError, { HttpError } from "http-errors";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { sequelize } from "./config/config";
import expressOasGenerator from "express-oas-generator";
import swaggerUi from "swagger-ui-express";
import * as fs from "fs";

import userRoute from "./routes/user";
import bookingRoute from "./routes/booking";
import enumRoute from "./routes/enum";

import { swaggerConfig } from "@src/config/swagger_config";

const app = express();

expressOasGenerator.handleResponses(app, swaggerConfig);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(nocache());
app.use(cors());
app.use(cookieParser());
app.use(logger("dev"));

// Session setup
app.use(
    session({
        secret: process.env.COOKIE_KEY as string,
        resave: false,
        saveUninitialized: false,
    })
);


sequelize
    .sync()
    .then(() => {
        console.log("Database synced successfully");
    })
    .catch((err: any) => {
        console.error(err);
    });


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");


app.use(express.static(path.join(__dirname, "../public")));


const swaggerFilePath = path.resolve(__dirname, "./docs/swagger_output.json");
if (fs.existsSync(swaggerFilePath)) {
    const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, "utf8"));
    app.use("/api/v1/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log("Swagger UI available at /api/v1/api-docs");
} else {
    console.error("Swagger output file not found. Ensure documentation is generated.");
}


app.use("/api/v1/auth", userRoute);
app.use("/api/v1/booking", bookingRoute);
app.use("/api/v1/enum", enumRoute);


app.get("/", (req: Request, res: Response, next) => {
    res.send("Limpia Backend V2 Home!");
    next()
});

// Catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
    next(createError(404));
});

// Error handler
app.use((err: HttpError, req: Request, res: Response, next) => {
    if (!res.headersSent) {
        res.status(err.status || 500).json({
            status: err.status || 500,
            message: err.message,
        });
    }
    next()
});


expressOasGenerator.handleRequests();

const port = process.env.PORT || 3000;


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
