
//patient create appointment with provider

import mongoose from "mongoose";
import CustomError from "../middleware/errorHandler.js";
import Appointment from "../models/appointment.model.js";
import ProviderSchedule from "../models/providerSchedule.model.js";

// get available slots for a provider on a specific date
export const getAvailableSlots = async (req, res, next) => {
    try {   
        const providerId = req.params.providerId;
        const date = req.query.date;
        if (!providerId) {
            throw new CustomError(400, "Provider ID is required", "ValidationError");
        }
        if (!date) {
            throw new CustomError(400, "Date is required", "ValidationError");
        }

        const schedule = await ProviderSchedule.findOne({ provider: providerId, date });

        if (!schedule) {
            return res.status(200).json({
                success: true,
                message: "No schedule found for this provider on the specified date",
                data: [],
            });
        }
       // Only available slots
        const availableSlots = schedule.slots.filter(
        (slot) => slot.isActive && !slot.isBooked
        );


        res.status(200).json({
            success: true,
            message: "Available slots retrieved successfully",
            data: availableSlots,
        });
    }
    catch (error) {
        next(error);
    }
};
// create appointment
export const createAppointment = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const patientId = req.user._id;
        const {
            providerId,
            appointmentDate,
            slotId,
            appointmentType,
            digitalOption,
            reason,
        } = req.body;

        if (!providerId || !appointmentDate || !slotId || !appointmentType || !reason) {
            throw new CustomError(400, "Missing required fields", "ValidationError");
        }

        const schedule = await ProviderSchedule.findOne({
            provider: providerId,
            date: appointmentDate,
        }).session(session);

        if (!schedule) {
            throw new CustomError(404, "No schedule found for this date", "NotFoundError");
        }
        const slot = schedule.slots.id(slotId);
        
       if (!slot) {
            throw new CustomError(404, "Slot not found", "NotFoundError");
        }

        if (!slot.isActive) {
            throw new CustomError(400, "Slot is not active", "ValidationError");
        }

        if (slot.isBooked) {
            throw new CustomError(400, "Slot already booked", "ValidationError");
        }
        // Mark slot as booked
        slot.isBooked = true;
        await schedule.save({ session });


        const appointment = await Appointment.create({
            provider: providerId,
            patient: patientId,
            appointmentDate,
            appointmentTime: slot.startTime,
            appointmentType,
            digitalOption: appointmentType === "digital" ? digitalOption : null,
            reason,
        });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            data: appointment[0],
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// get all appointments for a logged in patient for a specific provider
export const getAppointmentsByProvider = async (req, res, next) => {
    try {
        const patientId = req.user._id;
        const providerId = req.params.providerId;
        if (!patientId) {
            throw new CustomError(400, "Patient ID is required", "ValidationError");
        }
        if (!providerId) {
            throw new CustomError(400, "Provider ID is required", "ValidationError");
        }
        const appointments = await Appointment.find({ patient: patientId, provider: providerId }).populate("provider", "name email");
        
        if (!appointments || appointments.length === 0) {
            throw new CustomError(404, "No appointments found for this provider", "NotFoundError");
        }
        res.status(200).json({
            success: true,
            message: "Appointments retrieved successfully",
            data: appointments,
        });
    } catch (error) {
        next(error);
    }
};

// get a single appointment by id
export const getSingleAppointment = async (req, res, next) => {
    try {
        const patientId = req.user._id;
        const appointmentId = req.params.id;    
        if (!appointmentId) {
            throw new CustomError(400, "Appointment ID is required", "ValidationError");
        }
        const appointment = await Appointment.findOne({ _id: appointmentId, patient: patientId }).populate("provider", "name email");
        if (!appointment) {
            throw new CustomError(404, "Appointment not found", "NotFoundError");
        } 
        res.status(200).json({
            success: true,
            message: "Appointment retrieved successfully",
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

// cancel appointment by id
export const cancelAppointment = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction(); 

        const patientId = req.user._id;
        const appointmentId = req.params.id;    
        const { cancellationReason } = req.body;

        if(!appointmentId) {
            throw new CustomError(400, "Appointment ID is required", "ValidationError");
        }

        const appointment = await Appointment.findById(appointmentId).session(session);

        if (!appointment) {
            throw new CustomError(404, "Appointment not found", "NotFoundError");
        }
        if (appointment.status === "cancelled") {
            throw new CustomError(400, "Already cancelled", "ValidationError");
        }
        // Find schedule
        const schedule = await ProviderSchedule.findOne({
            provider: appointment.provider,
            date: appointment.appointmentDate,
        }).session(session);
        if (!schedule) {
            throw new CustomError(404, "Schedule not found for this appointment", "NotFoundError");
        }
        // Find slot
        const slot = schedule.slots.find(
            (s) => s.startTime === appointment.appointmentTime
        );
        if (!slot) {
            throw new CustomError(404, "Slot not found for this appointment", "NotFoundError");
        }
        if(slot){
            slot.isBooked = false; // Mark slot as available
        }
        await schedule.save({ session });
        appointment.status = "cancelled";
        appointment.cancellationReason = cancellationReason || "Not specified";
        await appointment.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully",
            data: appointment,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// reschedule appointment by id
export const rescheduleAppointment = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const patientId = req.user._id;
        const appointmentId = req.params.id;    
        const { newDate, newSlotId } = req.body;

        if(!newDate || !newSlotId) {
            throw new CustomError(400, "New date and slot ID are required", "ValidationError");
        }
        const appointment = await Appointment.findById(appointmentId).session(session);

        if (!appointment) {
            throw new CustomError(404, "Appointment not found", "NotFoundError");
        }
        if (appointment.status === "cancelled") {
            throw new CustomError(400, "Cannot reschedule a cancelled appointment", "ValidationError");
        }
        // free old slot
        const oldSchedule = await ProviderSchedule.findOne({
            provider: appointment.provider,
            date: appointment.appointmentDate,
        }).session(session);

        if (oldSchedule) {
            const oldSlot = oldSchedule.slots.find(
                (s) => s.startTime === appointment.appointmentTime
            );

            if (oldSlot) {
                oldSlot.isBooked = false;
                await oldSchedule.save({ session });
            }
            await oldSchedule.save({ session });
        }

        // lock new slot
        const newSchedule = await ProviderSchedule.findOne({
            provider: appointment.provider,
            date: newDate,
        }).session(session);

        if(!newSchedule) {
            throw new CustomError(404, "No schedule found for the new date", "NotFoundError");
        }
        const newSlot = newSchedule.slots.id(newSlotId);

        if (!newSlot) {
            throw new CustomError(404, "New slot not found", "NotFoundError");
        }
        if (!newSlot.isBooked || !newSlot.isActive) {
            throw new CustomError(400, "New slot is not available", "ValidationError");
        }
        newSlot.isBooked = true;
        await newSchedule.save({ session });

        // update appointment
        appointment.appointmentDate = newDate;
        appointment.appointmentTime = newSlot.startTime;
        
        await appointment.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Appointment rescheduled successfully",
            data: appointment,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};
