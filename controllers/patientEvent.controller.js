import CustomError from "../middleware/errorHandler.js";
import PatientEvent from "../models/patientEvents.model.js";

//create event by patient
export const createPatientEvent = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { date, event_name, start_time, end_time, event_type, color_type, Location, descp } = req.body;

        if (!date || !event_name || !start_time || !event_type) {
            throw new CustomError(400, "Missing required fields", "ValidationError");
        }

        const newEvent = new PatientEvent({
            user: userId,
            date,
            event_name,
            start_time,
            end_time,   
            event_type,
            color_type,
            Location,
            descp,
        });
        await newEvent.save();
        res.status(201).json({ 
            message: "Event created successfully", 
            event: newEvent 
        });

    } catch (error) {
        next(error)
    }
};

// get events for patient
export const getPatientEvents = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const events = await PatientEvent.find({ user: userId }).sort({ date: -1 });

        if (!events) {
            throw new CustomError(404, "No events found for this patient", "NotFoundError");
        }

        res.status(200).json({ 
            message: "Events retrieved successfully",
            data: events 
        });
    } catch (error) {
        next(error)
    }
};

// update patient event
export const updatePatientEvent = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const eventId = req.params.id;
        const { date, event_name, start_time, end_time, event_type, color_type, Location, descp } = req.body;
        const event = await PatientEvent.findOne({ _id: eventId, user: userId });

        if (!event) {
            throw new CustomError(404, "Event not found", "NotFoundError");
        }
        event.date = date || event.date;
        event.event_name = event_name || event.event_name;
        event.start_time = start_time || event.start_time;
        event.end_time = end_time || event.end_time;
        event.event_type = event_type || event.event_type;
        event.color_type = color_type || event.color_type;
        event.Location = Location || event.Location;
        event.descp = descp || event.descp; 
        await event.save();

        res.status(200).json({ 
            message: "Event updated successfully", 
            event 
        });
    } catch (error) {
        next(error)
    }   
};

// delete patient event
export const deletePatientEvent = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const eventId = req.params.id;
        const event = await PatientEvent.findOneAndDelete({ _id: eventId, user: userId });  
        if (!event) {
            throw new CustomError(404, "Event not found", "NotFoundError");
        }   
        res.status(200).json({ 
            message: "Event deleted successfully", 
            event 
        });
    } catch (error) {
        next(error)
    }
};

