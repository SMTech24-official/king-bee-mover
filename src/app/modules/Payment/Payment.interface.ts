
export interface IStripeSaveWithCustomerInfo {
    name: string;
    email: string;
    paymentMethodId: string;
    amount: number;
    address: Address;
  }
  
  interface Address {
    city: string;
    postal_code: string;
    country: string;
  }
   