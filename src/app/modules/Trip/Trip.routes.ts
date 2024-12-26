// Trip.routes: Module file for the Trip.routes functionality.

import { Router } from "express";
import { TripController } from "./Trip.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { TripValidation } from "./Trip.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

router.post("/",
    // auth(UserRole.Customer),
    validateRequest(TripValidation.createTripValidationSchema),
    TripController.createTrip
);

router.get("/", 
    // auth(UserRole.Admin, UserRole.Customer, UserRole.Driver),
    TripController.getAllTrip
);

router.get("/:id",
    auth(UserRole.Customer, UserRole.Admin, UserRole.Driver),
    TripController.getTrip
);

router.patch("/:id",
    auth(UserRole.Customer, UserRole.Admin),
    TripController.updateTrip
);

router.delete("/:id",
    auth(UserRole.Customer, UserRole.Admin, UserRole.Driver),
    TripController.deleteTrip
);

export const TripRoutes = router;
