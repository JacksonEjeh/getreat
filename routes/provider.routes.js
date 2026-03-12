import express from "express";
import authenticate from "../middleware/authenticate.js";
import { createProviderProfile, getProviderProfile } from "../controllers/provider.controller.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.post("/profile", authenticate, authorize("provider"), createProviderProfile);
router.get("/profile", authenticate, getProviderProfile);

export default router;