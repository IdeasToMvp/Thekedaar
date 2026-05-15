import { Router } from "express";
import { handleWorkersFeedGet } from "../handlers/workersFeed.handler";
import { optionalSession } from "../middleware/optionalSession";

const router = Router();

router.get("/feed", optionalSession, handleWorkersFeedGet);

export default router;
