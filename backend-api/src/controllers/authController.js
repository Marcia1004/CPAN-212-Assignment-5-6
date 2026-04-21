import { authService } from "../services/authService.js";
import { successResponse } from "../utils/apiResponse.js";

export const authController = {
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body.username, req.body.password);
      return successResponse(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  },

  health(req, res) {
    return successResponse(res, { status: "UP" }, "Backend healthy");
  }
};