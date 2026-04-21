import { AppError } from "../utils/appError.js";

function isAdmin(user) {
  return user.roles?.some(role => role.name === "ADMIN");
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401));
  }

  if (!isAdmin(req.user)) {
    return next(new AppError("Forbidden: Admins only", 403));
  }

  next();
}
