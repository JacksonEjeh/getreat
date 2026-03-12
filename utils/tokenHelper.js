import jwt from "jsonwebtoken";
import { config } from "../configs/config.js";

export const generateAccessToken = (userId) => {
    return jwt.sign(
        { id: userId },
        config.jwt_secret,
        { expiresIn: "15m" }
    );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.refresh_secret,
    { expiresIn: "7d" }
  );
};
