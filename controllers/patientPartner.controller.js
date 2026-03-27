import CustomError from "../middleware/errorHandler.js";
import Partner from "../models/addPartner.model.js";

// patient create partner
export const createPatientPartner = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { name, relationship, phone } = req.body;
        if (!name || !relationship || !phone) {
            throw new CustomError(400, "Name, relationship, and phone are required", "ValidationError");
        }
        const partner = new Partner({ 
            user: userId, 
            name, 
            relationship, 
            phone 
        });
        await partner.save();

        res.status(201).json({
            message: "Partner added successfully",
            data: partner,
        });
    } catch (error) {
        next(error)
    }
};

// get patient partner
export const getPatientPartner = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const partner = await Partner.findOne({ user: userId });
        if (!partner) {
            throw new CustomError(404, "No partner found for this patient", "NotFoundError");
        }
        res.status(200).json({
            message: "Partner retrieved successfully",
            data: partner,
        });
    } catch (error) {
        next(error)
    }   
};

// update patient partner
export const updatePatientPartner = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { name, relationship, phone } = req.body;
        const partner = await Partner.findOneAndUpdate(
            { user: userId },
            { name, relationship, phone },
            { new: true }
        );
        if (!partner) {
            throw new CustomError(404, "No partner found for this patient", "NotFoundError");
        }
        res.status(200).json({
            message: "Partner updated successfully",
            data: partner,
        });        
    } catch (error) {
        next(error)
    }
};

// delete patient partner
export const deletePatientPartner = async (req, res, next) => {
    try { 
        const userId = req.user._id;
        const partner = await Partner.findOneAndDelete({ user: userId });
        if (!partner) {
            throw new CustomError(404, "No partner found for this patient", "NotFoundError");
        }
        res.status(200).json({
            message: "Partner deleted successfully",
            data: partner,
        });
    } catch (error) {
        next(error)
    }
};