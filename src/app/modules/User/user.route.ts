import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./user.validation";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();
 
// *!get all  user
router.get("/", userController.getUsers);

// *!update  user
router.put("/:id", userController.updateUser);

export const userRoutes = router;
