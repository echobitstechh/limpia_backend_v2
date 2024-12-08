import { homeOwnerAction } from "@src/controller/HomeOwner/homeowner";
import { authenticate } from "@src/middleware/auth";
import { Router } from "express";

const router = Router();

router.post("/homeownerAction", authenticate, homeOwnerAction);

export default router;
