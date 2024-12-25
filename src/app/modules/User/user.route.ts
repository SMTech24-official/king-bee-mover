import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./user.validation";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();
 
// *!get all  user
router.get("/", 
    // auth(UserRole.Admin),
     userController.getUsers
    );

// *!update  user
router.patch("/:id", 
    // auth(UserRole.Admin, UserRole.Customer, UserRole.Driver),
    validateRequest(UserValidation.UserUpdateValidationSchema), 
    userController.updateUser);
 


export const userRoutes = router;
