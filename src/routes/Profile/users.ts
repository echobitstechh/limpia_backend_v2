import { editUser } from "@src/controller/Profile/users";
import { authenticate } from "@src/middleware/auth";
import { Router } from "express";

const router = Router();

router.put("/editUser", authenticate, editUser);
