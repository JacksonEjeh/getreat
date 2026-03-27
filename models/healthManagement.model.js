import mongoose from "mongoose";

const healthManagementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    conditions: [
        {
            name: {
                type: String,
                required: true,
            },
            diagnosis_date: {
                type: Date,
                required: true,
            },
            status: {
                type: String,
                enum: ["active", "resolved"],
                default: "active",
            },
        },
    ],
    medications: [
        {
            name: {
                type: String,
                required: true,
            },
            dosage: {
                type: String,
                required: true,
            },
            frequency: {
                type: String,
                required: true,
            },
            start_date: {   
                type: Date,
                required: true,
            },
            end_date: {
                type: Date,
            },
        },
    ],
});

const HealthManagement = mongoose.model("HealthManagement", healthManagementSchema);
export default HealthManagement;