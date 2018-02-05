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
        if( is.string( path ) || is.regexp( path ) ) {
            this.path = path;
            params = path;
        }
        Object.assign( this, params );

        if( is.string( this.type ) ) {
            this.type = [ this.type ];
        }
    }
};

export default Rule;
