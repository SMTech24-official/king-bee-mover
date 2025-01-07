// DriverTripApplication.routes: Module file for the DriverTripApplication.routes functionality.


import { Router } from "express";
import { DriverTripApplicationController } from "./DriverTripApplication.controller";
import validateRequest from "../../middlewares/validateRequest"; 
import { DriverTripApplicationValidation } from "./DriverTripApplication.validation";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/",
    auth(UserRole.Driver),
    validateRequest(DriverTripApplicationValidation.createDriverTripApplicationValidation),
    DriverTripApplicationController.createDriverTripApplication);

router.get("/",
    auth(UserRole.Admin),
    DriverTripApplicationController.getAllDriverTripApplication);

router.get("/:id",
    auth(UserRole.Admin, UserRole.Driver),
    DriverTripApplicationController.getDriverTripApplication);

router.patch("/:id",
    auth(UserRole.Admin),
    validateRequest(DriverTripApplicationValidation.assignDriverToTripValidation),
    DriverTripApplicationController.assignDriverToTrip);

router.delete("/:id",
    auth(UserRole.Admin),
    DriverTripApplicationController.deleteDriverTripApplication);

export const DriverTripApplicationRoutes = router;
