import is from '@lvchengbin/is';

/**
 * class Rule
 *
 * @property path - String | RegExp
 * @property action - Function | String
 * @property forward - Package | Function
 * @property preprocess - Function
 * @property from - String | Array
 */

const Rule = class {
    constructor( path, params ) {
        this.path = path;
        if( is.string( params ) || is.function( params ) ) {
            params = {
                action : params
            };
        }
        Object.assign( this, params || {} );
    }
};

export default Rule;
