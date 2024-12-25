import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { CustomerController } from './Customer.controller';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpars/fileUploader';
import { CustomerValidation } from './Customer.validation'; 

const router = express.Router();

router.post('/',
    // auth(UserRole.Customer),
    fileUploader.uploadImage,
    (req: Request, res: Response, next: NextFunction) => {
        req.body = CustomerValidation.createCustomerSchema.parse(JSON.parse(req.body.data));
        return CustomerController.createCustomer(req, res, next);
    },
    CustomerController.createCustomer
);

// get all customers
router.get('/', 
    // auth(UserRole.Admin), 
    CustomerController.getAllCustomer
);

// get a customer
router.get('/:id', 
    // auth(UserRole.Admin, UserRole.Customer), 
    CustomerController.getCustomer
);

// update a customer
router.patch('/:id', 
    // auth(UserRole.Admin, UserRole.Customer), 
    CustomerController.updateCustomer
);

// delete a customer
router.delete('/:id',
    // auth(UserRole.Admin), 
    CustomerController.deleteCustomer
); 

export const customerRoutes = router;