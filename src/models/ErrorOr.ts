import assert from 'node:assert';

export default class ErrorOr<T> {
    constructor ({ isError, message, value }: { isError: boolean; message: string; value: T; }) {
        if (isError) {
            assert(value == null);
            this.setError(message);
        }
        if (value)
            this.value = value;
    }

    public setError(message: string): void {
        this._isError = true;
        this._message = message;
    }

    public unsetError(): void {
        this._isError = false;
        this._message = null;
    }

    public hasValue(): boolean {
        return !this._isError && this._value != null;
    }

    public hasMessage(): boolean {
        return this._message != null;
    }

    public isError(): boolean {
        return this._isError;
    };

    public set value(value: T) {
        this._value = value;
        this._isError = false;
        this._message = null;
    }

    public get message(): string {
        assert(this.hasMessage());
        return this._message;
    }

    public get value(): T {
        assert(this.hasValue());
        return this._value;
    }

    private _isError: boolean;
    private _message: string;
    private _value: T;
}
