import CurrencyCode from './CurrencyCode';

export default interface UserTransaction {
    id: number,
    amount: number;
    currency: CurrencyCode;
    date: string;
    tag: string;
}
