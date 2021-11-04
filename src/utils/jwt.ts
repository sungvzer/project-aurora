import * as jwt from 'jsonwebtoken';

export const generateAccessToken = (payload: Object): string => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
};

export const generateRefreshToken = (payload: Object): string => {
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET
    );
};
