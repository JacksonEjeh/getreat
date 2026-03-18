import bcrypt from "bcryptjs";
import sendEmail from "../utils/emailSender.js";
import User from "../models/user.model.js";
import CustomError from "../middleware/errorHandler.js";
import jwt from "jsonwebtoken";
import { config } from "../configs/config.js";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenHelper.js";
import { verifyGoogleToken } from "../utils/googleverify.js";

const generateOTP = ()=> ({
    otp: Math.floor(100000 + Math.random() * 900000).toString(),
    otpExpiresAt: Date.now() + 10 * 60 *1000,
})

const generateAndSendOTP = async(user)=>{
    const { otp, otpExpiresAt } = generateOTP();
    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendEmail(user.email, "Your OTP Code", `Your new OTP is ${otp}. It expires in 10 minutes`);
};

// google login or register
export const googleAuth = async (req, res, next) => {
    try {

        const { token } = req.body;

        if (!token) {
            throw new CustomError(400, "Google token required", "ValidationError");
        }

        const payload = await verifyGoogleToken(token);

        const {
            email,
            name,
            picture,
            sub,
            email_verified
        } = payload;

        if (!email_verified) {
            throw new CustomError(400, "Google email not verified", "ValidationError");
        }

        let user = await User.findOne({ email }).select("+refreshToken +password");

        /*
        SCENARIO 1
        Existing user with email/password
        */

        if (user && !user.googleId) {

            user.googleId = sub;
            user.avatar = picture;

            if (!user.auth_providers.includes("google")) {
                user.auth_providers.push("google");
            }

            user.email_verified = true;

            await user.save();

        }

        /*
        SCENARIO 2
        Existing Google user
        */

        if (user && user.googleId) {
            // nothing to update
        }

        /*
        SCENARIO 3
        New user
        */

        if (!user) {

            user = await User.create({
                full_name: name,
                email,
                googleId: sub,
                avatar: picture,
                auth_providers: ["google"],
                email_verified: true,
                onboarding_step: "verified"
            });

        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            accessToken,
            user: {
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};
// Allow Google Users To Add Password Later
export const setPassword = async (req, res, next) => {
    try {

        const userId = req.user._id;
        const { password } = req.body;

        const user = await User.findById(userId).select("+password");

        if (user.password) {
            throw new CustomError(400, "Password already set");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        user.password = passwordHash;

        if (!user.auth_providers.includes("local")) {
            user.auth_providers.push("local");
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password added successfully"
        });

    } catch (error) {
        next(error);
    }
};

//user registration and send otp
const signUp = async (req, res, next) => {
    const session = await User.startSession();
    session.startTransaction();

    try {
        const { full_name, email, phone, gender, dob, country_of_residence, password} = req.body;

        if(!full_name || !email || !phone || !gender || !dob || !country_of_residence || !password) {
            throw new CustomError(400, "All fields are required", "ValidationError")
        }
        if(!/^\S+@\S+\.\S+$/.test(email)) {
            throw new CustomError(400, "Invalid email format", "VAlidationError")
        }

        const existingUser = await User.findOne({email}).session(session);
        if (existingUser) throw new CustomError(400, "User already exists", "ValidationError");

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
        if (!passwordRegex.test(password)) {
            throw new CustomError(400, "Password must include uppercase, lowercase, number, and special character.", "ValidationError");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const { otp, otpExpiresAt } = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        const newUser = new User({
            full_name,
            email,
            phone,
            gender,
            dob,
            country_of_residence,
            password: passwordHash,
            otp: hashedOTP,
            otpExpiresAt,
            email_verified: false,
            onboarding_step: "signup",
        });

        await newUser.save({ session });

        // send email before committing transaction
        const emailSent = await sendEmail(
            email,
            "Your OTP Code",
            `Your OTP is: ${otp}. It expires in 10 minutes.`
        );
        if (emailSent.success === false) {
            throw new CustomError(400, "Failed to send OTP, Please try again later", "ValidationError")
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "OTP sent to email. Please verify your account.",
            data: { 
                email,
                nextStep: "verify-email",
            },
        })
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error)
    }
};

// verify otp and activate account
const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email }).select("+otp +otpExpiresAt");

        
        if(!user) throw new CustomError(404, "User not found", "ValidationError");
        if(user.email_verified) throw new CustomError(400, "User is already verified", "ValidationError");

        if(!otp || !user.otp){
            throw new CustomError(400, "OTP expired or invalid", "ValidationError");
        }

        //check if otp is expired
        if(Date.now() > user.otpExpiresAt){
            await generateAndSendOTP(user);
            return res.status(404).json({ success: false, message: "OTP expired. A new OTP has been sent."});
        } 

        const otpMatch = await bcrypt.compare(otp.toString(), user.otp);
        if(!otpMatch) throw new CustomError(400, "Invalid OTP", "ValidationError");

        user.email_verified = true;
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        //generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({ success: true, message: "Account verified successfully", accessToken, user: { id: user._id, email: user.email, isVerified: user.email_verified}});
    } catch (error) {
        next(error)
    }
};

