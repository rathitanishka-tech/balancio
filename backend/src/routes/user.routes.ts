import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { updateUserSchema, changePasswordSchema } from "../validators/user.validator";

const router = Router();

router.use(requireAuth);

router.get("/me", userController.getMe);
router.patch("/me", validate(updateUserSchema), userController.updateMe);
router.post("/me/change-password", validate(changePasswordSchema), userController.changePassword);
router.get("/search", userController.searchUsers);

export default router;
