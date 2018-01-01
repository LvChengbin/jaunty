import J from './j.js';
import { __packages, assign } from '../variables.js';
import { currentScript } from './utils.js';

const Package = function( o = {} ) {
    const script = currentScript();

    if( !script ) {
        throw new TypeError( 'Cannot find script element' );
    }

    const P = class extends J {
        constructor( options = {}, i = {} ) {
            super( assign( {}, options ), i );
        }
    };

    assign( P.prototype, o );
    return( __packages[ script.getAttribute( 'data-src' ) ] = P );
};

export default Package;
