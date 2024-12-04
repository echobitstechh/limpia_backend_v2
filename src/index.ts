import { config } from "dotenv";
config();
import express, { Request, Response, NextFunction } from "express";
import nocache from 'nocache';
import session from 'express-session';
import createError, { HttpError } from 'http-errors';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { sequelize } from './config/config';



const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

app.use(nocache());
app.use(cors());

app.use(
    session({
        secret: process.env.COOKIE_KEY as string,
        resave: false,
        saveUninitialized: false,
    }),
);

sequelize
    .sync()
    .then(() => {
        console.log("database synced successfully");
    })
    .catch((err: any) => {
        console.log(err)
    })


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// // DECLARE YOUR ROUTES HERE
// app.use('/api/v1/admin', adminsRoute);
// app.use('/api/v1/user/cleaner', cleanersRoute);
// app.use('/api/v1/user/homeowner', homeownersRoute);
// app.use('/api/v1/user/propertymanager', propertymanagersRoute);
// app.use('/api/v1/property', propertiesRoute);
// app.use('/api/v1/bookings', bookingsRoute);
// app.use('/api/v1/support', supportsRoute);
// app.use('/api/v1/cleaner-assignments', assignmentsRoute);
// app.use('/api/v1/homeowner-bookings', HomeOwnerBookingsRoute);

app.get('/', (req: Request, res: Response) => {
    res.send('Limpia Backend V2 Home!');
});


// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
    next(createError(404));
});

// error handler
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Render the error page
    res.status(err.status || 500);
    res.render('error');
});

const port = process.env.PORT || 3000;
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



