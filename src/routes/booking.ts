import {Router} from "express";
import {actionBooking, createBooking, getBookings, getNearByBookings} from "@src/controller/bookings_controller";
import {authenticate} from "@src/middleware/auth";


const router = Router();

router.post('/create', authenticate, createBooking);

router.get('/', authenticate, getBookings);

router.get('/nearby', authenticate, getNearByBookings);

router.post('/action', authenticate, actionBooking);


export default router;
