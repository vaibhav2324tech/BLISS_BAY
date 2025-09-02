import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ErrorResponse from "../utils/errorResponse.js";

// Authentication middleware
export const authenticateToken = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new ErrorResponse("Not authorized to access this route", 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return next(new ErrorResponse("User not found", 401));
      }

      if (!req.user.isActive) {
        return next(new ErrorResponse("User account is deactivated", 401));
      }

      next();
    } catch (err) {
      return next(new ErrorResponse("Not authorized to access this route", 401));
    }
  } catch (error) {
    next(error);
  }
};

// Authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse("Not authenticated", 401));
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Check permission middleware
export const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse("Not authenticated", 401));
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    if (!req.user.hasPermission(module, action)) {
      return next(
        new ErrorResponse(
          `Not authorized to ${action} in ${module} module`,
          403
        )
      );
    }
    next();
  };
};
