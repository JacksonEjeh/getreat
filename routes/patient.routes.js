import express from "express";
import { createNutritionEntry, createPatientProfile, getNutritionEntry, getPatientProfile, updateNutritionEntry } from "../controllers/patient.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import { createPatientVitalEntry, getPatientVitalEntry, updatePatientVitalEntry } from "../controllers/patientVital.controller.js";
import { createPatientEvent, deletePatientEvent, getPatientEvents, updatePatientEvent } from "../controllers/patientEvent.controller.js";
import { createPatientPartner, deletePatientPartner, getPatientPartner, updatePatientPartner } from "../controllers/patientPartner.controller.js";
import { commentOnFeelingsPost, createFeelingEntry, getCommentsForFeelingsPost, getFeelingEntries, updateFeelingEntry } from "../controllers/feelingPost.controller.js";
import { cancelAppointment, createAppointment, getAppointmentsByProvider, getAvailableSlots, getSingleAppointment, rescheduleAppointment } from "../controllers/patientAppointment.controller.js";

const router = express.Router();

router.post("/", authenticate, authorize("patient"), createPatientProfile);
router.post("/nutrition", authenticate, authorize("patient"), createNutritionEntry);
router.post("/vitals", authenticate, authorize("patient"), createPatientVitalEntry);
router.post("/event", authenticate, authorize("patient"), createPatientEvent);
router.post("partner", authenticate, authorize("patient"), createPatientPartner);
router.post("/feeling-post", authenticate, authorize("patient"), createFeelingEntry);
router.post("/feeling-post/:postId/comment", authenticate, commentOnFeelingsPost);
router.post("/book-appointment", authenticate, authorize("patient"), createAppointment);


// router.put("/profile", authenticate, authorize("patient"), createOrUpdatePatientProfile);
router.put("/nutrition", authenticate, authorize("patient"), updateNutritionEntry);
router.put("/vitals", authenticate, authorize("patient"), updatePatientVitalEntry);
router.put("/event/:id", authenticate, authorize("patient"), updatePatientEvent);
router.put("/partner/:id", authenticate, authorize("patient"), updatePatientPartner);
router.put("/feeling-post/:postId", authenticate, authorize("patient"), updateFeelingEntry);
router.patch("/appointment/:appointmentId/reschedule", authenticate, authorize("patient"), rescheduleAppointment);
router.patch("/cancel-appointment/:id", authenticate, authorize("patient"), cancelAppointment);

router.get("/", authenticate, authorize("patient"), getPatientProfile);
router.get("/vitals", authenticate, authorize("patient"), getPatientVitalEntry);
router.get("/nutrition", authenticate, authorize("patient"), getNutritionEntry);
router.get("/event", authenticate, authorize("patient"), getPatientEvents);
router.get("/partner", authenticate, authorize("patient"), getPatientPartner);
router.get("/feeling-post", authenticate, authorize("patient"), getFeelingEntries);
router.get("feeling-post/:postId/comments", authenticate, getCommentsForFeelingsPost);
router.get("/appointment/:id", authenticate, authorize("patient"), getSingleAppointment);
router.get("/appointment/:providerId", authenticate, authorize("patient"), getAppointmentsByProvider);
router.get("/appointment/slots/:providerId", authenticate, authorize("patient"), getAvailableSlots);


router.delete("/event/:id", authenticate, authorize("patient"), deletePatientEvent);
router.delete("/partner/:id", authenticate, authorize("patient"), deletePatientPartner);

export default router;