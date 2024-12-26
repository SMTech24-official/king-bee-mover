// DriverTripApplication.interface: Module file for the DriverTripApplication.interface functionality.

import {   DriverTripApplicationStatus } from "@prisma/client";

export interface IDriverTripApplicationSearchFields {
    tripId?: string;
    driverId?: string;
    status?: DriverTripApplicationStatus;
}

 