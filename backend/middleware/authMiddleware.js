import { verifyAuth } from "../utils/auth.js";

export const authMiddleware = async (req, res, next) => {
  if (!req.cookies.token) {
    return res.status(401).json({ message: "You are not welcome here :)" });
  }
  const payload = await verifyAuth(req.cookies.token);

  if (!payload.authenticated) {
    return res
      .status(401)
      .send({ message: "Oooo nice try but wrong credentials :)" });
  }

  req.credentials = payload;
  next();
};
