import CustomError from "./errorHandler.js";

export const validateProviderInput = (body) => {
    const {
        years_of_experience,
        bio,
        country,
        state,
        address,
        profilePhoto,
        credentials,
    } = body;

    if (years_of_experience === undefined || isNaN(years_of_experience)) {
        throw new CustomError(400, "Years of experience must be a number","ValidationError");
    }

    if (years_of_experience < 0 || years_of_experience > 60) {
        throw new CustomError( 400,"Years of experience must be between 0 and 60", "ValidationError" );
    }

    if (!bio || bio.length < 20 || bio.length > 300) {
        throw new CustomError(
        400,
        "Bio must be between 20 and 300 characters",
        "ValidationError"
        );
    }
    if(!professional_field) throw new CustomError(400, "Professional field is required");
    if (!country) throw new CustomError(400, "Country is required");
    if (!state) throw new CustomError(400, "State is required");
    if (!address) throw new CustomError(400, "Address is required");
    if (!profilePhoto)
        throw new CustomError(400, "Profile photo is required");

    if (!Array.isArray(credentials) || credentials.length === 0) {
        throw new CustomError(
        400,
        "At least one credential is required",
        "ValidationError"
        );
    }

    credentials.forEach((cred, index) => {
        if (!cred.name || !cred.fileUrl) {
        throw new CustomError(
            400,
            `Credential at index ${index} is invalid`,
            "ValidationError"
        );
        }
    });
};