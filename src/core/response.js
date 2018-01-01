import { checks } from './utils.js';
import { assign } from '../variables';

const Response = class {
    constructor( {
        status = 200,
        statusText = 'OK',
        url = '',
        body = null,
        headers = {}
    } ) {
        if( !checks.string( body ) ) {
            return new TypeError( 'Response body must be a string "' + body + '"' );
        }
        assign( this, { 
            body,
            status,
            statusText,
            url,
            headers,
            ok : status >= 200 && status < 300 || status === 304
        } );
    }

    text() {
        return this.body;
    }

    json() {
        return JSON.parse( this.body );
    }

    uncompress() {
    }

    compress() {
    }
};

export default Response;
