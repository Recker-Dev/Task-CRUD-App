export const adminMiddleware = async (req, res, next) => {
  if (!req.credentials) {
    return res.status(401).json({ message: "Missing credentials" });
  }

  if (req.credentials.role !== "ADMIN") {
    return res.status(403).send({ message: "Insufficient permissions" });
  }
  next();
};
