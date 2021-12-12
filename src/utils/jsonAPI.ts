import { Response, Request, NextFunction } from "express";
import assert from "node:assert";

// TODO: AttributesObject, RelationshipsObject

export const JsonAPIObject = {
    version: "1.0",
};

export type Link =
    | string
    | {
          href: string;
          meta?: object;
      };

export interface LinksObject {
    [tag: string]: Link;
}

export interface ErrorLinksObject extends LinksObject {
    about?: Link;
}

export interface ResourceLinksObject extends LinksObject {
    self?: Link;
    related?: Link;
}

export interface ResourceIdentifierObject {
    /**
     * A unique identifier, mandatory, combined with `ResourceIdentifierObject.type`, uniquely identifies a resource
     */
    id: string;
    /**
     * The type of the resource, mandatory, combined with `ResourceIdentifierObject.id`, uniquely identifies a resource
     */
    type: string;

    /**
     * Contains non-standard information about the resource
     */
    meta?: object;
}

export interface ResourceObject {
    /**
     * A unique identifier, mandatory, combined with `ResourceObject.type`, uniquely identifies a resource
     */
    id: string;

    /**
     * The type of the resource, mandatory, combined with `ResourceObject.id`, uniquely identifies a resource
     */
    type: string;

    /**
     * Represents information about the object
     */
    attributes?: { [key: string]: any };

    // TODO: Implement type for RelationshipObject
    /**
     * Represents references from the resource object to other resource objects
     */
    relationships?: any;

    /**
     * Contains links related to the resource
     */
    links?: LinksObject;

    /**
     * Contains non-standard information about the resource
     */
    meta?: object;
}

export interface Error {
    /**
     * A unique identifier for this particular occurrence of the problem
     */
    id?: string;

    /**
     * A [links object](https://jsonapi.org/format/1.0/#document-links)
     */
    links?: ErrorLinksObject;

    /**
     * The HTTP status code applicable to this problem
     */
    status?: string;

    /**
     * An application-specific error code
     */
    code?: string;

    /**
     * A short, human-readable summary of the problem that SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization
     */
    title?: string;

    /**
     * A human-readable explanation specific to this occurrence of the problem. Like `title`, this field’s value can be localized.
     */
    detail?: string;

    /**
     * An object containing references to the source of the error
     */
    source?: {
        /**
         * A JSON Pointer [[RFC6901]](https://tools.ietf.org/html/rfc6901) to the associated entity in the request document
         */
        pointer?: string;

        /**
         * A string indicating which URI query parameter caused the error
         */
        parameter?: string;
    };

    /**
     * A [meta object](https://jsonapi.org/format/1.0/#document-meta) containing non-standard meta-information about the error.
     */
    meta?: object;
}

export const setJsonAPIType = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.setHeader("Content-Type", "application/vnd.api+json");
    next();
};

// TODO: included
export abstract class GenericResponse {
    constructor(dataOrError: "data" | "error") {
        this._dataOrError = dataOrError;
    }

    addLink(key: string, link: Link): GenericResponse {
        if (this._links == undefined) {
            this._links = {};
        }
        if (link && key) this._links[key] = link;

        return this;
    }

    addError(error: Error): GenericResponse {
        if (this._errors == undefined) {
            this._errors = [];
        }

        for (let err of this.errors) {
            if (err.code === error.code) {
                return this;
            }
        }

        this._errors.push(error);
        this._dataOrError = "error";
        return this;
    }

    isError(): boolean {
        return this._dataOrError == "error";
    }

    close(): object {
        assert(
            this.data != undefined ||
                this.errors != undefined ||
                this.meta != undefined,
            "Document MUST contain at least data, errors or meta"
        );
        assert(
            !(this.data != undefined && this.errors != undefined),
            "Data and errors MUST NOT coexist in the same document"
        );
        let response = {};
        if (this.isError()) {
            response["errors"] = this.errors;
        } else {
            response["data"] = this.data;
        }
        if (this.meta) {
            response["meta"] = this.meta;
        }

        if (this.links) {
            response["links"] = this.links;
        }

        response["jsonapi"] = JsonAPIObject;

        return response;
    }

    get links(): LinksObject {
        return this._links;
    }

    set meta(meta: object) {
        this._meta = meta;
    }

    get meta(): object {
        return this._meta;
    }

    get errors(): Error[] {
        return this._errors;
    }

    abstract set data(data: any);
    abstract get data(): any;

    protected _links: LinksObject;
    protected _dataOrError: "data" | "error";
    protected _errors: Error[] = undefined;
    protected _meta: object = undefined;
    protected _jsonAPI = JsonAPIObject;
}

export class SingleResourceResponse extends GenericResponse {
    set data(data: ResourceObject | ResourceIdentifierObject | null) {
        this._data = data;
    }

    get data(): ResourceObject | ResourceIdentifierObject {
        return this._data;
    }

    constructor(dataOrError: "data" | "error") {
        super(dataOrError);
    }

    private _data: ResourceObject | ResourceIdentifierObject | null = undefined;
}

export class MultipleResourcesResponse extends GenericResponse {
    set data(data: ResourceObject[] | ResourceIdentifierObject[] | null) {
        this._data = data;
    }

    get data(): ResourceObject[] | ResourceIdentifierObject[] {
        return this._data;
    }

    constructor(dataOrError: "data" | "error") {
        super(dataOrError);
    }

    private _data: ResourceObject[] | ResourceIdentifierObject[] | null =
        undefined;
}
