import Appointment from "../models/appointment.model.js";
import Provider from "../models/provider.model.js";
import ProviderSchedule from "../models/providerSchedule.model.js";
import CustomError from "../middleware/errorHandler.js";
import Patient from "../models/patient.model.js";
import NutritionProfile from "../models/nutrition.model.js";
import Subscription from "../models/providerSubscription.model.js";

// Create or Update Patient Profile
export const createPatientProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;

        //PREVENT DUPLICATES
        const existingProfile = await Patient.findOne({ user: userId });
        if (existingProfile) {
            throw new CustomError(
                409,
                "Patient profile already exists. Use update instead."
            );
        }

        const {
            service,
            // pregnancy
            mode_of_pregnancy,
            last_menstrual_period,
            expected_delivery_date,
            gestational_weeks,
            has_health_condition,
            medical_conditions,
            on_medication,
            medication_details,
            mode_of_delivery,
            
            // newborn
            baby_full_name,
            date_of_birth,
            baby_gender,
            baby_weight,
            baby_length,
            baby_head_circumference,
            baby_photo,

            // common
            profile_photo,
        } = req.body;

        //BASIC VALIDATION
        if (!service) throw new CustomError(400, "Service is required");

        // PREGNANCY CARE VALIDATION 
        if (service === "pregnancy care") {
        if (!mode_of_pregnancy)
            throw new CustomError(400, "Mode of pregnancy is required");

        if (!last_menstrual_period)
            throw new CustomError(400, "Last menstrual period is required");

        if (!expected_delivery_date)
            throw new CustomError(400, "Expected delivery date is required");

        if (!gestational_weeks)
            throw new CustomError(400, "Gestational weeks is required");

        if (has_health_condition === undefined)
            throw new CustomError(400, "Health condition status is required");

        if (has_health_condition && (!medical_conditions || medical_conditions.length === 0)) {
            throw new CustomError(400, "Medical conditions are required");
        }

        if (on_medication === undefined)
            throw new CustomError(400, "Medication status is required");

        if (on_medication && !medication_details) {
            throw new CustomError(400, "Medication details are required");
        }

        if (!mode_of_delivery)
            throw new CustomError(400, "Mode of delivery is required");
        }

        // NEWBORN CARE VALIDATION
        if (service === "newborn care") {
        if (!baby_full_name)
            throw new CustomError(400, "Baby full name is required");

        if (!date_of_birth)
            throw new CustomError(400, "Date of birth is required");

        if (!baby_gender)
            throw new CustomError(400, "Baby gender is required");

        // Optional but validate structure if provided
        if (baby_weight && !baby_weight.value) {
            throw new CustomError(400, "Baby weight value is required");
        }

        if (baby_length && !baby_length.value) {
            throw new CustomError(400, "Baby length value is required");
        }

        if (baby_head_circumference && !baby_head_circumference.value) {
            throw new CustomError(400, "Head circumference value is required");
        }
        }

        // CREATE PROFILE
        const patient = await Patient.create({
            user: userId,
            service,

            // pregnancy
            mode_of_pregnancy,
            last_menstrual_period,
            expected_delivery_date,
            gestational_weeks,
            has_health_condition,
            medical_conditions: has_health_condition ? medical_conditions : [],
            on_medication,
            medication_details: on_medication ? medication_details : null,
            mode_of_delivery,

            // newborn
            baby_full_name,
            date_of_birth,
            baby_gender,
            baby_weight,
            baby_length,
            baby_head_circumference,
            baby_photo,

            // common
            profile_photo,
        });

        res.status(201).json({
            success: true,
            message: "Patient profile created successfully",
            data: patient,
        });
    } catch (error) {
        next(error);
    }
};

