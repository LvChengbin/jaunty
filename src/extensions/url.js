import { realPath } from '../core/utils';
import { isArray } from '../variables';

const attrs = [
    'href', 'origin',
    'host', 'hash', 'hostname',  'pathname', 'port', 'protocol', 'search',
    'username', 'password', 'searchParams'
];

/**
 * I found that there is a lib which implemented the URL polyfill.
 * Tha author did some replcements after encodeURIComponent while encode strings.
 * I did't know the reason cuz I did not familar with the standard of URL
 *
 * @see https://github.com/WebReflection/url-search-params/blob/master/src/url-search-params.js
 */
const decode = str => decodeURIComponent( str.replace( /\+/g, ' ' ) );
const encode = str => encodeURIComponent( str );

class URLSearchParams {
    constructor( init ) {
        this.dict = [];
        /**
         * Actually, the URLSearchParams should support Sequence, Record, and String as it initial param. But the implementation of Google Chrome only support the initial param with a string. so, here, support String only.
         * @see https://url.spec.whatwg.org/#urlsearchparams
         */
        if( isArray( init ) ) {
            throw new TypeError( 'Failed to construct "URLSearchParams": The value provided is neither an array, nor does it have indexed properties' );
        }

        if( init.charAt(0) === '?' ) {
            init = init.slice( 1 );
        }

        const pairs = init.split( /&+/ );
        for( const item of pairs ) {
            const index = item.indexOf( '=' );
            this.append(
                index > -1 ? item.slice( 0, index ) : item,
                index > -1 ? item.slice( index + 1 ) : ''
            );
        }

    }
    append( name, value ) {
        this.dict.push( [ decode( name ), decode( value ) ] );
    }
    delete( name ) {
        const dict = this.dict;
        for( let i = 0, l = dict.length; i < l; i += 1 ) {
            if( dict[ i ][ 0 ] == name ) {
                dict.splice( i, 1 );
                i--; l--;
            }
        }
    }
    get( name ) {
        for( const item of this.dict ) {
            if( item[ 0 ] == name ) {
                return item[ 1 ];
            }
        }
    }
    getAll( name ) {
        const res = [];
        for( const item of this.dict ) {
            if( item[ 0 ] == name ) {
                res.push( item[ 1 ] );
            }
        }
        return res;
    }
    has( name ) {
        for( const item of this.dict ) {
            if( item[ 0 ] == name ) {
                return true;
            }
        }
        return false;
    }
    set( name, value ) {
        let set = false;
        for( let i = 0, l = this.dict.length; i < l; i += 1 ) {
            const item  = this.dict[ i ];
            if( item[ 0 ] == name ) {
                if( set ) {
                    this.dict.splice( i, 1 );
                    i--; l--;
                } else {
                    item[ 1 ] = value;
                    set = true;
                }
            }
        }
    }
    /**
     * comment sort method cuz it is only defined in WHATWG standard but has not been implemented by Chrome
    sort( compareFunction ) {
        this.dict( ( a, b ) => {
            const nameA = a[ 0 ].toLowerCase();
            const nameB = b[ 0 ].toLowerCase();

            if( checks.function( compareFunction ) ) {
                return compareFunction.call( this, nameA, nameB );
            }

            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;

            return 0;
        } );
    }
    */
    forEach( callback, thisArg ) {
        for( const item of this.dict ) {
            callback.call( thisArg, item[ 1 ], item[ 0 ], this );
        }
    }

    toString() {
        const pairs = [];
        for( const item of this.dict ) {
            pairs.push( encode( item[ 0 ] ) + '=' + encode( item[ 1 ] ) );
        }
        return pairs.join( '&' );
    }
}


export default class URL {
    constructor( path, base ) {
        if( window.URL ) {
            let url;
            if( typeof base === 'undefined' ) {
                url = new window.URL( path );
            } else {
                url = new window.URL( path, base );
            }
            if( !( 'searchParams' in url ) ) {
                url.searchParams = new URLSearchParams( url.search ); 
            }
            return url;
        } else {
            const node = document.createElement( 'a' );
            node.href = realPath( base, path );
            for( const attr of attrs ) {
                this[ attr ] = attr in node ? node[ attr ] : '';
            }
            this.searchParams = new URLSearchParams( node.search ); 
        }

    }
}
