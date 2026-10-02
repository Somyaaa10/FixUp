import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";
import Profession from "../models/professionSchema.js";

export const authenticate = async (req, res, next) => {
  // Get token from headers
  const authToken = req.headers.authorization;

  // Check if token exists and starts with 'Bearer'
  if (!authToken || !authToken.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token, authorization denied" });
  }

  try {
    const token = authToken.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fixup_secret_key_12345");

    req.userId = decoded.user.id;
    req.role = decoded.user.role;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token is expired" });
    }

    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }
};

export const restrict = (roles) => async (req, res, next) => {
  const userId = req.userId;
  let user;

  const patient = await User.findById(userId);
  const professional = await Profession.findById(userId);

  if (patient) {
    user = patient;
  }
  if (professional) {
    user = professional;
  }

  if (!user || !roles.includes(user.role)) {
    return res
      .status(401)
      .json({ success: false, message: "You're not authorized" });
  }

  next();
};
