import { checks } from './utils';
import { getKeys } from '../variables';

const Rule = class {
    constructor( path, params ) {
        if( !checks.string( path ) && !checks.regexp( path ) ) {
            throw new TypeError( 'Path must be a String or a RegExp' );
        }
        this.path = path;
        this.params = params || {};
    }

    match( path ) {
        let matches;
        if( checks.regexp( this.path ) ) {
            if( !( matches = this.path.exec( path ) ) ) {
                console.log( '[J Rule] Not matched', path, this.path );
                return false;
            }
            console.log( '[J Rule] matched', path, this.path );
            const keys = getKeys( this.params );
            const params = {};
            const replace = ( m, n ) => matches[ n ];
            for( let i = 0, l = keys.length; i < l; i = i + 1 ) {
                const item = this.params[ keys[ i ] ];
                params[ keys[ i ] ] = checks.string( item ) ? item.replace( /\$(\d+)/g, replace ) : item; 
            }
            return params;
        }
        if( path === this.path ) {
            console.log( '[J Rule] matched', path, this.path );
            return this.params;
        }
        console.log( '[J Rule] Not matched', path, this.path );
        return false;
    }
};

export default Rule;
