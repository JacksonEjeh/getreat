import mongoose from "mongoose";

const patientVitalsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    blood_pressure: {
        value: {
            type: String,
            required: true,
        },
        unit: {
            type: String,   
            enum: ["mmHg"],
            default: "mmHg",
        },
    },
    sugar_level: {
        value: {
            type: String,
            required: true,
        },
        unit: {
            type: String,
            enum: ["mg/dL", "mmol/L"],
            default: "mg/dL",
        },
    },
}, {
    timestamps: true,
});

const PatientVital = mongoose.model("PatientVitals", patientVitalsSchema);
export default PatientVital;