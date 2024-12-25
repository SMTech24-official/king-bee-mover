import validateRequest from '../../middlewares/validateRequest';
import { TruckController } from './Truck.controller';
import { TruckValidation } from './Truck.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import express, { NextFunction, Request, Response } from 'express';
import { fileUploader } from '../../../helpars/fileUploader';
const router = express.Router();

router.post(
  '/',
  // auth(UserRole.Admin),
  fileUploader.uploadImage,
  (req: Request, res: Response, next: NextFunction) => {  
     req.body = TruckValidation.addTruckSchema.parse(JSON.parse(req.body.data)); 
     return TruckController.AddTruck(req, res, next);
  },
  TruckController.AddTruck
);

router.get(
  '/',
  // auth(),
  TruckController.GetAllTrucks
);

router.get(
  '/:id',
  // auth(),
  TruckController.GetTruckById
);

router.patch('/:id', 
  // auth(UserRole.Admin), 
validateRequest(TruckValidation.updateTruckSchema),
TruckController.UpdateTruck);

router.delete('/:id',
  // auth(UserRole.Admin),
  TruckController.DeleteTruck);

export const truckRoutes = router;

