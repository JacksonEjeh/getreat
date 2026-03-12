import express from "express";
import authenticate from "../middleware/authenticate.js";
import { getAllProviders, getSingleProviderProfile, reviewCredential, reviewProviderProfile, viewProviderApplication } from "../controllers/superAdmin.controller.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.patch(
  "/providers/:providerId/credentials/:credentialName",
  authenticate,
  authorize("super admin"),
  reviewCredential
);

router.patch(
  "/providers/:providerId/review",
  authenticate,
  authorize("super admin"),
  reviewProviderProfile
);

router.get(
  "/providers/application/:providerId",
  authenticate,
  authorize("super admin"),
  viewProviderApplication
);

router.get(
    "/providers/:providerId",
    authenticate,
    authorize("super admin"),
    getSingleProviderProfile
);

router.get("/providers", authenticate, authorize("super admin"), getAllProviders);