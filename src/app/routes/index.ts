import express from "express";
import { userRoutes } from "../modules/User/user.route";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { customerRoutes } from "../modules/Customer/Customer.routes";
import { truckRoutes } from "../modules/Truck/Truck.routes";


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
    path: "/truck",
    route: truckRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
