import express from 'express';
import { DriverController } from './Driver.controller';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpars/fileUploader';
import { Request, Response, NextFunction } from 'express';
import { DriverValidation } from './Driver.validation';
import auth from '../../middlewares/auth';

const router = express.Router();

// *!create a driver
router.post('/', 
    // auth(UserRole.Driver),
    fileUploader.uploadImage,
    (req: Request, res: Response, next: NextFunction) => {
        req.body = DriverValidation.createDriverSchema.parse(JSON.parse(req.body.data));
        return DriverController.createDriver(req, res, next);
    },
);

// *!get all driver
router.get('/', 
    // auth(UserRole.Admin),
    DriverController.getAllDriver
);

// *!get a driver
router.get('/:id', 
    // auth(UserRole.Admin, UserRole.Driver),
    DriverController.getDriver
);

// *!update a driver
router.patch('/:id', 
    // auth(UserRole.Admin, UserRole.Driver),
    DriverController.updateDriver
);

// *!delete a driver
router.delete('/:id', 
    // auth(UserRole.Admin),
    DriverController.deleteDriver
);

export const driverRoutes = router;

