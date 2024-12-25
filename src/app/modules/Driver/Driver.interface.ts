import { UserAccountStatus } from "@prisma/client";

export type IDriverSearchFields = {
    searchTerm?: string;
    accountStatus?: UserAccountStatus;
    name?: string;
}
