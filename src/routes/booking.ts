import {Router} from "express";
import {
    actionBooking,
    createBooking,
    getBookings,
    getCleanerBookings,
    getNearByBookings
} from "@src/controller/bookings_controller";
import {authenticate} from "@src/middleware/auth";


const router = Router();

router.post('/create', authenticate, createBooking as any);

router.get('/', authenticate, getBookings as any);

router.get('/nearby', authenticate, getNearByBookings as any);

router.post('/action', authenticate, actionBooking as any);

router.get('/cleaner-bookings', authenticate, getCleanerBookings as any);



export default router;
