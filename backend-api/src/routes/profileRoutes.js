import { Router } from "express";
import { profileController } from "../controllers/profileController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { updateOwnProfileValidator } from "../validators/profileValidator.js";
import { handleValidation } from "../middleware/validationMiddleware.js";

const router = Router();

// View own profile
router.get("/me", authenticate, profileController.getOwnProfile);

// Update own profile
router.put(
  "/me",
  authenticate,
  updateOwnProfileValidator,
  handleValidation,
  profileController.updateOwnProfile
);

// Self-suspend 
router.put(
  "/me/suspend",
  authenticate,
  profileController.suspendOwnProfile
);

export default router;
