import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return
            res
                .status(401)
                .json({ message: "Not authorized to access this route" });
        }

        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_JWT_SECRET)
            const user = await User.findById(decoded.userId).select("-password");

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user;
            next();

        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Unauthorized - Access token expired" });
            }
            throw error;
        }

    } catch (err) {
        res.status(401).json({ message: "Not authorized to access this route" });
    }
};

export const adminRoute = (req, res, next) => {
	if (req.user && req.user.role === "admin") {
		next();
	} else {
		return res.status(403).json({ message: "Access denied - Admin only" });
	}
};