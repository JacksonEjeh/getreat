import CustomError from "../middleware/errorHandler.js";
import { validateProviderInput } from "../middleware/provider.validation.js";
import Appointment from "../models/appointment.model.js";
import Provider from "../models/provider.model.js";
import ProviderSchedule from "../models/providerSchedule.model.js";

// create provider profile

export const createProviderProfile = async (req, res, next) => {
    try {
        validateProviderInput(req.body);

        const {
            professional_field,
            years_of_experience,
            bio,
            country,
            state,
            address,
            profilePhoto,
            credentials,
        } = req.body;

        // Prevent duplicate submission
        const existingProfile = await Provider.findOne({
            user: req.user._id,
        });

        if (existingProfile) {
            throw new CustomError(
                409,
                "Provider profile already exists",
                "ConflictError"
            );
        }

        const providerProfile = await Provider.create({
            user: req.user._id,
            professional_field,
            years_of_experience,
            bio,
            country,
            state,
            address,
            profilePhoto,
            credentials: credentials.map((cred) => ({
                name: cred.name,
                fileUrl: cred.fileUrl,
                verified: false,
            })),
        });

        res.status(201).json({
            success: true,
            message: "Provider profile submitted successfully",
            data: providerProfile,
        });
    } catch (error) {
        next(error);
    }
};

// get provider profile
export const getProviderProfile = async (req, res, next) => {
    try {
        const providerProfile = await Provider.findOne({
            user: req.user._id,
        }).populate("user", "full_name email");

        if (!providerProfile) {
            throw new CustomError(
                404,
                "Provider profile not found",
                "NotFoundError"
            );
        }

        res.status(200).json({
            success: true,
            data: providerProfile,
        });
    } catch (error) {
        next(error);
    }
};

// approve or reject patient appointment
export const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { appointmentId } = req.params;
        const { status, cancellationReason } = req.body;

        if (!["confirmed", "cancelled", "completed"].includes(status)) {
        throw new CustomError(400, "Invalid status", "ValidationError");
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            throw new CustomError(404, "Appointment not found", "NotFoundError");
        }

        appointment.status = status;
        appointment.cancellationReason =
        status === "cancelled" ? cancellationReason || "Not specified" : null;

        await appointment.save();

        res.status(200).json({
            success: true,
            message: `Appointment ${status} successfully`,
        });
    } catch (error) {
        next(error);
    }
};

//create provider availability schedule (for future use)

export const createSchedule = async (req, res, next) => {
    try {
        const providerId = req.user._id;
        const { date, timeZone, startTime, endTime, slotDuration = 60 } = req.body;

        const start = new Date(`1970-01-01T${startTime}`);
        const end = new Date(`1970-01-01T${endTime}`);

        if (start >= end) {
            throw new CustomError(400, "Invalid time range", "ValidationError");
        }

        // Generate slots
        const slots = [];
        let current = start;

        while (current < end) {
            const next = new Date(current.getTime() + slotDuration * 60000);

            slots.push({
                startTime: current.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                }),
                endTime: next.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                }),
            });

            current = next;
        }

        const schedule = await ProviderSchedule.findOneAndUpdate(
            { provider: providerId, date },
            { provider: providerId, date, timeZone, slots },
            { upsert: true, new: true }
        );

        res.status(201).json({
            success: true,
            message: "Schedule created successfully",
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
};