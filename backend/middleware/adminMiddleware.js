export const adminMiddleware = (req, res, next) => {
  if (!req.userId || !req.role) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

export default adminMiddleware;
