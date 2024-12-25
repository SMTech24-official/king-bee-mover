// Driver.service: Module file for the Driver.service functionality.

import { Driver } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { fileUploader } from "../../../helpars/fileUploader";


const createDriver = async (data:Driver, file:Express.Multer.File) => {
    const doesUserExist =  await prisma.user.findUnique({
        where: {
            id: data.userId,
        },
    });

    if(!doesUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const isDriverExist = await prisma.driver.findUnique({
        where: {
            userId: data.userId,
        },
    }); 

    if(isDriverExist) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Driver account already created with this userid");
    }

    const {Location} =  await fileUploader.uploadToDigitalOcean(file); 

    data.profileImage = Location;

    const driver = await prisma.driver.create({
        data: data,
    });
    
    return driver;
}

const updateDriver = async (id: string, data: Driver) => {
    const driver = await prisma.driver.update({
        where: { id },
        data,
    });
    return driver;
}


 const deleteDriver = async (id: string) => {
    const driver = await prisma.driver.delete({
        where: { id },
    });
    return driver;
}


 const getDriver = async (id: string) => {
    const driver = await prisma.driver.findUnique({
        where: { id },
    });
    return driver;
}

 const getAllDriver = async () => {
    const drivers = await prisma.driver.findMany();
    return drivers;
}   


export const DriverService = {
    createDriver,
    updateDriver,
    deleteDriver,
    getDriver,
    getAllDriver,
}