// update pregnancy dates
export const updatePregnancyDates = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const { last_menstrual_period, expected_delivery_date } = req.body;

        //FIND PROFILE 
        const patient = await Patient.findOne({ user: userId });

        if (!patient) {
            throw new CustomError(404, "Patient profile not found");
        }

        if (patient.service !== "pregnancy care") {
            throw new CustomError(
                400,
                "Only pregnancy care patients can update these fields"
            );
        }

        // UPDATE LMP
        if (last_menstrual_period) {
            patient.last_menstrual_period = last_menstrual_period;

            const lmp = new Date(last_menstrual_period);

            // AUTO CALCULATE EDD
            const edd = new Date(lmp);
            edd.setDate(edd.getDate() + 280);

            patient.expected_delivery_date = edd;
        }

        //OPTIONAL MANUAL EDD
        if (expected_delivery_date && !last_menstrual_period) {
            patient.expected_delivery_date = expected_delivery_date;
        }

        // RECALCULATE GESTATIONAL WEEKS
        if (patient.last_menstrual_period) {
            const today = new Date();
            const lmp = new Date(patient.last_menstrual_period);

            const diffTime = today - lmp;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            patient.gestational_weeks = Math.floor(diffDays / 7);
        }

        await patient.save();

        res.status(200).json({
            success: true,
            message: "Pregnancy dates updated successfully",
            data: patient,
        });
    } catch (error) {
        next(error);
    }
};

//Get Patient Profile
export const getPatientProfile = async (req, res, next) => {
    try {
        const patient = await Patient.findOne({ user: req.user._id, });

        if (!patient) throw new CustomError(404, "Patient profile not found");

        res.status(200).json({
            success: true,
            data: patient,
        });
    } catch (error) {
        next(error);
    }
};

