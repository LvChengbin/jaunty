import J from './j.js';
import { __packages } from './variables.js';
import { currentScriptURL } from './utils.js';

const Package = function( o = {} ) {
    const url = currentScriptURL();

    if( !url ) {
        throw new TypeError( 'Cannot get url of the script file.' );
    }

    const P = class extends J {
        constructor( options = {}, i = {} ) {
            super( Object.assign( {}, options ), i );
        }
    };

    Object.assign( P.prototype, o );
    return( __packages[ url ] = P );
};

export default Package;
