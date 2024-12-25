import  express from 'express';
import auth from '../../middlewares/auth';
import { CustomerController } from './Customer.controller';
 

const router = express.Router();

router.post('/', auth(), CustomerController.createCustomer);

export const customerRoutes = router;