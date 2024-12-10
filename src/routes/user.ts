import {Router} from "express";
import {Login, refreshAccessToken, signUp} from "@src/controller/user_auth_controller";

const router = Router();

router.post('/signin',  Login as any);

router.post('/signup',  signUp as any);

router.post('/refresh-token', refreshAccessToken as any);

export default router;
