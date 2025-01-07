import express from 'express';
import { DriverController } from './Driver.controller';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpars/fileUploader';
import { Request, Response, NextFunction } from 'express';
import { DriverValidation } from './Driver.validation';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();

// *!create a driver
router.post('/',
    auth(UserRole.Driver),
    fileUploader.uploadImage,
    (req: Request, res: Response, next: NextFunction) => {
        req.body = DriverValidation.createDriverSchema.parse(JSON.parse(req.body.data));
        return DriverController.createDriver(req, res, next);
    },
);

router.post("/regenerate-link/:stripeAccountId", 
    auth(UserRole.Driver),
    DriverController.regenerateOnboardingLink
)

// *!verify a driver 
router.patch("/verify-driver/:id",
    auth(UserRole.Driver),
    fileUploader.uploadImageAndFile,
    DriverController.verifyDriver
);

// *!get all driver
router.get('/',
    auth(UserRole.Admin),
    DriverController.getAllDriver
);

// *!get a driver
router.get('/:id',
    auth(UserRole.Admin, UserRole.Driver),
    DriverController.getDriver
);

router.get("/finance/:stripeAccountId",
    auth(UserRole.Driver),
    DriverController.getDriverAccountFinance
);

// *!update a driver
router.patch('/:id',
    auth(UserRole.Admin, UserRole.Driver),
    validateRequest(DriverValidation.updateDriverSchema),
    DriverController.updateDriver
);

// *!delete a driver
router.delete('/:id',
    auth(UserRole.Admin),
    DriverController.deleteDriver
);

export const driverRoutes = router;

