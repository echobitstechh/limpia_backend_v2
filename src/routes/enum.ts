import {Router} from "express";
import {getEnums} from "@src/controller/enums_controller";


const router = Router();

router.get('/enums', getEnums);

export default router;
