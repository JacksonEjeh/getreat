import Appointment from "../models/appointment.model.js";
import Provider from "../models/provider.model.js";
import ProviderSchedule from "../models/providerSchedule.model.js";
import CustomError from "../middleware/errorHandler.js";
import Patient from "../models/patient.model.js";
import FeelingsPost from "../models/feelingsPost.model.js";
import NutritionProfile from "../models/nutrition.model.js";
import MaternalHealthProfile from "../models/maternalHealth.model.js";

/**
 * Create or Update Patient Profile
 * (Upsert – one patient per user)
 */
export const createPatientProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;

        /* -------------------- PREVENT DUPLICATES -------------------- */
        const existingProfile = await Patient.findOne({ user: userId });
        if (existingProfile) {
            throw new CustomError(
                409,
                "Patient profile already exists. Use update instead."
            );
        }

        const {
            service,
            mode_of_pregnancy,
            last_menstrual_period,
            has_health_condition,
            health_condition_details,
            baby_height,
            blood_pressure,
            sugar_level,
            rhesus_factor,
            fibroid_or_ovarian_cyst,
            profile_photo,
        } = req.body;

        /* -------------------- REQUIRED FIELD CHECKS -------------------- */
        if (!service) throw new CustomError(400, "Service is required");
        if (!mode_of_pregnancy)
        throw new CustomError(400, "Mode of pregnancy is required");
        if (!last_menstrual_period)
        throw new CustomError(400, "Last menstrual period is required");
        if (has_health_condition === undefined)
        throw new CustomError(400, "Health condition status is required");
        if (has_health_condition && !health_condition_details)
        throw new CustomError(
            400,
            "Please provide health condition details"
        );
        if (!rhesus_factor)
        throw new CustomError(400, "Rhesus factor is required");
        if (fibroid_or_ovarian_cyst === undefined)
        throw new CustomError(
            400,
            "Fibroid or ovarian cyst status is required"
        );

        /* -------------------- NEWBORN CARE VALIDATION -------------------- */
        if (service === "newborn care") {
        if (!baby_height || !baby_height.value) {
            throw new CustomError(
            400,
            "Baby height is required for newborn care"
            );
        }
        }

        /* -------------------- CREATE PROFILE -------------------- */
        const patient = await Patient.create({
        user: userId,
        service,
        mode_of_pregnancy,
        last_menstrual_period,
        has_health_condition,
        health_condition_details: has_health_condition
            ? health_condition_details
            : null,
        baby_height,
        blood_pressure,
        sugar_level,
        rhesus_factor,
        fibroid_or_ovarian_cyst,
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
/**
 * Get Patient Profile
 */
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

/**
 * Delete Patient Profile (Optional)
 */
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

// patient create how're you feeling post
export const createFeelingEntry = async (req, res, next) => {
    try {
        const { content, media } = req.body;
        const userId = req.user._id;

        if (!content) throw new CustomError(400, "Content is required for feeling entry");

        const feelingsPost = await FeelingsPost.create({
            user: userId,
            content,
            media,
        });

        res.status(201).json({
            success: true,
            message: "Feeling post entry created successfully",
            data: feelingsPost,
        });
    } catch (error) {
        
    }
};

// patient get how're you feeling posts
export const getFeelingEntries = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const feelingsPosts = await FeelingsPost.find({ user: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Feeling Post retrieved successfully",
            data: feelingsPosts,
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

// create maternal health
export const createMaternalHealth = async (req, res, next) => {
    try {
        const { date, has_existing_conditions, existing_conditions_details, has_medications, medications_details } = req.body;
        const userId = req.user._id;
        if (!date) throw new CustomError(400, "Date is required");
        if (has_existing_conditions === undefined) throw new CustomError(400, "Existing conditions status is required");
        if (has_existing_conditions === true && !existing_conditions_details) throw new CustomError(400, "Please provide existing conditions details");
        if (has_medications === undefined) throw new CustomError(400, "Medication status is required");
        if (has_medications === true && !medications_details) throw new CustomError(400, "Please provide medications details");

        const maternalHealthProfile = await MaternalHealthProfile.create({
            user: userId,
            date,
            has_existing_conditions,
            existing_conditions_details: has_existing_conditions ? existing_conditions_details : null,
            has_medications,
            medications_details: has_medications ? medications_details : null,
        });

        res.status(201).json({
            success: true,
            message: "Maternal health profile created successfully",
            data: maternalHealthProfile,
        });

    } catch (error) {
        next(error);
    }
};

// get maternal health
export const getMaternalHealth = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const maternalHealthProfile = await MaternalHealthProfile.findOne({ user: userId });
        if (!maternalHealthProfile) throw new CustomError(404, "Maternal health profile not found");

        res.status(200).json({
            success: true,
            data: maternalHealthProfile,
            message: "Maternal health profile retrieved successfully",
        });
    } catch (error) {
        next(error);
    }   
};

// Get all active providers (optional filter by service)
export const getProviders = async (req, res, next) => {
    try {
        const { service } = req.query;

        const filter = {
            status: "active",
        };

        if (service) {
            filter.specialties = service;
        }

        const providers = await Provider.find(filter)
        .populate("user", "full_name email phone");

        res.status(200).json({
            success: true,
            message: "Providers retrieved successfully",
            count: providers.length,
            data: providers,
        });
    } catch (error) {
        next(error);
    }
};

// get provider profile by id
export const getProviderProfileById = async (req, res, next) => {
    try {
        const { providerId } = req.params;
        const provider = await Provider.findById(providerId).populate("user", "full_name email phone");
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