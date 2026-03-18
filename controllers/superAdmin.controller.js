import CustomError from "../middleware/errorHandler";
import Provider from "../models/provider.model";

// get all providers (for super admin)
export const getAllProviders = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            search,
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        const query = {};

        // Filter by provider status (approved, pending, suspended, rejected)
        if (status) {
            query.status = status;
        }

        // Search by provider name or email (via populated user)
        if (search) {
            query.$or = [
                { "user.full_name": { $regex: search, $options: "i" } },
                { "user.email": { $regex: search, $options: "i" } },
            ];
        }

        const providers = await Provider.find(query)
        .populate("user")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean();

        const total = await ProviderProfile.countDocuments(query);

        res.status(200).json({
        success: true,
        data: {
            providers,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            },
        },
        });
    } catch (error) {
        next(error);
    }
};

// get single provider profile (for super admin)
export const getSingleProviderProfile = async (req, res, next) => {
    try {
        const { providerId } = req.params;

        const provider = await Provider.findById(providerId)
        .populate("user").lean();

        if (!provider) {
            throw new CustomError(404, "Provider not found", "NotFoundError");
        }

        res.status(200).json({
            success: true,
            data: {
                provider,
            },
        });
    } catch (error) {
        next(error);
    }
};

// approve or reject a specific credential of a provider
export const reviewCredential = async (req, res, next) => {
    try {
        const { providerId, credentialName } = req.params;
        const { status, reason } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            throw new CustomError(400, "Invalid status", "ValidationError");
        }

        const provider = await Provider.findById(providerId);
        if (!provider) {
            throw new CustomError(404, "Provider not found", "NotFoundError");
        }

        const credential = provider.credentials.find(
            (c) => c.name === credentialName
        );

        if (!credential) {
        throw new CustomError(404, "Credential not found", "NotFoundError");
        }

        credential.status = status;

        credential.rejectionReason =
        status === "rejected" ? reason || "Not specified" : null;

        // If any credential is rejected, provider stays pending
        provider.status = "pending";

        await provider.save();

        res.status(200).json({
            success: true,
            message: `Credential ${status} successfully`,
        });
    } catch (error) {
        next(error);
    }
};

// APPROVE OR REJECT PROVIDER APPLICATION
export const reviewProviderProfile = async (req, res, next) => {
    try {
        const { providerId } = req.params;
        const { status, reason } = req.body;

        const allowedStatuses = [
            "approved",
            "rejected",
            "suspended",
            "active",
        ];

        if (!allowedStatuses.includes(status)) {
            throw new CustomError(400, "Invalid status", "ValidationError");
        }

        const provider = await Provider.findById(providerId);
        if (!provider) {
            throw new CustomError(404, "Provider not found", "NotFoundError");
        }

        //Approval rules
        if (
            status === "approved" &&
            provider.credentials.some((cred) => cred.status !== "approved")
        ) {
            throw new CustomError(
                400,
                "All credentials must be approved before approving provider",
                "ValidationError"
            );
        }

        //Activate only approved/suspended providers
        if (
            status === "active" &&
            !["approved", "suspended"].includes(provider.status)
        ) {
            throw new CustomError(
                400,
                "Only approved or suspended providers can be activated",
                "ValidationError"
            );
        }

        //Suspend only active/approved providers
        if (
            status === "suspended" &&
            !["approved", "active"].includes(provider.status)
        ) {
            throw new CustomError(
                400,
                "Only active providers can be suspended",
                "ValidationError"
            );
        }

        // Apply update
        provider.status = status;

        provider.rejectionReason =
        status === "rejected" || status === "suspended"
            ? reason || "Not specified"
            : null;

        await provider.save();

        res.status(200).json({
            success: true,
            message: `Provider ${status} successfully`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * VIEW PROVIDER APPLICATION (ADMIN)
 */
export const viewProviderApplication = async (req, res, next) => {
    try {
        const { providerId } = req.params;

        const provider = await Provider.findById(providerId)
        .populate("user", "full_name email phone")
        .lean();

        if (!provider) {
            throw new CustomError(
                404,
                "Provider application not found",
                "NotFoundError"
            );
        }

        res.status(200).json({
            success: true,
            data: {
                providerId: provider._id,
                status: provider.status,
                rejectionReason: provider.rejectionReason,

                user: provider.user,

                profile: {
                    yearsOfExperience: provider.yearsOfExperience,
                    bio: provider.bio,
                    country: provider.country,
                    state: provider.state,
                    address: provider.address,
                    profilePhoto: provider.profilePhoto,
                    professionalField: provider.professional_field,
                },

                credentials: provider.credentials.map((cred) => ({
                name: cred.name,
                fileUrl: cred.fileUrl,
                status: cred.status,
                rejectionReason: cred.rejectionReason,
                })),

                submittedAt: provider.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};