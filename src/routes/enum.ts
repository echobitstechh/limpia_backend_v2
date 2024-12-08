import {Router} from "express";
import {getEnums} from "@src/controller/enums_controller";


const router = Router();

router.get('/enums', getEnums as any);

export default router;
