import * as jwt from 'jsonwebtoken';

const accessTokenSettings: jwt.SignOptions = {
    expiresIn: "15m"
};

export interface TokenPair {
    "accessToken": string,
    "refreshToken": string;
}

export const generateAccessToken = (payload: Object): string => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        accessTokenSettings
    );
};

export const generateRefreshToken = (payload: Object): string => {
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET
    );
};

export const generateTokenPair = (payload: Object): TokenPair => {
    return {
        "accessToken": jwt.sign(
            payload,
            process.env.JWT_SECRET,
            accessTokenSettings
        ),
        "refreshToken": jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET
        )
    };
};
