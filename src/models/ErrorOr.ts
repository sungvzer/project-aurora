import assert from "node:assert";
import { Error } from "../utils/jsonAPI";

export default class ErrorOr<T> {
    constructor({ error = null, value = null }: { error?: Error; value?: T }) {
        assert(error || value, "Neither error or value were provided");

        if (error) {
            assert(value == null);
            this.setError(error);
        }
        if (value) this.value = value;
    }

    public setError(error: Error): void {
        this._error = error;
    }

    public unsetError(): void {
        this._error = null;
    }

    public hasValue(): boolean {
        return !this.isError() && this._value != null;
    }

    public isError(): boolean {
        return this._error != null;
    }

    public set value(value: T) {
        this._value = value;
        this._error = null;
    }

    public get error(): Error {
        assert(this.isError());
        return this._error;
    }

    public get value(): T {
        assert(this.hasValue());
        return this._value;
    }

    private _error: Error;
    private _value: T;
}
