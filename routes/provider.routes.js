import express from "express";
import authenticate from "../middleware/authenticate.js";
import { createProviderProfile, createSchedule, getProviderProfile } from "../controllers/provider.controller.js";
import authorize from "../middleware/authorize.js";
import { createReminder, deleteReminder, getReminders, getSingleReminder, updateReminder } from "../controllers/providerReminder.controller.js";

const router = express.Router();

//post
router.post("/profile", authenticate, authorize("provider"), createProviderProfile);
router.post("/reminder", authenticate, authorize("provider"), createReminder);
router.post("/create-schedule", authenticate, authorize("provider"), createSchedule);

//get
router.get("/reminders", authenticate, authorize("provider"), getReminders);
router.get("/profile", authenticate, getProviderProfile);
router.get("/reminder/:id", authenticate, authorize("provider"), getSingleReminder);

//put
router.put("/reminder/:id", authenticate, authorize("provider"), updateReminder);

//delete
router.delete("/reminder/:id", authenticate, authorize("provider"), deleteReminder);

export default router;