// Resend OTP
const resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new CustomError(400, "Email is required", "ValidationError");
        }
    
        const user = await User.findOne({ email });
    
        if (!user) {
            throw new CustomError(404, "User not found", "ValidationError");
        }
    
        if (user.email_verified) {
            throw new CustomError(400, "User is already verified", "ValidationError");
        }
    
        await generateAndSendOTP(user);
    
        res.status(200).json({
            success: true,
            message: "New OTP sent to your email.",
            data: { email },
        });
    } catch (error) {
        next(error);
    }
};  

//user login (generate token)
const signIn = async (req, res, next) => {
    try {
        const {email, password } = req.body;

        if(!email || !password) throw new CustomError(400, "Email and password are required", "ValidationError"); 
        
        const user = await User.findOne({ email }).select("+password +refreshToken");
        if(!user) throw new CustomError(404, "User not found", "ValidationError");
        
        if(!user.email_verified) throw new CustomError(403, "Account not verified", "ValidationError");
        
        if (!user.password) {
            throw new CustomError(
                400,
                "This account uses Google login. Please sign in with Google.",
                "ValidationError"
            );
        }

        if (!email.match(/^\S+@\S+\.\S+$/)) {
            throw new CustomError(400, "Invalid email format", "ValidationError");
        }
        
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if(!passwordMatch) throw new CustomError(400, "Invalid credentials", "ValidationError");

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        
        res.status(200).json({ success: true, accessToken: accessToken, user: { email: user.email, role: user.role } });

    } catch (error) {
        next(error)
    }
};

//Refresh Token
const refreshToken = async (req, res, next) => {
    try {
        const token  = req.cookies?.refreshToken;     
        
        if(!token ) throw new CustomError(401, "No refresh token provided", "AuthorizationError");
        
        const decoded = jwt.verify( token , config.refresh_secret);
        const user = await User.findById(decoded.id).select("+refreshToken");

        if(!user || user.refreshToken !== token) throw new CustomError(403, "Invalid refresh token", "AuthorizationError");
        
        const newAccessToken = generateAccessToken(user._id)
        const newRefreshToken = generateRefreshToken(user._id);

        user.refreshToken = newRefreshToken
        await user.save();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        
        res.status(200).json({ success: true, accessToken: newAccessToken});
    } catch (error) {
        next(error)   
    }
};

//Logout (invalidate refresh token)
const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) throw new CustomError(401, "No refresh token provided", "AuthorizationError");

        const decoded = jwt.verify( refreshToken, config.refresh_secret);
        if(!decoded) throw new CustomError(403, "Invalid refresh token", "AuthorizationError");
        
        const user = await User.findById(decoded.id);

        user.refreshToken = null;
        await user.save();

        res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", });


        res.status(200).json({ success: true, message: "Logged out successfully" });

    } catch (error) {
        next(error)
    }
};

// Forgot password (SEND OTP)
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) throw new CustomError(404, "User not found", "ValidationError");

        await generateAndSendOTP(user)

        res.status(200).json({ success: true, message: "Password reset OTP sent to email.", data: { email: user.email } });
    } catch (error) {
       next(error) 
    }
};

// Reset password (verify otp and update password)
const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, new_password } = req.body;
        const user = await User.findOne({ email }).select("+otp +otpExpiresAt");
        if (!user) throw new CustomError(404, "User not found", "ValidationError");

        if (!otp || !user.otp) {
            throw new CustomError(400, "OTP expired or invalid", "ValidationError");
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/; // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        if (!passwordRegex.test(new_password)) {
            throw new CustomError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number", "ValidationError");
        }
        if (Date.now() > user.otpExpiresAt) {
            await generateAndSendOTP(user);
            throw new CustomError(400, "OTP expired. A new OTP has been sent.", "ValidationError");
        }

        const otpMatch = await bcrypt.compare(otp.toString(), user.otp);
        if (!otpMatch) throw new CustomError(400, "Invalid OTP", "ValidationError");

        user.password = await bcrypt.hash(new_password, 10);
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successfully" });

    } catch (error) {
        next(error)
    }
};

// change password
const changePassword = async ( req, res, next) => {
    try {
        const { old_password, new_password } = req.body;
        if ( !old_password ) throw new CustomError( 400, "Old password is required", "ValidationError");
        if ( !new_password ) throw new CustomError( 400, "New password is required", "ValidationError");

        const user = await User.findOne({ _id: req.user._id }).select("+password");
        if( !user ) throw new CustomError( 404, "User not found", "ValidationError");

        const passwordMatch = await bcrypt.compare(old_password, user.password);
        if( !passwordMatch ) throw new CustomError( 400, "Invalid old password", "ValidationError");

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/; // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        if ( !passwordRegex.test(new_password) ) {
            throw new CustomError( 400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number", "ValidationError");
        }

        user.password = await bcrypt.hash(new_password, 10);
        await user.save();

        res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        next(error);
    }
}

export { signIn, signUp, logout, forgotPassword, resetPassword, verifyOTP, resendOTP, refreshToken, changePassword};