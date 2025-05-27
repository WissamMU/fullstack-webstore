import { redis } from "../lib/redis.js";
import User from "../models/user.models.js";
// import jwt for security
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_JWT_SECRET, {
        expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_JWT_SECRET, {
        expiresIn: "7d",
    });

    return { accessToken, refreshToken };
}
// save the token in redis
const saveRefreshToken = async (userid, refreshToken) => {
    await redis.set(`refresh_token:${userid}`, refreshToken, "EX", 60 * 60 * 24 * 7);
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("access_token", accessToken, {
        httpOnly: true, // prevents  xss attack cross-site scripting
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",// prevents cross-site request forgery csrf
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}


export const signup = async (req, res) => {
    // get the user data from the request body
    const { name, email, password } = req.body;
    // check if the user already exists
    const userExists = await User.findOne({ email });

    try {
        if (userExists) {
            return res.status(400).json({
                message: "User already exists",
            });
        }
        // create a new user
        const user = await User.create({
            name,
            email,
            password,
        });

        // authenticate
        const { accessToken, refreshToken } = generateToken(user._id);
        await saveRefreshToken(user._id, refreshToken);

        // set cookies
        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: "User created successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // check if the user exists
        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            // generate tokens
            const { accessToken, refreshToken } = generateToken(user._id);
            // save the refresh token in redis
            await saveRefreshToken(user._id, refreshToken);
            // set cookies
            setCookies(res, accessToken, refreshToken);

            res.status(200).json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                message: "Login successful",
            });
        } else {
            res.status(401).json({
                message: "Invalid email or password",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });

    }
}
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token; // get the refresh token from the cookies we set earlier
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
            // delete the refresh token from redis
            await redis.del(`refresh_token:${decoded.userId}`);
        }
        // clear the cookies
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        res.status(200).json({
            message: "Logged out successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token; // get the refresh token from the cookies
        // check if the refresh token is provided
        if (!refreshToken) {
            return res.status(401).json({
                message: "No refresh token provided",
            });
        }

        // verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

        // check if the user exists
        if (storedToken !== refreshToken ) {
            return res.status(401).json({
                message: "Invalid refresh token",
            });
        }


        const access_token = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_JWT_SECRET, {
            expiresIn: "15m",
        });
        res.cookie("access_token", access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.status(200).json({
            message: "Token refreshed successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
