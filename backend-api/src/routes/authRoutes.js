import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { loginValidator } from "../validators/authValidator.js";
import { handleValidation } from "../middleware/validationMiddleware.js";

const router = Router();

router.get("/health", authController.health);
router.post("/login", loginValidator, handleValidation, authController.login);

export default router;