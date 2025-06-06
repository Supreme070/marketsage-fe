declare module 'paystack-node' {
  export class Paystack {
    constructor(secretKey: string, defaultCurrency?: string);

    transaction: {
      initialize(params: {
        email: string;
        amount: number;
        reference: string;
        metadata?: any;
        callback_url?: string;
        channels?: string[];
        currency?: string;
      }): Promise<{ data: any }>;
      verify(reference: string): Promise<{ data: any }>;
      list(params?: any): Promise<{ data: any }>;
    };

    subscription: {
      create(params: {
        customer: string;
        plan: string;
        authorization: string;
      }): Promise<{ data: any }>;
      list(): Promise<{ data: any }>;
      disable(code: string, token: string): Promise<{ data: any }>;
    };

    plan: {
      create(params: any): Promise<{ data: any }>;
      list(): Promise<{ data: any }>;
      fetch(id_or_code: string): Promise<{ data: any }>;
    };

    customer: {
      create(params: any): Promise<{ data: any }>;
      list(): Promise<{ data: any }>;
      fetch(email_or_code: string): Promise<{ data: any }>;
    };

    misc: {
      list_banks(): Promise<{ data: any }>;
    };
  }
} 