import CustomError from "../middleware/errorHandler.js";
import { validateProviderInput } from "../middleware/provider.validation.js";
import Appointment from "../models/appointment.model.js";
import Provider from "../models/provider.model.js";
import ProviderSchedule from "../models/providerSchedule.model.js";

const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");

    hours = parseInt(hours, 10);

    if (modifier === "PM" && hours !== 12) {
        hours += 12;
    }

    if (modifier === "AM" && hours === 12) {
        hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${minutes}`;
};

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

        if (!date || !startTime || !endTime || !timeZone) {
            throw new CustomError(400, "All fields are required");
        }

        const normalizedDate = date;

        const start24 = convertTo24Hour(startTime);
        const end24 = convertTo24Hour(endTime);

        const start = new Date(`1970-01-01T${start24}:00`);
        const end = new Date(`1970-01-01T${end24}:00`);

        if (start >= end) {
            throw new CustomError(400, "Invalid time range");
        }

        const newSlots = [];
        let current = new Date(start);

        while (true) {
            const next = new Date(current.getTime() + slotDuration * 60000);
            if (next > end) break;

            newSlots.push({
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

        if (newSlots.length === 0) {
            throw new CustomError(400, "No valid slots generated");
        }

        let schedule = await ProviderSchedule.findOne({
            provider: providerId,
            date: normalizedDate,
        });

        const timeToMinutes = (timeStr) => {
            const [time, modifier] = timeStr.split(" ");
            let [hours, minutes] = time.split(":").map(Number);

            if (modifier === "PM" && hours !== 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;

            return hours * 60 + minutes;
        };

        if (!schedule) {
            schedule = await ProviderSchedule.create({
                provider: providerId,
                date: normalizedDate,
                timeZone,
                slots: newSlots,
            });
        } else {
            const isOverlapping = schedule.slots.some(existing => {
                const existingStart = timeToMinutes(existing.startTime);
                const existingEnd = timeToMinutes(existing.endTime);

                return newSlots.some(newSlot => {
                const newStart = timeToMinutes(newSlot.startTime);
                const newEnd = timeToMinutes(newSlot.endTime);

                return newStart < existingEnd && newEnd > existingStart;
                });
            });

            if (isOverlapping) {
                throw new CustomError(400, "Time slot overlaps with existing slots");
            }

            const existingTimes = new Set(
                schedule.slots.map((s) => s.startTime)
            );

            const filteredSlots = newSlots.filter(
                (slot) => !existingTimes.has(slot.startTime)
            );

            if (filteredSlots.length === 0) {
                throw new CustomError(400, "All slots already exist");
            }

            schedule.slots.push(...filteredSlots);
            schedule.timeZone = timeZone;

            schedule.slots.sort(
                (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
            );

            await schedule.save();
        }

        res.status(201).json({
            success: true,
            message: "Schedule updated successfully",
            data: schedule,
        });
    } catch (error) {
        next(error);
    }
};

