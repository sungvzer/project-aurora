import CurrencyCode from './CurrencyCode';

interface UserTransaction {
    id: number;
    amount: number;
    currency: CurrencyCode;
    date: string;
    tag: string;
}

export default UserTransaction;
