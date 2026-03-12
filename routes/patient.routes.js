import express from "express";
import { createFeelingEntry, createMaternalHealth, createNutritionEntry, createPatientProfile, getFeelingEntries, getMaternalHealth, getNutritionEntry, getPatientProfile, updateNutritionEntry } from "../controllers/patient.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.post("/", authenticate, authorize("patient"), createPatientProfile);
router.post("/nutrition", authenticate, authorize("patient"), createNutritionEntry);
router.post("/feelingEntry", authenticate, authorize("patient"), createFeelingEntry);
router.post("maternalHealth", authenticate, authorize("patient"), createMaternalHealth);

// router.put("/profile", authenticate, authorize("patient"), createOrUpdatePatientProfile);
router.put("/nutrition", authenticate, authorize("patient"), updateNutritionEntry);

router.get("/nutrition", authenticate, authorize("patient"), getNutritionEntry);
router.get("/", authenticate, authorize("patient"), getPatientProfile);
router.get("/feelings", authenticate, authorize("patient"), getFeelingEntries);
router.get("maternalHealth", authenticate, authorize("patient"), getMaternalHealth);

export default router;