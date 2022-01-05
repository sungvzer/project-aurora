// Thanks to https://github.com/Kudoas/express-api-sample/blob/ceebfa49b7d7470a3c9049ea391a6656c65de167/utils/endpointList.ts

import express from 'express';

export const print = (path: [], layer: any) => {
    if (layer.route) {
        layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))));
    } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))));
    } else if (layer.method) {
        console.log(
            '%s /%s',
            layer.method.toUpperCase(),
            path.concat(split(layer.regexp)).filter(Boolean).join('/'),
        );
    }
};

export const split = (thing: any): any => {
    if (typeof thing === 'string') {
        return thing.split('/');
    } else if (thing.fast_slash) {
        return '';
    } else {
        const match = thing
            .toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '$')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
        return match
            ? match[1].replace(/\\(.)/g, '$1').split('/')
            : '<complex:' + thing.toString() + '>';
    }
};

export const endpointList = (app: express.Express) => {
    console.log('**************************');
    app._router.stack.forEach(print.bind(null, []));
    console.log('**************************');
};