//Delete Patient Profile (Optional)
export const deletePatientProfile = async (req, res, next) => {
    try {
        const patient = await Patient.findOneAndDelete({
            user: req.user._id,
        });

        if (!patient) throw new CustomError(404, "Patient profile not found");

        res.status(200).json({
            success: true,
            message: "Patient profile deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// create nutrition entry
export const createNutritionEntry = async (req, res, next) => {
    try {
        const { allergies, allergies_details, dietary_preferences, } = req.body;
        const userId = req.user._id;

        if (allergies === undefined) throw new CustomError(400, "Allergy status is required");
        if (allergies === true && !allergies_details) throw new CustomError(400, "Please provide allergy details");
        if (!dietary_preferences) throw new CustomError(400, "Dietary preferences are required");

        const nutritionEntry = await NutritionProfile.create({
            user: userId,
            allergies,
            allergy_details: allergies ? allergies_details : null,
            dietary_preferences,
        });

        res.status(201).json({
            success: true,
            message: "Nutrition entry saved successfully",
            data: nutritionEntry,
        });
    } catch (error) {
        next(error);
    }
};

// get nutrition entry
export const getNutritionEntry = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const nutritionEntry = await NutritionProfile.findOne({ user: userId });

        if (!nutritionEntry) throw new CustomError(404, "Nutrition entry not found");
        res.status(200).json({
            success: true,
            data: nutritionEntry,
            message: "Nutrition entry retrieved successfully",
        });
    } catch (error) {
        next(error);
    }   
};

// update nutrition entry
export const updateNutritionEntry = async (req, res, next) => {
    try {
        const { allergies, allergies_details, dietary_preferences, } = req.body;
        const userId = req.user._id;

        if (allergies === undefined) throw new CustomError(400, "Allergy status is required");
        if (allergies === true && !allergies_details) throw new CustomError(400, "Please provide allergy details");
        if (!dietary_preferences) throw new CustomError(400, "Dietary preferences are required");

        const nutritionEntry = await NutritionProfile.findOneAndUpdate(
            { user: userId },
            { allergies, allergy_details: allergies ? allergies_details : null, dietary_preferences },
            { new: true }
        );
        if (!nutritionEntry) throw new CustomError(404, "Nutrition entry not found");

        res.status(200).json({  
            success: true,
            message: "Nutrition entry updated successfully",
            data: nutritionEntry,
        });
    } catch (error) {
        next(error);
    }
};

// Get all active providers (optional filter by service)
export const getProviders = async (req, res, next) => {
    try {
        const { service } = req.query;
        const userId = req.user?._id; // optional (if logged in)

        const filter = { status: "active" };

        if (service) {
        filter.specialties = service;
        }

        //GET PROVIDERS 
        const providers = await Provider.find(filter).populate("user");

        //GET USER SUBSCRIPTIONS
        let subscribedProviderIds = [];

        if (userId) {
            const subscriptions = await Subscription.find({
                patient: userId,
                status: "active",
            }).select("provider");

            subscribedProviderIds = subscriptions.map(sub =>
                sub.provider.toString()
            );
        }

        /* -------------------- ATTACH SUBSCRIPTION STATUS -------------------- */
        const result = providers.map(provider => {
            const isSubscribed = subscribedProviderIds.includes(
                provider._id.toString()
            );

            return {
                ...provider.toObject(),
                isSubscribed,
            };
        });

        res.status(200).json({
        success: true,
        message: "Providers retrieved successfully",
        count: result.length,
        data: result,
        });
    } catch (error) {
        next(error);
    }
};

// get provider profile by id
export const getProviderProfileById = async (req, res, next) => {
    try {
        const { providerId } = req.params;
        const provider = await Provider.findById(providerId).populate("user");
        if (!provider || provider.status !== "active") throw new CustomError(404, "Provider not found" );

        res.status(200).json({
            success: true,
            data: provider,
            message: "Provider profile retrieved successfully",
        });

    } catch (error) {
        next(error);
    }
};

//subscribe to provider
export const subscribeToProvider = async (req, res, next) => {
    try {
        const patientId = req.user._id;
        const { providerId } = req.body;

        if (!providerId) {
            throw new CustomError(400, "Provider ID is required");
        }

        // prevent self-subscription
        if (patientId.toString() === providerId) {
            throw new CustomError(400, "You cannot subscribe to yourself");
        }

        //CHECK EXISTING 
        const existing = await Subscription.findOne({
            patient: patientId,
            provider: providerId,
        });

        if (existing) {
            if (existing.status === "active") {
                throw new CustomError(400, "Already subscribed to this provider");
            }

            // Reactivate subscription
            existing.status = "active";
            existing.start_date = new Date();
            await existing.save();

            return res.status(200).json({
                success: true,
                message: "Subscription reactivated",
                data: existing,
            });
        }

        //CREATE NEW 
        const subscription = await Subscription.create({
            patient: patientId,
            provider: providerId,
        });

        res.status(201).json({
            success: true,
            message: "Subscribed to provider successfully",
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};

//unsubscribe from provider
export const unsubscribeProvider = async (req, res, next) => {
    try {
        const patientId = req.user._id;
        const { providerId } = req.params;

        const subscription = await Subscription.findOne({
            patient: patientId,
            provider: providerId,
        });

        if (!subscription) {
            throw new CustomError(404, "Subscription not found");
        }

        subscription.status = "cancelled";
        await subscription.save();

        res.status(200).json({
            success: true,
            message: "Unsubscribed successfully",
        });
    } catch (error) {
        next(error);
    }
};

// get available time slots for a provider on a specific date
export const getAvailableSlots = async (req, res, next) => {
  try {
    const { providerId, date } = req.query;

    const schedule = await ProviderSchedule.findOne({
      provider: providerId,
      date: new Date(date),
    });

    if (!schedule) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const availableSlots = schedule.slots.filter(
      (slot) => slot.isActive && !slot.isBooked
    );

    res.status(200).json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    next(error);
  }
};

// book appointment
export const bookAppointment = async (req, res, next) => {
    try {
        const {
            providerId,
            appointmentDate,
            appointmentTime,
            appointmentType,
            digitalOption,
            reason,
        } = req.body;

        const patientId = req.user._id;

        // 1️⃣ Check provider
        const provider = await Provider.findById(providerId);
        if (!provider || provider.status !== "active") {
            throw new CustomError(
                400,
                "Provider is not available for booking",
                "ValidationError"
            );
        }

        // 2️⃣ Prevent double booking
        const existingAppointment = await Appointment.findOne({
            provider: providerId,
            appointmentDate,
            appointmentTime,
            status: { $in: ["pending", "confirmed"] },
        });

        if (existingAppointment) {
            throw new CustomError(
                409,
                "This time slot is already booked",
                "ConflictError"
            );
        }

        // 3️⃣ Create appointment
        const appointment = await Appointment.create({
            provider: providerId,
            patient: patientId,
            appointmentDate,
            appointmentTime,
            appointmentType,
            digitalOption: appointmentType === "digital" ? digitalOption : null,
            reason,
        });

        // 4️⃣ Update provider stats
        provider.appointments.push(appointment._id);
        provider.appointmentStats.total += 1;
        await provider.save();

        res.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};