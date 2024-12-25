// Driver.routes: Module file for the Driver.routes functionality.
import express from 'express';
import { DriverController } from './Driver.controller';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpars/fileUploader';
import { Request, Response, NextFunction } from 'express';
import { DriverValidation } from './Driver.validation';

const router = express.Router();

router.post('/', 
    // auth(UserRole.Admin),
    fileUploader.uploadImage,
    (req: Request, res: Response, next: NextFunction) => {
        req.body = DriverValidation.createDriverSchema.parse(JSON.parse(req.body.data));
        return DriverController.createDriver(req, res, next);
    },
    
);


export const driverRoutes = router;