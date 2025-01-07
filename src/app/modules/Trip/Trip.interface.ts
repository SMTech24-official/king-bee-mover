// Trip.interface: Module file for the Trip.interface functionality.

export interface ITripSearchFields {  
    searchTerm?: string; 
    paymentMethodType?: string;
    tripStatus?: string;
    tags?: string;
    customerId?: string;
    truckId?: string;
    assignedDriverId?: string;
}