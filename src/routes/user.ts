import { Router } from "express";
import {
  editUser,
  Login,
  refreshAccessToken,
  signOut,
  signUp,
} from "@src/controller/user_auth_controller";
import { authenticate } from "@src/middleware/auth";

const router = Router();

router.post("/signin", Login as any);

router.post("/signup", signUp as any);

router.post("/refresh-token", refreshAccessToken as any);

router.put("/editUser", authenticate, editUser as any);

router.post("/signout", authenticate, signOut as any);

export default router;
