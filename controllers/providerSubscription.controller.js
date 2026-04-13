import Subscription from "../models/providerSubscription.model";
import CustomError from "../middleware/errorHandler.js"
import Provider from "../models/provider.model.js";

export const followProvider = async (req, res, next) => {
    try {
        const { providerId } = req.params;
        const patientId = req.user._id;

        // Check if provider exists
        const provider = await Provider.findById(providerId);

        if (!provider) {
            throw new CustomError(404, "Provider not found", "NotFoundError");
        }
        // Check if subscription already exists
        const existingSubscription = await Subscription.findOne({
            patient: patientId,
            provider: providerId,
        });
        if (existingSubscription) {
            throw new CustomError(
                400,
                "You are already following this provider",
                "ValidationError"
            );
        }
        // Create new subscription
        const subscription = await Subscription.create({
            patient: patientId,
            provider: providerId,
            plan: "free", // default plan
        });
        res.status(201).json({
            success: true,
            message: "Successfully followed/subscribed to provider",
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};

export const unfollowProvider = async (req, res, next) => {
    try {
        const { providerId } = req.params;
        const patientId = req.user._id;
        // Check if subscription exists        
        const subscription = await Subscription.findOne({
            patient: patientId,
            provider: providerId,      
        });
        if (!subscription) {
            throw new CustomError(404, "Subscription not found", "NotFoundError");
        }
        // If already cancelled
        if (subscription.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "You have already unfollowed this provider",
            });
        }
        // Soft delete (recommended)
        subscription.status = "cancelled";

        // Optional: downgrade plan
        subscription.plan = "free";

        await subscription.save();

        res.status(200).json({
            success: true,
            message: "Successfully unfollowed provider",
        });
    } catch (error) {
        next(error);
    }
};

//subscribe to provider
export const subscribeToProvider = async (req, res, next) => {
    try {
        const patientId = req.user._id;
        const { providerId } = req.body;

        if (!providerId) {
            throw new CustomError(400, "Provider ID is required");
        }

        // prevent self-subscription
        if (patientId.toString() === providerId) {
            throw new CustomError(400, "You cannot subscribe to yourself");
        }

        //CHECK EXISTING 
        const existing = await Subscription.findOne({
            patient: patientId,
            provider: providerId,
        });

        if (existing) {
            if (
                existing.plan === "premium" &&
                existing.status === "active" &&
                (!existing.end_date || existing.end_date > new Date())
            ) {
                throw new CustomError(
                    400,
                    "You already have an active premium subscription"
                );
            }

             // Upgrade or Reactivate
            existing.plan = "premium";
            existing.status = "active";
            existing.start_date = new Date();

            // Example: 30 days duration
            existing.end_date = new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            );

            await existing.save();

            return res.status(200).json({
                success: true,
                message: "Subscription upgraded successfully",
                data: existing,
            });
        }

        //CREATE NEW 
        const subscription = await Subscription.create({
            patient: patientId,
            provider: providerId,
            plan: "premium",
            status: "active",
            start_date: new Date(),
            end_date: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
        });
        
        res.status(201).json({
            success: true,
            message: "Subscribed to provider successfully",
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};

// unsubscribe from provider
export const cancelSubscription = async (req, res, next) => {
    try {
        const { providerId } = req.params;
        const patientId = req.user._id;

        // Check if subscription exists
        const subscription = await Subscription.findOne({
            patient: patientId,
            provider: providerId,
        });
        if (!subscription) {
            throw new CustomError(404, "Subscription not found", "NotFoundError");
        }
        // Cancel the subscription
        subscription.status = "cancelled";
        subscription.plan = "free"; // reset to free plan
        subscription.end_date = Date.now();

        await subscription.save();

        res.status(200).json({
            success: true,
            message: "Subscription cancelled successfully",
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};

//get subscribed patients for a provider
export const getSubscribedPatients = async (req, res, next) => {
    try {
        const providerId = req.user._id;

        const { plan, page = 1, limit = 10 } = req.query;

        const filter = {
            provider: providerId,
            status: "active",
        };
        //optional filter by plan
        if (plan) {
            filter.plan = plan;
        }

        const subscriptions = await Subscription.find(filter)
        .populate("patient", "full_name email")
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

        if (subscriptions.length === 0) {
            throw new CustomError(404, "No active subscriptions found", "NotFoundError");
        }

        //count total
        const total = await Subscription.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: subscriptions,
            message: `Subscribed patient fetched successfully`,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getSubscribedProviders = async (req, res, next) => {
    try {
        const patientId = req.user._id;
        
        const { plan, page = 1, limit = 10 } = req.query;

        const filter = {
            patient: patientId,
            status: "active",
        };
        //optional filter by plan
        if (plan) {
            filter.plan = plan;
        }
        const subscriptions = await Subscription.find(filter)
        .populate("provider", "name email")
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 });
        //count total
        const total = await Subscription.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: subscriptions,
            pagination: {   
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};