import {Router} from "express";
import {Login, signUp} from "@src/controller/auth/user_auth_controller";

const router = Router();

router.post('/signin',  Login);

router.post('/signup',  signUp);

export default router;
