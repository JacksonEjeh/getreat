import mongoose  from "mongoose";

const patientEventSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    event_name: {
        type: String,
        required: true,
    },
    start_time: {
        type: String,
        required: true,
    },
    end_time: {
        type: String,
    }, 
    event_type: {
        type: String,
        enum: ["appointment", "symptom", "medication", "other"],
        required: true,
    },
    color_type: {
        type: String,
        enum: ["red", "blue", "green", "yellow", "purple"],
        default: "blue",
    },
    Location: {
        type: String,
    },
    descp: {
        type: String,
    },
    
}, { timestamps: true });

const PatientEvent = mongoose.model("PatientEvent", patientEventSchema);
export default PatientEvent;