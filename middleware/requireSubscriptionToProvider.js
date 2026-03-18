export const requireSubscription = async (req, res, next) => {
    try {
        const patientId = req.user._id;
        const { providerId } = req.params;

        const subscription = await Subscription.findOne({
            patient: patientId,
            provider: providerId,
            status: "active",
        });

        if (!subscription) {
            throw new CustomError(403, "Subscription required");
        }

        next();
    } catch (error) {
        next(error);
    }
};