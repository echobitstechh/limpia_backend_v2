import {Router} from "express";
import {createBooking} from "@src/controller/booking/bookings_controller";


const router = Router();

router.post('/create', createBooking);


export default router;
