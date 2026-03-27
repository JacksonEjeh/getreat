import mongoose from "mongoose";
import ProviderReminder from "../models/providerReminder.model.js";
import CustomError from "../middleware/errorHandler.js";

// CREATE REMINDER
export const createReminder = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const {
            date,
            title,
            time,
            descp,
            targeted_patients,
            category,
            location,
            reminder_time_before_event,
        } = req.body;

        if (!date || !title || !time || !descp || !category) {
            throw new CustomError(400, "Missing required fields", "ValidationError");
        }

        const reminder = await ProviderReminder.create({
            user: userId,
            date,
            title,
            time,
            descp,
            targeted_patients,
            category,
            location,
            reminder_time_before_event,
        });

        res.status(201).json({
            success: true,
            message: "Reminder created successfully",
            data: reminder,
        });
    } catch (error) {
        next(error);
    }
};

// GET REMINDERS
export const getReminders = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const reminders = await ProviderReminder.find({ user: userId })
        .populate("targeted_patients", "full_name email")
        .sort({ date: -1 });

        if (!reminders) {
            throw new CustomError(404, "No reminders found for this provider", "NotFoundError");
        }

        res.status(200).json({
            success: true,
            message: "Reminders retrieved successfully",
            data: reminders,
        });
    } catch (error) { 
        next(error);
    }
};

// get a single reminder by id
export const getSingleReminder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reminder ID",
            });
        }

        const reminder = await ProviderReminder.findOne({
            _id: id,
            user: userId,
        }).populate("targeted_patients", "full_name email");

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: "Reminder not found",
            });
        }

        res.status(200).json({
            success: true,
            data: reminder,
        });
    } catch (error) {
        next(error);
    }
};

// update a reminder
export const updateReminder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new CustomError(400, "Invalid reminder ID", "ValidationError");
        }

        const reminder = await ProviderReminder.findOneAndUpdate(
            { _id: id, user: userId },
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!reminder) {
            throw new CustomError(404, "Reminder not found or you do not have permission to update it", "NotFoundError");
        }

        res.status(200).json({
            success: true,
            message: "Reminder updated successfully",
            data: reminder,
        });
    } catch (error) {
        next(error);
    }
};

// delete a reminder
export const deleteReminder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new CustomError(400, "Invalid reminder ID", "ValidationError");
        }

        const reminder = await ProviderReminder.findOneAndDelete({
            _id: id,
            user: userId,
        });

        if (!reminder) {
            throw new CustomError(404, "Reminder not found or you do not have permission to delete it", "NotFoundError");
        }

        res.status(200).json({
            success: true,
            message: "Reminder deleted successfully",
            data: reminder,
        });
    } catch (error) {
        next(error);
    }
};