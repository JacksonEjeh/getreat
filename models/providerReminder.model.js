import mongoose from "mongoose";

const providerReminderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    date: {
        type: Date,
        required: true, 
    },
    title: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    descp: {
        type: String,
        required: true,
    },
    targeted_patients: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // patients
        },
    ],
    category: {
        type: String,
        enum: ["appointment", "medication", "personal", "other"],
        required: true,
    },
    location: {
        type: String,
        default: null,
    },
    reminder_time_before_event: {
        type: Number, // in minutes
        default: 30,
    },
}); 

const ProviderReminder = mongoose.model("ProviderReminder", providerReminderSchema);
export default ProviderReminder;