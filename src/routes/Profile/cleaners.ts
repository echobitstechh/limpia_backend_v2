import { cleanerEditProfile } from "@src/controller/Profile/cleaners";
import { authenticate } from "@src/middleware/auth";
import { Router } from "express";

const router = Router();

router.put("/", authenticate, cleanerEditProfile);
