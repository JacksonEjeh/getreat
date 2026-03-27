import CustomError from "../middleware/errorHandler.js";
import PatientVital from "../models/patientVitals.model.js";


//create patient vital entry
export const createPatientVitalEntry = async (req, res, next) => {
    try {
        const { blood_pressure, sugar_level } = req.body;
        const userId = req.user._id;

        if (!blood_pressure || !sugar_level) {
            throw new CustomError("Blood pressure and sugar level are required", 400);
        }
        const newVitalEntry = new PatientVital({
            user: userId,
            blood_pressure,
            sugar_level,
        });
        await newVitalEntry.save();

        res.status(201).json({ 
            message: "Patient vital entry created successfully", 
            vitalEntry: newVitalEntry 
        });
    } catch (error) {
        next(error);
    }
};

//get patient vital entry
export const getPatientVitalEntry = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const vitalEntry = await PatientVital.findOne({ user: userId }).sort({ createdAt: -1 });
        if (!vitalEntry) {
            throw new CustomError("No vital entry found for this patient", 404);
        }
        res.status(200).json({ 
            message: " Patient vital entry retrieved successfully",
            data: vitalEntry 
        });
    } catch (error) {
        next(error);
    }
};

// update patient vital entry
export const updatePatientVitalEntry = async (req, res, next) => {
    try {
        const { blood_pressure, sugar_level } = req.body;
        const userId = req.user._id;

        if(!blood_pressure || !sugar_level) {
            throw new CustomError("Blood pressure and sugar level are required for update", 400);
        }
        
        const updatedEntry = await PatientVital.findOneAndUpdate(
            { user: userId },
            { blood_pressure, sugar_level },
            { new: true }
        );
        if (!updatedEntry) {
            throw new CustomError("No vital entry found to update", 404);
        }   
        res.status(200).json({ 
            message: "Patient vital entry updated successfully", 
            data: updatedEntry 
        });
    } catch (error) {
        next(error);
    }
};