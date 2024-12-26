import express from "express";
import { userRoutes } from "../modules/User/user.route";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { customerRoutes } from "../modules/Customer/Customer.routes";
import { truckRoutes } from "../modules/Truck/Truck.routes";
import { driverRoutes } from "../modules/Driver/Driver.routes";
import { TripRoutes } from "../modules/Trip/Trip.routes";
import { DriverTripApplicationRoutes } from "../modules/DriverTripApplication/DriverTripApplication.routes";


const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,  
  },
  {
    path: "/customer",
    route: customerRoutes,
  },
  {
    path: "/driver",
    route: driverRoutes,
  },
  {
    path: "/truck",
    route: truckRoutes,
  },
  {
    path: "/trip",
    route: TripRoutes,
  },
  {
    path: "/trip-application",
    route: DriverTripApplicationRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
