(function () {
'use strict';

const assign = Object.assign;
const isArray = Array.isArray;
const getKeys = Object.keys;
const defineProperty = Object.defineProperty;
const arrayPrototype = Array.prototype;
const slice = arrayPrototype.slice;


const __packages = {};
const __extensions = {};

let id = 0;
function uniqueId() {
    return ++id;
}

function objectValues( obj ) {
    const keys = getKeys( obj );
    const result = [];

    for( let key of keys ) {
        result.push( obj[ key ] );
    }
    return result;
}

const checks = {
    object( src ) {
        var type = typeof src;
        return type === 'function' || type === 'object' && !!src;
    },
    string : s => typeof s === 'string',
    arrowFunction : src => checks.function( src ) ? /^(?:function)?\s*\(?[\w\s,]*\)?\s*=>/.test( src.toString() ) : false,
    boolean : s => typeof s === 'boolean',
    node : s => ( typeof Node === 'object' ? s instanceof Node : s && typeof s === 'object' && typeof s.nodeType === 'number' && typeof s.nodeName === 'string' ),
    promise : p => p && checks.function( p.then ),
    function : f => {
        const type = ({}).toString.call( f ).toLowerCase();
        return ( type === '[object function]' ) || ( type === '[object asyncfunction]' );
    },
    true : s => {
        if( checks.boolean( s ) ) return s;
        if( checks.string( s ) ) {
            s = s.toLowerCase();
            return ( s === 'true' || s === 'yes' || s === 'ok' );
        }
        return !!s;
    },
    false : s => {
        if( checks.boolean( s ) ) return s;
        if( checks.string( s ) ) {
            s = s.toLowerCase();
            return ( s === 'false' || s === 'no' || s === '0' );
        }
        return !!s;
    }
};

'arguments,asyncfunction,number,date,regexp,error'.split( ',' ).forEach( item => {
    checks[ item ] = obj => ( ({}).toString.call( obj ).toLowerCase() === '[object ' + item + ']' );
} );

function eventSupported( event, el ) {
    const eventName = 'on' + event;

    el = el ? el.cloneNode( false ) : document.createElement( 'div' );
    el.setAttribute( eventName,  'return' );
    return typeof el[ eventName ] === 'function';
}

function currentScript() {
    return document.currentScript || ( () => {
        const scripts = document.scripts;

        for( let i = 0, l = scripts.length; i < l; i += 1 ) {
            if( scripts[ i ].readyState === 'interactive' ) {
                return scripts[ i ];
            }
        }

        try { [ November, 8 ]; } catch( e ) { // eslint-disable-line
            if( 'stack' in e ) {
                for( let i = 0, l = scripts.length; i < l; i += 1 ) {
                    if( scripts[ i ].src === e.stack.split( /at\s+|@/g ).pop().replace( /:[\d:\s]+?$/, '' ) ) {
                        return scripts[ i ];
                    }
                }
            }
        }
        return null;
    } )();
}

function realPath ( base, path ) {
    const reg = {
        dotdot : /\/[^/]+\/\.\.\//,
        dot : /\/\.\//g
    };

    if( arguments.length > 1 && base && base.length ) {
        path = base.replace( /\/+$/g, '' ) + '/' +  path.replace( /^\/+/g, '' );
    } else {
        path = ( base ? base : path ) || '';
    }
    //@todo

    // no protocol
    if( !/^([a-z]([a-z]|\d|\+|-|\.)*):\/\//.test( path ) ) {
        const prefix = location.protocol + '//' + location.host;
        if( path.charAt( 0 ) === '/' ) {
            path = prefix + path;
        } else {
            let pathname = location.pathname.replace( /\?.*$/, '' );
            if( pathname.charAt( pathname.length - 1 ) !== '/' ) {
                pathname = pathname.replace( /[^\/]*$/, '' ); //eslint-disable-line
            }
            path = realPath( pathname, path );
        }
    }
    path = path.replace( reg.dot, '/' );

    while( path.match( reg.dotdot ) ) {
        path = path.replace( reg.dotdot, '/' );
    }
    return path;
}

function encodeHTML( s ) {
    const pairs = {
        '&' : '&amp;',
        '<' : '&lt;',
        '>' : '&gt;',
        '"' : '&quot;',
        '\'' : '&#39'
    };
    return String( s ).replace( /[&<>"']/g, m => pairs[ m ] );
}

/**
 * escape css special characters
 * @see https://mathiasbynens.be/notes/css-escapes
 */
function escapeCSS( s ) {
    return String( s ).replace( /([!"#$%&'()*+,-./:;<=>?@[\]^`{|},~])/g, '\\$1' );
}

function escapeReg( s ) {
    return String( s ).replace( /[-\/\\^$*+?.()|[\]{}]/g, '\\$&' ); // eslint-disable-line
}

function stringf( str, data = window, leftDelimiter = '{#', rightDelimiter = '#}' ) { 
    const reg = new RegExp( escapeReg( leftDelimiter ) + '((?:.|\\n)+?)' + escapeReg( rightDelimiter ), 'g' );

    if( data === window ) {
        return str.replace( reg, ( m, n ) => new Function( 'return ' + n )() );
    }

    const keys = getKeys( data );
    const values = objectValues( data );
    return str.replace( reg, ( m, n ) => new Function( ...keys, 'return (' + n + ')' )( ...values ) );
}

function extract( chain, data, separator = '.' ) { 
    var tmp = data || window;
    for( let item of chain.split( separator ) ) { 
        if( typeof ( tmp = tmp[ item ] ) === 'undefined' ) return tmp;
    }   
    return tmp;
}

/**
 * thanks for jQuery
 * https://github.com/jquery/jquery/blob/master/src/serialize.js
 */
function buildParams( prefix, obj, add ) {
    if ( isArray( obj ) ) {
        for( let i = 0, l = obj.length; i < l; i = i + 1 ) {
            const v = obj[ i ];
            if( /\[\]$/.test( prefix ) ) {
                add( prefix, v );
            } else {
                buildParams(
                    prefix + '[' + ( typeof v === 'object' && v !== null ? i : '' ) + ']',
                    v,
                    add
                );
            }
        }
    } else if ( typeof obj === 'object' ) {
        for ( let name in obj ) {
            buildParams( prefix + '[' + name + ']', obj[ name ], add );
        }
    } else {
        add( prefix, obj );
    }
}

function param( obj ) {
    const s = [];
    const add = ( key, value ) => {
        value = checks.function( value ) ? value() : value;
        s[ s.length ] = encodeURIComponent( key ) + '=' + encodeURIComponent( value === null ? '' : value );
    };
    for ( let attr in obj ) {
        buildParams( attr, obj[ attr ], add );
    }
    return s.join( '&' );
}

const md5 = ( () => {
    const safe_add = (x, y) => {
        const lsw = (x & 0xFFFF) + (y & 0xFFFF);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    };
    const bit_rol = ( num, cnt ) => ( num << cnt ) | ( num >>> ( 32 - cnt ) );
    const md5_cmn = (q, a, b, x, s, t) => safe_add( bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b );
    const md5_ff = (a, b, c, d, x, s, t) => md5_cmn( (b & c) | ((~b) & d), a, b, x, s, t );
    const md5_gg = (a, b, c, d, x, s, t) => md5_cmn( (b & d) | (c & (~d)), a, b, x, s, t );
    const md5_hh = (a, b, c, d, x, s, t) => md5_cmn( b ^ c ^ d, a, b, x, s, t );
    const md5_ii = (a, b, c, d, x, s, t) => md5_cmn( c ^ (b | (~d)), a, b, x, s, t );

    /*
     * Calculate the MD5 of an array of little-endian words, and a bit length.
     */
    const binl_md5 = ( x, len ) => {
        /* append padding */
        x[len >> 5] |= 0x80 << (len % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var a = 1732584193,
            b = -271733879,
            c = -1732584194,
            d = 271733878;

        for( let i = 0, l = x.length; i < l; i += 16 ) {
            let olda = a;
            let oldb = b;
            let oldc = c;
            let oldd = d;

            a = md5_ff(a, b, c, d, x[i], 7, -680876936);
            d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

            a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = md5_gg(b, c, d, a, x[i], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
            d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = md5_hh(d, a, b, c, x[i], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i], 6, -198630844);
            d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return [ a, b, c, d ];
    };

    /*
     * Convert an array of little-endian words to a string
     */
    const binl2rstr = input => {
        var output = '';
        for( let i = 0, l = input.length * 32; i < l; i += 8 ) {
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        }
        return output;
    };

    /*
     * Convert a raw string to an array of little-endian words
     * Characters >255 have their high-byte silently ignored.
     */
    const rstr2binl = input => {
        const output = Array.from( { length : input.length >> 2 } ).map( () => 0 );
        for( let i = 0, l = input.length; i < l * 8; i += 8 ) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
        }
        return output;
    };

    const rstr_md5 = s => binl2rstr( binl_md5( rstr2binl(s), s.length * 8 ) );
    const str2rstr_utf8 = input => window.unescape( encodeURIComponent( input ) );
    return string => {
        var output = '';
        const hex_tab = '0123456789abcdef';
        const input = rstr_md5( str2rstr_utf8( string ) );

        for( let i = 0, l = input.length; i < l; i += 1 ) {
            const x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F) + hex_tab.charAt(x & 0x0F);
        }
        return output;
    };
} )();

const wrap = {
    $default : [ 0, '', '' ],
    option : [ 1, '<select multiple="multiple">', '</select>' ],
    thead : [ 1, '<table>', '</table>' ],
    tr : [ 2, '<table><tbody>', '</tbody></table>' ],
    col : [ 2, '<table><tbody></tbody><colgroup>', '</colgroup></table>' ],
    td : [ 3, '<table><tbody><tr>', '</tr></tbody></table>' ]
};

const rtag = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i; // eslint-disable-line

wrap.optgroup = wrap.option;
wrap.tbody = wrap.tfoot = wrap.colgroup = wrap.caption = wrap.thead;
wrap.th = wrap.td;

function html2Node( html ) {
    const frag = document.createDocumentFragment();
    const tag = ( rtag.exec( html ) || [ '', '' ] )[ 1 ];
    const wr = wrap[ tag ] || wrap.$default;
    let node = document.createElement( 'div' );
    let depth = wr[ 0 ];
    node.innerHTML = wr[ 1 ] + html + wr[ 2 ];
    while( depth-- ) node = node.lastChild;
    let child;
    while( ( child = node.firstChild ) ) {
        frag.appendChild( child );
    }
    return frag;
}

class EventCenter {
    constructor() {
        this.__listeners = {};
    }
    $on( evt, handler ) {
        const listeners = this.__listeners;
        listeners[ evt ] ? listeners[ evt ].push( handler ) : ( listeners[ evt ] = [ handler ] );
        return this;
    }

    $once( evt, handler ) {
        const _handler = ( ...args ) => {
            handler.apply( this, args );
            this.$off( evt, _handler );
        };
        return this.$on( evt, _handler );
    }

    $off( evt, handler ) {
        var listeners = this.__listeners,
            handlers = listeners[ evt ];

        if( !handlers || ! handlers.length ) {
            return this;
        }

        for( let i = 0; i < handlers.length; i += 1 ) {
            handlers[ i ] === handler && ( handlers[ i ] = null );
        }

        setTimeout( () => {
            for( let i = 0; i < handlers.length; i += 1 ) {
                handlers[ i ] || handlers.splice( i--, 1 );
            }
        }, 0 );

        return this;
    }

    $trigger( evt, ...data ) {
        const handlers = this.__listeners[ evt ];
        if( handlers ) {
            for( let i = 0, l = handlers.length; i < l; i += 1 ) {
                handlers[ i ] && handlers[ i ].call( this, ...data );
            }
        }
        const func = this[ 'on' + evt ];
        checks.function( func ) && func.call( this, ...data );
        return this;
    }

    $strigger( evt, ...args ) {
        //console.log( '[J EventCenter] STRIGGER : ' + evt );
        const handlers = this.__listeners[ evt ];
        if( handlers ) {
            for( let i = 0, l = handlers.length; i < l; i += 1 ) {
                handlers[ i ] && handlers[ i ]( ...args );
            }
        }
        return this;
    }

    $removeListeners( checker ) {
        const listeners = this.__listeners;
        for( let attr in listeners ) {
            if( checker( attr ) ) {
                listeners[ attr ] = null;
                delete listeners[ attr ];
            }
        }
    }
}

const Promise = class {
    constructor( fn ) {
        if( !( this instanceof Promise ) ) {
            throw new TypeError( this + ' is not a promise ' );
        }

        if( !checks.function( fn ) ) {
            throw new TypeError( 'Promise resolver ' + fn + ' is not a function' );
        }

        this[ '[[PromiseStatus]]' ] = 'pending';
        this[ '[[PromiseValue]]' ]= null;
        this[ '[[PromiseThenables]]' ] = [];
        try {
            fn( promiseResolve.bind( null, this ), promiseReject.bind( null, this ) );
        } catch( e ) {
            if( this[ '[[PromiseStatus]]' ] === 'pending' ) {
                promiseReject.bind( null, this )( e );
            }
        }
    }

    then( resolved, rejected ) {
        const promise = new Promise( () => {} );
        this[ '[[PromiseThenables]]' ].push( {
            resolve : checks.function( resolved ) ? resolved : null,
            reject : checks.function( rejected ) ? rejected : null,
            called : false,
            promise
        } );
        if( this[ '[[PromiseStatus]]' ] !== 'pending' ) promiseExecute( this );
        return promise;
    }

    catch( reject ) {
        return this.then( null, reject );
    }
};

assign( Promise, {
    resolve( value ) {
        if( !checks.function( this ) ) {
            throw new TypeError( 'Promise.resolve is not a constructor' );
        }
        /**
         * @todo
         * check if the value need to return the resolve( value )
         */
        return new Promise( resolve => {
            resolve( value );
        } );
    },
    reject( reason ) {
        if( !checks.function( this ) ) {
            throw new TypeError( 'Promise.reject is not a constructor' );
        }
        return new Promise( ( resolve, reject ) => {
            reject( reason );
        } );
    },
    all( promises ) {
        let rejected = false;
        const res = [];
        return promises.length ? new Promise( ( resolve, reject ) => {
            let remaining = promises.length;
            const then = i => {
                promises[ i ].then( value => {
                    res[ i ] = value;
                    if( --remaining === 0 ) {
                        resolve( res );
                    }
                }, reason => {
                    if( !rejected ) {
                        reject( reason );
                        rejected = true;
                    }
                } );
            };
            promises.forEach( ( value, i ) => {
                then( i );
            } );
        } ) : Promise.resolve();
    },
    race : promises => {
        let resolved = false;
        let rejected = false;

        return new Promise( ( resolve, reject ) => {
            promises.forEach( promise => {
                promise.then( value => {
                    if( !resolved && !rejected ) {
                        resolve( value );
                        resolved = true;
                    }
                }, reason => {
                    if( !resolved && !rejected ) {
                        reject( reason );
                        rejected = true;
                    }
                } );
            } );
        } );
    }
} );

function promiseExecute( promise ) {
    var thenable,
        p;

    if( promise[ '[[PromiseStatus]]' ] === 'pending' ) return;
    if( !promise[ '[[PromiseThenables]]' ].length ) return;

    const then = ( p, t ) => {
        p.then( value => {
            promiseResolve( t.promise, value );
        }, reason => {
            promiseReject( t.promise, reason );
        } );
    };

    while( promise[ '[[PromiseThenables]]' ].length ) {
        thenable = promise[ '[[PromiseThenables]]' ].shift();

        if( thenable.called ) continue;

        thenable.called = true;

        if( promise[ '[[PromiseStatus]]' ] === 'resolved' ) {
            if( !thenable.resolve ) {
                promiseResolve( thenable.promise, promise[ '[[PromiseValue]]' ] );
                continue;
            }
            try {
                p = thenable.resolve.call( null, promise[ '[[PromiseValue]]' ] );
            } catch( e ) {
                then( Promise.reject( e ), thenable );
                continue;
            }
            if( p && ( typeof p === 'function' || typeof p === 'object' ) && p.then ) {
                then( p, thenable );
                continue;
            }
        } else {
            if( !thenable.reject ) {
                promiseReject( thenable.promise, promise[ '[[PromiseValue]]' ] ); 
                continue;
            }
            try {
                p = thenable.reject.call( null, promise[ '[[PromiseValue]]' ] );
            } catch( e ) {
                then( Promise.reject( e ), thenable );
                continue;
            }
            if( ( typeof p === 'function' || typeof p === 'object' ) && p.then ) {
                then( p, thenable );
                continue;
            }
        }
        promiseResolve( thenable.promise, p );
    }
    return promise;
}

function promiseResolve( promise, value ) {
    if( !( promise instanceof Promise ) ) {
        return new Promise( resolve => {
            resolve( value );
        } );
    }
    if( promise[ '[[PromiseStatus]]' ] !== 'pending' ) return;
    if( value === promise ) {
        /**
         * thie error should be thrown, defined ES6 standard
         * it would be thrown in Chrome but not in Firefox or Safari
         */
        throw new TypeError( 'Chaining cycle detected for promise #<Promise>' );
    }

    if( value !== null && ( typeof value === 'function' || typeof value === 'object' ) ) {
        var then;

        try {
            then = value.then;
        } catch( e ) {
            return promiseReject( promise, e );
        }

        if( typeof then === 'function' ) {
            then.call( value, 
                promiseResolve.bind( null, promise ),
                promiseReject.bind( null, promise )
            );
            return;
        }
    }
    promise[ '[[PromiseStatus]]' ] = 'resolved';
    promise[ '[[PromiseValue]]' ] = value;
    promiseExecute( promise );
}

function promiseReject( promise, value ) {
    if( !( promise instanceof Promise ) ) {
        return new Promise( ( resolve, reject ) => {
            reject( value );
        } );
    }
    promise[ '[[PromiseStatus]]' ] = 'rejected';
    promise[ '[[PromiseValue]]' ] = value;
    promiseExecute( promise );
}

class Sequence extends EventCenter {
    constructor( steps = [] ) {
        super();
        this.promise = Promise.resolve();
        steps.length && this.append( steps );
    }

    append( steps ) {
        const then = i => {
            this.promise = this.promise.then( () => {
                return steps[ i ]();
            } );
        };

        isArray( steps ) || ( steps = [ steps ] );

        steps.forEach( ( step, i ) => {
            then( i );
        } );
    }
}

Sequence.all = ( steps ) => {
    var promise = Promise.resolve(),
        results = [];

    const then = i => {
        promise = promise.then( () => {
            return steps[ i ]().then( value => {
                results[ i ] = value;
            } );
        } );
    };

    steps.forEach( ( step, i ) => {
        then( i );
    } );

    return promise.then( () => results );
};

Sequence.race = ( steps ) => {
    return new Promise( ( resolve, reject ) => {
        var promise = Promise.reject();

        const c = i => {
            promise = promise.then( value => {
                resolve( value );
            } ).catch( () => {
                return steps[ i ]();
            } );
        };

        steps.forEach( ( step, i ) => {
            c( i );
        } );

        promise.then( value => {
            resolve( value );
        } ).catch( () => {
            reject();
        } );
    } );
};

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

const engines = {
    memory : 1,
    localStorage : 2,
    sessionStorage : 3,
    indexedDB : 4
};

function check( unit, md5$$1 ) {
    if( !unit ) return false;
    if( checks.string( unit ) ) {
        try {
            unit = JSON.parse( unit );
        }  catch( e ) { return false } 
    }
    const lifetime = unit.lifetime;
    if( lifetime !== 0 && ( new Date - unit.timestamp > lifetime ) ) return false;
    if( md5$$1 && unit.md5 !== md5$$1 ) return false;
    return unit;
}

const memory = {};
const prefix = '#May.27th#';
const prefixLength = prefix.length;
const index = {};


/**
 * Get all storaged data in localStorage
 * @todo get all storaged data from IndexedDB
 */
for( let item in localStorage ) {
    index[ item.substr( prefixLength ) ] = engines.localStorage;
}

for( let item in sessionStorage ) {
    index[ item.substr( prefixLength ) ] = engines.sessionStorage;
}

const Storage = {
    set( key, content, options = {} ) {
        const { 
            lifetime = 1000,
            priority = 5,
            level = 'page' 
        } = options;

        return new Promise( resolve => {
            const unit = {
                content,
                lifetime,
                priority,
                length : content.length,
                md5 : md5( content ),
                timestamp : +new Date
            };

            const exists = index[ key ];

            switch( level ) {
                case 'page':
                    ( exists && exists !== engines.memory ) && this.remove( key );
                    index[ key ] = engines.memory;
                    resolve( memory[ key ] = unit );
                    break;
                case 'session' : 
                    ( exists && exists !== engines.sessionStorage ) && this.remove( key );
                    sessionStorage.setItem( prefix + key, JSON.stringify( unit ) );
                    index[ key ] = engines.sessionStorage;
                    resolve( unit );
                    break;
                case 'persistent' :
                    ( exists && exists !== engines.localStorage ) && this.remove( key );
                    localStorage.setItem( prefix + key, JSON.stringify( unit ) );
                    index[ key ] = engines.localStorage;
                    resolve( unit );
                    break;
                default :
                    break;
            }
        } );
    },
    remove( key ) {
        const engine = index[ key ];
        if( !engine ) return Promise.resolve();
        index[ key ] = null;
        switch( engine ) {
            case 1 : // in memory
                memory[ key ] = null;
                return Promise.resolve();
            case 2 : // in localStorage
                sessionStorage.removeItem( prefix + key );
                return Promise.resolve();
            case 3 : // in sessionStorage
                localStorage.removeItem( prefix + key );
                return Promise.resolve();
            case 4 : // in indexedDB
                break;
        }
    },
    get( key, md5$$1 ) {
        const engine = index[ key ];
        if( !engine ) return Promise.reject( 'not exists' );
        let unit;
        switch( engine ) {
            case 1 : // in memory
                unit = check( memory[ key ] );
                break;
            case 2 : // in localStorage
                unit = check( localStorage.getItem( prefix + key ), md5$$1 );
                break;
            case 3 : // in sessionStorage
                unit = check( sessionStorage.getItem( prefix + key ), md5$$1 );
                break;
            case 4 : // in indexedDB
                return;
            default : 
                return Promise.reject( 'not exists' );
        }

        if( !unit ) {
            this.remove( key );
            return Promise.reject( 'not exists' );
        }
        return Promise.resolve( unit );
    },
    clear() {
        const promises = [];
        const keys = getKeys( index );
        for( let i = 0, l = keys.length; i < l; i = i + 1 ) {
            promises[ i ] = this.remove( keys[ i ] );
        }
        return Promise.all( promises );
    },
    index() {
        return index;
    },
    memory() {
        return memory;
    }
};

var config = {
    debugging : false,
    script : {
        external : false,
        storage : {
            level : 'persistent',
            lifetime : 0,
            priority : 6
        }
    },
    style : {
        external : false,
        storage : {
            level : 'persistent',
            lifetime : 0,
            priority : 6
        }
    },
    request : {
        storage : {
            level : 'page',
            lifetime : 6000,
            priority : 5
        },
    },
    csrf : {
        name : 'csrf-token',
        token : null
    }
};

const ajax = ( url, options = {} ) => {
    var {
        data,
        sync = false,
        type = 'json',
        cache = 'no-cache',
        method = 'GET',
        headers = {},
        username,
        password,
        processData = true,
        contentType = true,
        getXhr = null,
        onreadystatechange,
        xhrHeader = false
    } = options;

    method = method.toUpperCase();
    const hasContent = !/^(?:GET|HEAD)$/.test( method );

    return new Promise( ( resolve, reject ) => {
        let ourl;
        const xhr = new XMLHttpRequest();
        onreadystatechange || ( onreadystatechange = () => {
            if( xhr.readyState === 4 || xhr.readyState === 'complete' ) {
                if( xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 ) {
                    const response = new Response( {
                        url : ourl,
                        status : xhr.status,
                        statusText : xhr.statusText,
                        headers : xhr.getAllResponseHeaders(),
                        body : xhr.responseText
                    } );

                    if( type === 'json' ) {
                        try {
                            response.json();
                            resolve( response );
                        } catch( e ) {
                            reject( e );
                        }
                    } else {
                        resolve( response );
                    }
                } else {
                    reject( new Response( {
                        url : ourl,
                        status : xhr.status,
                        statusText : xhr.statusText,
                        headers : xhr.getAllResponseHeaders(),
                        body : xhr.responseText
                    } ) );
                }
            }
        } );

        ( processData === true && data && !checks.string( data ) ) && ( data = param( data ) );


        if( contentType && !hasContent ) {
            if( data ) {
                url += ( url.indexOf( '?' ) >= 0 ? '&' : '?' ) + data;
            }
            ourl = url;
            if( cache === 'no-cache' ) {
                url += ( url.indexOf( '?' ) >= 0 ? '&' : '?' ) + ( +new Date );
            }
        }
        
        xhr.open( method, url, !sync, username, password );

        if( xhrHeader === true ) {
            headers = assign( {
                'X-Requested-With' : 'XMLHttpRequest'
            }, headers );
        }

        if( contentType && hasContent && !headers[ 'Content-Type' ] ) {
            xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8' );
        }

        for( let key in headers ) {
            xhr.setRequestHeader( key, headers[ key ] );
        }

        sync || ( xhr.onreadystatechange = onreadystatechange );
        checks.function( getXhr ) && getXhr( xhr );
        xhr.send( ( hasContent && data ) ? data : null );
        sync && onreadystatechange();
    } );
};

const pool$1 = {};

const request = ( url, options = {} ) => {
    let cacheUrl = url;
    const method = options.method;
    const isGet = !method || method.toLowerCase() === 'get';
    const processData = options.processData === false ? false : true;

    if( isGet ) {
        let data = options.data;
        ( data && !checks.string( data ) && processData ) && ( data = param( data ) );
        if( data ) {
            cacheUrl += ( url.indexOf( '?' ) >= 0 ? '&' : '?' ) + data;
        }
    } else {
        if( processData ) {
            const data = {};
            data[ config.csrf.name ] = config.csrf.token;
            options.data = assign( data, options.data );
        }
    }

    if( isGet && pool$1[ cacheUrl ] ) {
        return pool$1[ cacheUrl ];
    }

    const match = url.match( /\.([\w\d-_]+)(?:\?|$)/ );
    
    if( match ) {
        if( match[ 1 ].toLowerCase() === 'json' ) {
            options.cache = null;
            
        }
    }

    if( isGet ) {

        const promise = new Promise( resolve => {
            if( options.storage === false ) {
                resolve( ajax( url, options ) );
                return;
            }
            Storage.get( cacheUrl ).then( data => {
                resolve( new Response( {
                    url,
                    status : 304,
                    statusText : 'From Storage',
                    body : data.content
                } ) );
            } ).catch( () => {
                resolve( ajax( url, options ) );
            } );
        } ).then( response => {
            if( options.storage !== false && response.statusText !== 'From Storage' ) {
                const o = options.storage || {};
                const c = config.request.storage;
                Storage.set( response.url, response.text(), {
                    level : o.level || c.level,
                    lifetime : o.lifetime !== undefined ? o.lifetime : c.lifetime,
                    priority : o.priority !== undefined ? o.priority : c.priority
                } );
            }
            if( !options.type || options.type === 'json' ) {
                return response.json();
            }
            return response;
        } );

        pool$1[ cacheUrl ] = promise;
        
        promise.then( () => {
            console.log( '[J Request] Finish : ', cacheUrl );
            pool$1[ cacheUrl ] = null;
        } );

        return promise;
    } else {
        return ajax( url, options ).then( response => {
            if( !options.type || options.type === 'json' ) {
                return response.json();
            }
            return response;
        } );
    }
};

const sequence = new Sequence();
const pool = {};

const Script = {
    create : ( options = {} ) => {
        var resolve;

        var {
            url,
            external = config.style.external
        } = options;

        url = realPath( url );

        const exists = pool[ url ];
        if( exists ) return exists.promise;

        const promise = new Promise( r => { resolve = r; } );
        const head = document.head;
        const baseElem = document.getElementsByTagName( 'base' )[ 0 ];
        const node = document.createElement( 'script' );
        node.type = 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        node.setAttribute( 'data-src', url );

        pool[ url ] = { url, promise };

        if( external ) {
            sequence.append( () => {
                node.onload = () => { resolve( node ); };
                node.src = url;
                baseElem ? head.insertBefore( node, baseElem ) : head.appendChild( node );
                return promise;
            } );
            return promise;
        }

        const o = options.storage || {};
        const c = config.script.storage; 

        sequence.append( () => {
            request( url, {
                type : 'text',
                storage : {
                    level : o.level || c.level,
                    lifetime : o.lifetime !== undefined ? o.lifetime : c.lifetime,
                    priority : o.priority !== undefined ? o.priority : c.priority,
                    type : 'script'
                }
            } ).then( response => {
                node.text = response.text();
                head.appendChild( node );
                resolve( node );
            } );
            return promise;
        } );
        return promise;
    }
};

class Event {
    constructor( options = {} ) {
        this.__returnValue = true;
        Object.assign( this, options );
    }

    stop() {
        this.stopPropagation();
    }

    stopPropagation() {
        this.__returnValue = false;
    }
}

var ec = new EventCenter();

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

const roots = {};

function onmessage( evt, subject, ...args ) {
    let match, action;
    const ename = evt + 's/' + subject;
    const rules = this.rules || [];
    for( let i = 0, l = rules.length; i < l; i = i + 1 ) {
        if( ( match = rules[ i ].match( ename ) ) ) break;
    }
    if( !match ) {
        action = extract( ename, this, '/' );
    } else if( match.action ) {
        if( checks.function( match.action ) ) {
            action = match.action;
        } else {
            action = extract( match.action, this, '/' );
        }
    }
    checks.function( action ) && action.call( this, ...args );
    if( match && match.forward ) {
        const pkg = checks.string ( match.forward ) ? this.$find( match.forward ) : match.forward;
        checks.function( match.process ) && ( args = match.process( ...args ) );
        pkg.$trigger( 'j://' + evt, subject, ...args );
    }
}

function onroute() {
    const uri = window.location.pathname + window.location.search;
    const routers = this.routers || [];
    let match;
    let matches = [];
    for( let router of routers ) {
        if( checks.regexp( router.rule ) ) {
            matches = uri.match( router.rule );
            if( matches ) {
                match = router;
                break;
            }
            continue;
        }

        if( checks.function( router.rule ) ) {
            if( router.rule.call( this, uri ) ) {
                match = router;
                break;
            }
            continue;
        }

        if( router.rule == uri ) {
            match = router;
            break;
        }
    }
    let action;
    if( match ) {
        if( checks.function( match.action ) ) {
            match.action.call( this, ...matches );
        } else {
            action = extract( match.action, this, '/' );
            checks.function( action ) && action.call( this, ...matches );
        }
    }
}

class J$1 extends EventCenter {
    constructor( name, options = {}, initial = {} ) {
        super();
        var root = this;
        if( typeof name === 'object' ) {
            initial = options;
            options = name;
        } else if( typeof name !== 'undefined' ) {
            options.$name = name;
        }

        const properties = {
            $extensions : {},
            $children : {},
            $name : 'j' + uniqueId(),
            $parent : null,
            rules : [],
            signals : {}
        };

        for( const attr in properties ) {
            if( !this[ attr ] ) {
                this[ attr ] = properties[ attr ];
            }
        }

        assign( this, options, initial );

        if( !this.__url ) {
            const script = currentScript();
            script && ( this.__url = script.getAttribute( 'data-src' ) );
        }

        this.rules.push( new Rule( 'events/$routers', { action : onroute } ) );

        while( root.$parent ) root = root.$parent;
        this.$root = root;

        if( root === this  ) {
            roots[ this.$name ] = this;
            const handler = e => {
                this.$broadcast( '$routers', e );
            };
            ec.$on( 'popstate', handler );
            this.$on( 'destruct', () => {
                ec.$off( 'popstate', handler );
            } );
        }

        this.$on( 'j://message', onmessage.bind( this, 'message' ) );
        this.$on( 'j://event', onmessage.bind( this, 'event' ) );

        this.__exts = {};
        this.__resources = [];
        this.__isready = false;

        if( checks.function( this.beforeinit ) ) {
            this.beforeinit();
        }

        const onrouteHandler = ()=> {
            onroute.call( this );
        };
        onrouteHandler();
        ec.$on( 'popstate', onrouteHandler );

        this.$on( 'destruct', () => {
            ec.$off( 'popstate', onrouteHandler );
        } );

        const init = checks.function( this.init ) && this.init( options );

        if( init && checks.function( init.then ) ) {
            this.__ready = init.then( () => {
                const promise = Promise.all( this.__resources );
                promise.then( () => {
                    console.info( `[J Package] ${this.$path()} is ready @${this.__url} ` );
                    this.__isready = true;
                    checks.function( this.action ) && this.action();
                } );
                return promise;
            } );
        } else {
            ( this.__ready = Promise.all( this.__resources ) ).then( () => {
                console.info( '[J Package] PACKAGE : "' + this.$path().join( '.' ) + '" is ready' );
                this.__isready = true;
                checks.function( this.action ) && this.action();
            });
        }
    }

    $receiver( signal, from, params ) {
        const signals = this.signals;
        const keys = getKeys( signals );

        for( let key of keys ) {
            let evt = null;
            let ext = null;
            const pos = key.indexOf( '@' );

            if( pos < 0 ) {
                evt = key;
            } else if( !pos ) {
                ext = key;
            } else {
                evt = key.slice( 0, pos );
                ext = key.slice( pos + 1 );  
            }

            if( signal === evt || ( evt === null && ext === from ) || ( evt === signal && ext === null ) ) {
                return signals[ key ].call( this, params, signal, from );
            }
        }
    }

    $url( path ){
        if( !this.__url ) return null;
        return path ? realPath( this.__url.replace( /\/[^/]+$/, '' ), path ) : this.__url;
    }

    $resources( resource ) {
        if( this.__isready ) {
            console.warn( '[J WARN] PACKAGE : Setting new item with "$resources" after "ready"' );
        }

        if( resource.$ready ) {
            const ready = resource.$ready();
            this.__resources.push( ready );
            return ready;
        } else {
            this.__resources.push( resource );
            return resource;
        }
    }

    $ready( func ) {
        if( !func ) return this.__ready;

        return this.__ready.then( () => {
            func.call( this, this );
        } );
    }
    $find( path ) {
        return extract(
            isArray( path ) ? path.join( '.$children.' ) : path.replace( /\./g, '.$children.' ),
            this.$children
        );
    }
    $path() {
        var pkg = this;
        const path = [];
        while( pkg ) {
            path.unshift( pkg.$name );
            pkg = pkg.$parent;
        }
        return path;
    }
    $sibling( name ) {
        return this.$parent ? this.$parent.$find( name ) : null;
    }

    $siblings( path = false ) {
        const all = this.$parant.$children;
        const siblings = [];
        for( let name in all ) {
            if( all[ name ] !== this ) {
                siblings.push( path ? all[ name ].$path() : all[ name ] );
            }
        }
        return siblings;
    }

    $install( name, url, ...params ) {
        const [ ns, rname ] = name.indexOf( '.' ) > 0 ? name.split( '.' ) : [ null, name ];

        if( ns ) {
            this[ '__$$' + ns ] || ( this[ '__$$' + ns ] = {} );
            if( !checks.function( this[ '$' + ns ] ) ) {
                this[ '$' + ns ] = n => {
                    return this[ '__$$' + ns ][ n ];
                };
            }
        }

        let r;

        const promise = new Promise( resolve => { r = resolve; } );
        const install = extension => {
            if( checks.function( extension ) ) {
                const ext = extension( { name, package : this }, ...params );
                ns ? ( this[ '__$$' + ns ][ rname ] = ext ) : ( this[ name ] = ext );
                checks.function( ext.$ready ) ?  ext.$ready( () => { r(); } ) : r();
                return ext;
            } else {
                if( checks.function( extension.$ready ) ) {
                    extension.$ready( () => { r(); } );
                } else if( checks.function( extension.then ) ) {
                    extension.then( () => { r(); } );
                } else { r(); }
                ns ? ( this[ '__$$' + ns ][ rname ] = extension ) : ( this[ name ] = extension );
                return extension;
            }
        };

        this.__isready || this.$resources( promise );

        if( !checks.string( url ) ) {
            const p = new Promise( resolve => {
                resolve( install( url ) );
            } );
            p.installation = true;
            return p;
        }

        if( !/^https?:\/\//.test( url ) ) {
            url = this.$url( url );
        }

        const p = new Promise( ( resolve, reject ) => {
            url = realPath( url );
            if( __extensions[ url ] ) {
                resolve( install( __extensions[ url ] ) );
            } else {
                Script.create( { url : url } ).then( () => {
                    resolve( install( __extensions[ url ] ) );
                } ).catch( reason => {
                    reject( reason );
                } );
            }
        } );

        p.installation = true;
        return p;
    }

    $style( path ) {
        const p = J$1.Style.create( {
            url : this.$url( path )
        } );
        return this.__isready ? p : this.$resources( p );
    }

    $script( path ) {
        const p = J$1.Script.create( {
            url : this.$url( path )
        } );
        return this.__isready ? p : this.$resources( p );
    }

    $mount( name, url, options = {} ) {
        let anonymous = false;
        if( arguments.length < 3 && !checks.string( arguments[ 1 ] ) ) {
            options = url || {};
            url = name;
            name = null;
        }

        if( !name ) {
            anonymous = true;
            name = '#anonymous$' + uniqueId();
        }

        url = realPath( url );

        const mount = P => {
            const p = new P( options, {
                $parent : this,
                $name : name,
                __url : url
            } );

            anonymous && ( p.$isanonymous = true );

            this.__isready || this.$resources( p );
            return ( this.$children[ name ] = p );
        };

        return new Promise( ( resolve, reject ) => {
            if( __packages[ url ] ) {
                mount( __packages[ url ] ).$ready( m => { resolve( m ); } );
            } else {
                Script.create( { url : url } ).then( () => {
                    mount( __packages[ url ] ).$ready( m => {
                        resolve( m );
                    } );
                } ).catch( reason => {
                    reject( reason );
                } );
            }
        } );
    }

    $touch( name, url, options ) {
        if( this.$children[ name ] ) {
            return this.$children[ name ];
        }
        return this.$mount( name, url, options );
    }

    $unmount( name ) {
        if( this.$children[ name ] ) {
            this.$children[ name ].$destruct();
            delete this.$children[ name ];
        }
    }

    $message( to, subject, body, from ) {
        if( !to ) {
            console.error( '[J Message] recipient is ' + to );
            return;
        }

        ( to instanceof J$1 ) || ( to = this.$find( to ) );
        return new Promise( ( resolve, reject ) => {
            try {
                to.$trigger( 'j://message', subject, body, new Event( {
                    reply( data ) {
                        resolve( data );
                    },
                    forward( recipient, nbody ) {
                        this.$message( recipient, subject, nbody || body ).then( response => {
                            resolve( response );
                        } ).catch( e => {
                            reject( e );
                        } );
                    },
                    from : from || this,
                    subject : subject
                } ) );
            } catch( e ) {
                reject( e );
            }
        } );
    }

    $unicast( to, subject, body, from ) {
        from || ( from = this );
        checks.string( to ) && ( to = this.$find( to ) ); 
        isArray( to ) || ( to = [ to ] );
        for( let i = 0, l = to.length; i < l; i += 1 ) {
            to[ i ].$trigger( 'j://event', subject, body, new Event( { from, subject } ) );
        }
    }

    $bubbling( subject, body, from ) {
        from || ( from = this );
        let pkg = this;
        while( pkg ) {
            const e = new Event( { from, subject } );
            pkg.$trigger( 'j://event', subject, body, e );
            if( e.__returnValue === false || pkg === pkg.$root ) break;
            pkg = pkg.$root;
        }
    }

    $broadcast( subject, body ) {
        if( this.$root !== this ) {
            this.$unicast( this.$root, subject, body );
        }
        this.$root.$multicast( subject, body, true, this );
    }

    $multicast( subject, body, deep, from ) {
        from || ( from = this );
        const children = this.$children;
        for( let name in children ) {
            const child = children[ name ];
            this.$unicast( child, subject, body, from );
            deep && child.$multicast( subject, body, deep, from );
        }
    }

    $destruct() {
        this.$trigger( 'destruct' );
    }

    $throw( message, ...args ) {
        throw new TypeError( `[Package ${this.$name}@${this.__url}] ${message}`, ...args );
    }
}

J$1.find = function( path ) {
    var root;
    !isArray( path ) && ( path = path.split( '.' ) );
    if( !path.length ) return null;
    root = path.shift();
    if( !roots[ root ] ) return null;
    if( !path.length ) return roots[ root ];
    return roots[ root ].$find( path );
};

var expect = chai.expect;

describe( 'J ( Basic Part) ', function() {
    describe( 'constructor', function() {
        it( 'Should extends from EventCenter', function() {
            expect( new J$1 ).be.an.instanceOf( EventCenter );
        } );

        it( 'Should inherit all properties from J.EventCenter which are defined in constructor', function() {
            expect( new J$1 ).to.contain.all.keys( [ '__listeners', '__handlers' ] );
        } );

        it( 'Should inherit all methods from J.EventCenter', function() {
            expect( new J$1 ).to.respondTo( '$on', '$off', '$once', '$trigger' );
        } );
    } );

    describe( '$root', function() {
        it( 'Should strictEqual itself', function() {
            var j;
            expect( j = new J$1 ).to.equal( j.$root );
        } );
    } );

    describe( '$parent', function() {
        it( 'Should have property "$parent" as default value is null', function() {
            expect( new J$1() ).be.have.property( '$parent' ).and.equal( null );
        } );

        it( 'Should overwrite the $parent property if $parent is setted in arguments', function() {
            expect( new J$1( { $parent : window } ).$parent ).to.equal( window );
        } );
    } );

    describe( '$children', function() {
        it( 'Should have property "$children" as default value is an {}', function() {
            expect( new J$1() ).be.have.property( '$children' ).and.be.a( 'Object' );
        } );
    } );

    describe( '$sibling', function() {
        it( 'Shold have method "$sibling"', function() {
            expect( new J$1() ).be.have.property( '$sibling' ).and.be.a( 'Function' );
        } );
    } );

    describe( '$path', function() {
        it( 'Shold have method "$path"', function() {
            expect( new J$1() ).be.have.property( '$path' ).and.be.a( 'Function' );
        } );
    } );

    describe( '$find', function() {
        it( 'Shold have method "$find"', function() {
            expect( new J$1() ).be.have.property( '$find' ).and.be.a( 'Function' );
        } );
    } );

    describe( '$mount', function() {
        it( 'Shold have method "$mount"', function() {
            expect( new J$1() ).be.have.property( '$mount' ).and.be.a( 'Function' );
        } );
    } );

    describe( '$unmount', function() {
        it( 'Shold have method "$unmount"', function() {
            expect( new J$1() ).be.have.property( '$unmount' ).and.be.a( 'Function' );
        } );
    } );
} );

var expect$1 = chai.expect;

describe( 'EventCenter', function() {

    describe( 'on', function() {
        it( 'Should return the eventCenter itselft', function() {
            var ec = new EventCenter;
            expect$1( ec.$on( 'x', function() {} ) ).to.equal( ec );
        } );
    } );

    describe( 'trigger', function() {
        it( 'Should execute all methods bound to the event type', function() {
            var ec = new EventCenter(),
                i = 0;
            ec.$on( 'increase', function() { i++; } ).$on( 'increase', function() { i++; } );
            ec.$trigger( 'increase' );
            expect$1( i ).to.equal( 2 );
        } );

        it( 'Should be called if there is a method of EventCenter\'s instance, which has a name with "on" +  triggered event type', function() {
            var ec = new EventCenter,
                i = 0;
            ec.onready = function() { i++; };
            ec.$trigger( 'ready' );
            expect$1( i ).to.equal( 1 );
        } );
    } );

    describe( 'off', function() {
        it( 'Should return the eventCenter itself if an unbind event type is transfored', function() {
            var ec = new EventCenter;
            expect$1( ec.$off( 'abc' ) ).to.equal( ec );
        } );

        it( 'Should not call hanlers if it was "off"', function() {
            var ec = new EventCenter,
                i = 0;

            var handler = function() { i++; };

            ec.$on( 'increase', handler ).$trigger( 'increase' );
            ec.$off( 'increase', handler ).$trigger( 'increase' );

            expect$1( i ).to.equal( 1 );
        } );
    } );

    describe( 'once', function() {
        it( 'Should be unbound after event has been triggered', function() {
            var i = 0;
            var ec = new EventCenter().$once( 'increase', function() { i++; } );
            ec.$trigger( 'increase' );
            ec.$trigger( 'increase' );
            expect$1( i ).to.equal( 1 );
        } );
    } );
} );

var expect$2 = chai.expect;

describe( 'Promise', function() {
    describe( 'Class Promise', function() {
        it( 'Should throw an error while set promise instance itself as a argument of resolve function in constructor', function() {
            var func;
            var p = new Promise( function( resolve ) {
                func = resolve;
            } );

            try { func( p ); } catch( e ) {
                expect$2( e ).to.be.an.instanceOf( TypeError );
            }
        } );
    } );

    describe( 'Promise.resolve', function() {
        it( 'Should return a instance of Promise', function() {
            expect$2( Promise.resolve() ).to.be.an.instanceof( Promise );
        } );

        it( 'Shoule return a resolved promise', function() {
            expect$2( Promise.resolve().status ).to.equal( 'resolved' );
        } );

        it( 'Should throw a TypeError', function() {
            try {
                new Promise.resolve();
            } catch( e ) {
                expect$2( e ).to.be.an.instanceOf( TypeError );
            }
        } );
    } );

    describe( 'Promise.reject', function() {
        it( 'Should return a Promise object', function() {
            expect$2( Promise.reject() ).to.be.an.instanceOf( Promise );
        } );
        it( 'Should throw a TypeError', function() {
            try {
                Promise.reject.call( Promise.resolve );
            } catch( e ) {
                expect$2( e ).to.be.an.instanceOf( TypeError );
            }
        } );
    } );

    describe( 'Promise.prototype.catch', function() {

        it( 'Should call "catch" while promise was rejected', function( done ) {
            new Promise( function( resolve, reject ) {
                setTimeout( function() {
                    reject( 'reject' );
                }, 30 );
            } ).catch( function( value ) {
                expect$2( value ).to.be.equal( 'reject' );
                done();
            } );

        } );

        it( 'Should call method "catch" immediately if add a "catch" method to a rejected promise', function( done ) {
            Promise.reject( 'reject' ).catch( function( value ) {
                expect$2( value ).to.be.equal( 'reject' ); 
                done();
            } );
        } );

    } );

    describe( 'Promise.prototype.then', function() {
        it( 'Shoulda been executed while Promise was resolved in async', function( done ) {
            new Promise( function( resolve ) {
                setTimeout( function() {
                    resolve( 'resolve' );
                }, 10 );
            } ).then( function( value ) {
                expect$2( value ).to.equal( 'resolve' );
                done();
            } );
        } );

        it( 'Method "reject" in "then" shoulda been exected while Promise was resolved in async', function( done ) {
            new Promise( function( resolve, reject ) {
                setTimeout( function() {
                    reject( 'reject' );
                }, 10 );
            } ).then( null, function( value ) {
                expect$2( value ).to.equal( 'reject' );
                done();
            } );
        } );

        it( 'If method "resolve" in "then" returned a Promise object, then the Promise shoulda be resolved while the Promise being resolved', function( done ) {
            Promise.resolve( '1' ).then( function() { 
                return Promise.resolve( 'resolve' );
            } ).then( function( value ) {
                expect$2( 'resolve' ).to.equal( value );
                done();
            } );
        } );

        it( 'If method "resolve" in "then" returned a Promise object, then wait for the Promise reject then to reject the previous Promise', function( done ) {
            Promise.resolve( '1' ).then( function() { 
                return Promise.reject( 'reject' );
            } ).catch( function( value ) {
                expect$2( 'reject' ).to.equal( value );
                done();
            } );
        } );

        it( 'In general, the value of promise shoulda been transfered to followed "resolve" in "then"', function( done ) {
            Promise.resolve(1).catch( function(){} ).then( function( value ){
                expect$2( value ).to.equal( 1 );
                done();
            } );

        } );

        it( 'Resolved status shoulda been transfered to all Promise objects which were following it, if there was no other promise objects was resolved', function( done ) {
            Promise.resolve(1).catch( function(){} ).then( function(){
            } ).then( function( value ){
                expect$2( value ).to.equal( undefined );
                done();
            } );
        } );

        it( 'If method "resolve" in "then" returned a Promise object, all Promise objects which were following it shoulda gotten status from the new Promise object from "resolve" method', function( done ) {
            Promise.resolve(1).catch( function(){} ).then( function(){} ).then( function() {
                return Promise.resolve( 2 );
            } ).then( function( value ) {
                expect$2( value ).to.equal( 2 );
                done();
            } );

        } );

        it( 'Method "reject" in "then" shoulda been called while the Promise was being rejected', function( done ) {
            Promise.reject( 1 ).then( null, function() {
                return Promise.resolve( 2 );
            } ).then( function( value ) {
                expect$2( value ).to.equal( 2 );
                done();
            } );
        } );

        if( typeof window.Promise == 'undefined' ) {
            window.Promise = Promise;
        }

        it( 'Shoulda gone well even if the method "resolve" returned a native Promise object', function( done ) {
            Promise.resolve( 1 ).then( function(){ 
                var p = new window.Promise( function( resolve ) {
                    setTimeout( function() {
                        resolve( 'resolve' );
                    }, 10 );
                } );
                return p;
            } ).then( function( value ) {
                expect$2( value ).to.equal( 'resolve' );
                done();
            } );
        } );

        it( 'Shoulda gone well even if the method "reject" returned a native Promise object', function( done ) {

            Promise.reject( 1 ).catch( function(){ 
                var p = new Promise( function( resolve, reject ) {
                    setTimeout( function() {
                        reject( 'reject' );
                    }, 10 );
                } );
                return p;
            } ).catch( function( value ) {
                expect$2( value ).to.equal( 'reject' );
                done();
            } );
        } );

        it( 'If the paramater of "resolve" method is another Promise object, the current Promise object should wait for the paramater Promise object resolved and then resolved itself', function( done ) {
            new Promise( function( resolve ) {
                resolve( Promise.resolve( 2 ) );
            } ).then( function( value ) {
                expect$2( value ).to.equal( 2 );
                done();
            } );
        } );

        it( 'Shoulda gone well if the paramater of "resolved" methos was a native Promise object', function( done ) {
            new Promise( function( resolve ) {
                resolve( window.Promise.resolve( 2 ) );
            } ).then( function( value ) {
                expect$2( value ).to.equal( 2 );
                done();
            } );
        } );

        it( 'If the param of "resolve" method is a native Promise object, the "catch" method can catch the reason thrown from the native Promise object', function( done ) {
            new Promise( function( resolve ) {
                resolve( window.Promise.reject( 2 ) );
            } ).then( null, function( reason ) {
                expect$2( reason ).to.equal( 2 );
                done();
            } );
        } );

        it( 'Shoulda been executed well even if the param of "resolve" method is "null"', function( done ) {
            new Promise( function(resolve ) {
                setTimeout( function() {
                    resolve( null );
                }, 10 );
            } ).then( function( value ) {
                expect$2( value ).to.equal( null );
                done();
            } ); 
        } );
    } );

    describe( 'Promise.all', function() {
        it( 'Shoulda execute "resolve" method in "then" after all Promise object in params were "resolved"', function( done ) {
            Promise.all( [ Promise.resolve(), Promise.resolve() ] ).then( function() {
                expect$2( true ).to.be.ok;
                done();
            } );
        } );
        
        it( 'Shoulda catch the exception after one Promise object in params was rejected', function( done ) {
            Promise.all( [ Promise.reject( 'reject' ), Promise.resolve( 'reject2' ) ] ).catch( function( reason ) {
                expect$2( reason ).to.be.equal( 'reject' );
                done();
            } );
        } );

        it( 'Shoulda gotten all returned values as array in "resolve" method, after all Promise objects in params were resolved', function( done ) {
            Promise.all( [ Promise.resolve( 'one' ), Promise.resolve( 'two' ) ] ).then( function( v ) {
                expect$2( ( v.length === 2 ) && v[0] === 'one' && v[1] === 'two' ).to.be.ok;
                done();
            } );
        } );
    } );

    describe( 'Promise.race', function() {

        it( 'Shoulda been executed after anyone Promise object in params was resolved', function( done ) {
            Promise.race( [ Promise.resolve( 'one' ), Promise.resolve( 'two' ) ] ).then( function( value ) {
                expect$2( value ).to.equal( 'one' );
                done();
            } );
        } );

        it( 'Shoulda caught exception after anyone Promise object in params was rejected', function( done ) {
            Promise.race( [ Promise.reject( 'one' ), Promise.resolve( 'two' ) ] ).catch( function( reason ) {
                expect$2( reason ).to.equal( 'one' );
                done();
            } );
        } );
    } );
} );

var expect$3 = chai.expect;

describe( 'Sequence', function() {
    describe( 'Sequence.all', function() {
        it( 'Should return a promise object', function( done ) {
            expect$3( Sequence.all( [] ) ).to.be.an.instanceof( Promise );
            done(); 
        } );

        it( 'Should resolve the promise, which was returned, after all promise in sequence were resolved', function( done ) {
            Sequence.all([
                function() {
                    return Promise.resolve( 'a' );
                },
                function() {
                    return Promise.resolve( 'b' );
                }
            ] ).then( function() {
                done();
            } );
        } );

        it( 'Should reject the promise, which was returned, if one promise in sequence rejected', function( done ) {
            Sequence.all([
                function() {
                    return Promise.resolve( 'a' );
                },
                function() {
                    return Promise.reject( 'b' );
                }
            ] ).then( function() {
            } ).catch( function() {
                done();
            } );
        } );

        it( 'Should get arguments as an array filled with return values of promises in sequence', function( done ) {
            Sequence.all( [
                function() {
                    return Promise.resolve( 'a' );
                },
                function() {
                    return Promise.resolve( 'b' );
                }
            ] ).then( function( values ) {
                expect$3( values[ 0 ] ).to.equal( 'a' );
                expect$3( values[ 1 ] ).to.equal( 'b' );
                done();
            } );
        } );

        it( 'Should execute promises one by one', function( done ) {
            var x = 0;
            Sequence.all( [
                function() {
                    expect$3( x ).to.equal( 0 );
                    x++;
                    return Promise.resolve();
                },
                function() {
                    expect$3( x ).to.equal( 1 );
                    x++;
                    return Promise.resolve();
                },
                function() {
                    expect$3( x ).to.equal( 2 );
                    x++;
                    return Promise.resolve();
                }
            ] ).then( function() {
                done();
            } );
        } );
    } );

    describe( 'Sequence.race', function() {
        it( 'Should return a promise', function() {
            expect$3( Sequence.race([]) ).to.be.an.instanceOf( Promise );
        } );

        it( 'Should resolve the promise, which was returned, after one of all promises in arguments be resolved', function( done ) {
            var x = 0;
            Sequence.race( [
                function() {
                    expect$3( x ).to.equal( 0 );
                    x++;
                    return Promise.reject();
                },
                function() {
                    expect$3( x ).to.equal( 1 );
                    x++;
                    return Promise.resolve();
                },
                function() {
                    x++;
                    return Promise.resolve();
                }
            ] ).then( function(){
                expect$3( x ).to.equal( 2 );
                done();
            } );
        } );

        it( 'Should', function( done ) {
            Sequence.race( [
                function() {
                    return Promise.reject();
                },
                function() {
                    return Promise.reject();
                },
                function() {
                    return Promise.resolve();
                }
            ] ).then( function(){
                done();
            } );
        } );
    } );
} );

var expect$4 = chai.expect;

describe( 'Storage', function() {
    describe( 'Storage in memory', function() {
        it( 'Can be stored with method "set" and pick out with method "get" ', function( done ) {
            Storage.set( 'Birth', 'November 8th', {
                level : 'page', 
                lifetime : 100000
            } );

            Storage.get( 'Birth' ).then( function( data ){
                expect$4( data.content ).to.equal( 'November 8th' );
                done();
            } );
        } );

        it( 'Data can be removed with method "remove"', function( done ) {
            Storage.set( 'Birth 2', 'November 8th', { 
                level : 'page'
            } ).then( function(){
                Storage.remove( 'Birth 2' ).then( function() {
                    Storage.get( 'Birth 2' ).catch( function( e ){
                        expect$4( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'All data can removed with method "clear" in one time', function( done ) {
            Storage.set( 'Birth 3', 'November 8th', { 
                level : 'page'
            } ).then( function(){
                Storage.clear().then( function() {
                    Storage.get( 'Birth 3' ).catch( function( e ){
                        expect$4( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'Should be removed if expired', function( done ) {
            Storage.set( 'Birth 4', 'November 8th', { 
                level : 'page',
                lifetime : 10
            } ).then( function(){
                setTimeout( function() {
                    Storage.get( 'Birth 4' ).then( function() {
                        throw new TypeError( 'Should not be here' );
                    } ).catch( function( e ){
                        expect$4( e ).to.be.ok;
                        done();
                    } );
                }, 20 );
            } );
        } );
    } );

    describe( 'Store data in localStorage', function() {
        it( 'Shoulda stored data with "set" method and picked out with method "get" ', function( done ) {

            Storage.set( 'Birth', 'November 8', {
                level : 'persistent' 
            } );

            Storage.get( 'Birth' ).then( function( data ){
                expect$4( data.content ).to.equal( 'November 8' );
                done();
            } ).catch( function( e ){
                throw e;
            } );
        } );

        it( 'Data can be removed with method "remove"', function( done ) {
            Storage.set( 'Birth', 'November 8th', {
                level : 'persistent'
            } ).then( function(){
                Storage.remove( 'Birth' ).then( function(){
                    Storage.get( 'Birth' ).catch( function( e ) {
                        expect$4( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'All data can removed with method "clear" in one time', function( done ) {
            Storage.set( 'Birth 3', 'November 8th', { 
                level : 'persistent'
            } ).then( function(){
                Storage.clear().then( function() {
                    Storage.get( 'Birth 3' ).catch( function( e ){
                        expect$4( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'Should be removed after over the life time', function( done ) {
            Storage.set( 'Birth 4', 'November 8th', { 
                level : 'persistent',
                lifetime : 10
            } ).then( function(){
                setTimeout( function() {
                    Storage.get( 'Birth 4' ).then( function() {
                        throw new TypeError( 'Should not be here' );
                    } ).catch( function( e ){
                        expect$4( e ).to.be.ok;
                        done();
                    } );
                }, 20 );
            } );
        } );
    } );

    describe( 'Store data in sessionStorage', function() {
        it( 'Can be stored with method "set" and pick out with method "get" ', function( done ) {
            Storage.set( 'Birth', 'November 8th', {
                level : 'session' 
            } );

            Storage.get( 'Birth' ).then( function( data ){
                expect$4( data.content ).to.equal( 'November 8th' );
                done();
            } );
        } );

        it( 'Data can be removed with method "remove"', function( done ) {
            Storage.set( 'Birth', 'November 8th', { 
                level : 'session'
            } ).then( function(){
                Storage.remove( 'Birth' ).then( function(){
                    Storage.get( 'Birth' ).catch( function( e ){
                        expect$4( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'All data can removed with method "clear" in one time', function( done ) {
            Storage.set( 'Birth 3', 'November 8th', { 
                level : 'session'
            } ).then( function(){
                Storage.clear().then( function() {
                    Storage.get( 'Birth 3' ).catch( function( e ){
                        expect$4( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'Should be removed after over the life time', function( done ) {
            Storage.set( 'Birth 4', 'November 8th', { 
                level : 'session',
                lifetime : 10
            } ).then( function(){
                setTimeout( function() {
                    Storage.get( 'Birth 4' ).then( function() {
                        throw new TypeError( 'Should not be here' );
                    } ).catch( function( e ){
                        expect$4( e ).to.be.ok;
                        done();
                    } );
                }, 20 );
            } );
        } );
    } );
} );

var expect$5 = chai.expect;
var script = currentScript();

describe( 'utils', function() {
    describe( 'uniqueId', function() {
        it( 'Should return an auto increment id', function() {
            var i = uniqueId();
            expect$5( uniqueId() ).to.equal( i + 1 );
        } );
    } );

    describe( 'checks', function() {
        it( 'Should be an object', function() {
            expect$5( checks.object( {} ) ).to.be.true;
        } );

        it( 'Should be an arrow function ', function() {
            expect$5( checks.arrowFunction( () => {} ) ).to.be.true;
            expect$5( checks.arrowFunction( ( x, y ) => { [ x, y ]; } ) ).to.be.true;
            expect$5( checks.arrowFunction( ( x ) => x ) ).to.be.true;
            expect$5( checks.arrowFunction( x => x ) ).to.be.true;
            expect$5( checks.arrowFunction( ( function() { return () => {} } )() ) ).to.be.true;
        } );

        it( 'Should not be an arrow function', function() {
            expect$5( checks.arrowFunction( function() {} ) ).to.be.false;
        } );
    } );

    describe( 'currentScript', function() {
        it( 'Should get the <script> tag which loaded current script', function() {
            expect$5( script ).to.equal( document.getElementById( 'specs-js' ) );
        } );
    } );

    describe( 'realPath', function() {
        it( 'url', function() {
            expect$5( realPath( 'http://www.nextseason.cc' ) ).to.equal( 'http://www.nextseason.cc' );
        } );

        it( 'url + absolute path', function() {
            expect$5( realPath( 'http://www.nextseason.cc', '/path' ) ).to.equal( 'http://www.nextseason.cc/path' );
        } );

        it( 'base + absolute path', function() {
            expect$5( realPath( 'http://www.nextseason.cc/a/b/c', '/path' ) ).to.equal( 'http://www.nextseason.cc/a/b/c/path' );
        } );

        it( 'base + relative path', function() {
            expect$5( realPath( 'http://www.nextseason.cc/a/b/c', '../path' ) ).to.equal( 'http://www.nextseason.cc/a/b/path' );
            expect$5( realPath( 'http://www.nextseason.cc/a/b/c', '../../path' ) ).to.equal( 'http://www.nextseason.cc/a/path' );
        } );
    } );

    describe( 'encodeHTML', function() {
        it( 'shoult be ok', function() {
            expect$5( encodeHTML ).to.be.a( 'function' );
        } );
    } );

    describe( 'escapeCSS', function() {
        it( 'shoult be ok', function() {
            expect$5( escapeCSS ).to.be.a( 'function' );
        } );
    } );

    describe( 'escapeReg', function() {
        it( 'shoult be ok', function() {
            expect$5( escapeReg ).to.be.a( 'function' );
        } );
    } );

    describe( 'stringf', function() {
        it( 'Should support simple variable', function() {
            expect$5( stringf( '{#name#}', { name : 'J' } ) ).to.equal( 'J' );
        } );

        it( 'Should support costumize delimiter', function() {
            expect$5( stringf( '-name-', { name : 'J' }, '-', '-' ) ).to.equal( 'J' );
        } );

        it( 'Should support simple operation', function() {
            expect$5( stringf( '{#3+1#}' ) ).to.equal( '4' );
        } );

        it( 'Should support ternary operator', function() {
            expect$5( stringf( '{# false ? "Y" : "N" #}' ) ).to.equal( 'N' );
        } );

        it( 'Should support complex javascript expression', function() {
            expect$5( stringf( '{# ( () => 1 )() #}' ) ).to.equal( '1' );
        } );

        it( 'Should support call a native function', function() {
            expect$5( stringf( '{#str.trim() #}', { str : '    a    ' } ) ).to.equal( 'a' );
        } );

        it( 'Should support parse a variable in multiple level chain', function() {
            expect$5( stringf( '{# str.sub #}', { str : { sub : 'a' } } ) ).to.equal( 'a' );
        } );

        it( 'Should support costumize delimiter', function() {
            expect$5( stringf( '-name-"name"', { name : 'J' }, '-', '-' ) ).to.equal( 'J"name"' );
        } );

        it( 'Should get empty string if cannot find value in data', function() {
            expect$5( stringf( '{#name#}name', {} ) ).to.equal( 'name' );
        } );

        it( 'Should support && operator', function() {
            expect$5( stringf( '{# show && "YES" #}', { show : true } ) ).to.equal( 'YES' );
        } );

        it( 'Should support && operator', function() {
            expect$5( stringf( '{# show || "NO" #}', { show : false } ) ).to.equal( 'NO' );
        } );
    } );

    describe( 'extract', function() {
        it( 'Should enable to get data with a property chain', function() {
            expect$5( extract( 'a.b.c', {
                a : { b : { c : 'str' } }
            } ) ).to.equal( 'str' );
        } );

        it( 'Should get an undefined if cannot fill the chain completely', function() {
            expect$5( extract( 'a.b.c', {
            } ) ).to.be.an( 'undefined' );
        } );
    } );

    describe( 'param', function() {
        it( 'Should return correct params string from a simple object', function() {
            expect$5( param( { x : 1, y : 2, z : '3' } ) ).to.equal( 'x=1&y=2&z=3' );
        } );

        it( 'Should return correct params string from an object with Array', function() {
            expect$5( param( { arr : [1,2] } ) ).to.equal( 'arr%5B%5D=1&arr%5B%5D=2' );
        } );

        it( 'Should return correct params string from an object with Object', function() {
            expect$5( param( { obj: { x : 1, y : 2 } } ) ).to.equal( 'obj%5Bx%5D=1&obj%5By%5D=2' );
        } );

        it( 'Should return correct params string from an object with Function', function() {
            expect$5( param( { obj: function() { return 1; } } ) ).to.equal( 'obj=1' );
        } );
    } );

    describe( 'md5', function() {
        it( 'Should return the correct md5 value from an empty string ', function() {
            expect$5( md5( '' ) ).to.equal( 'd41d8cd98f00b204e9800998ecf8427e' );
        } );

        it( 'Should return the correct md5 value frome a short sting', function() {
            expect$5( md5( 'd41d8cd98f00b204e9800998ecf8427e' ) ).to.equal( '74be16979710d4c4e7c6647856088456' );
        } );

        it( 'Should return the corrent md5 value from a string with Chinsese characters', function() {
            expect$5( md5( '你好' ) ).to.equal( '7eca689f0d3389d9dea66ae112e5cfd7' );
        } );

        it( 'Should return the correct md5 value from a big string with Chinese characters init', function() {
            expect$5( md5( '该事件被严肃问责人员共计10人。其中，对常州市高新区管委会原副主任、新北区原副区长陆平和常州黑牡丹建设投资有限公司总经理高国伟分别给予撤销党内职务、降级处分，对常州高新区管委会副主任陆建华给予党内严重警告处分、引咎辞职，对市教育局局长丁伟明、市教育局原副局长王定新、新北区环保局原局长蒋新耀分别给予党内警告处分，对新北区环保局监察大队大队长吴荣炳给予记大过处分，对新北区环保局副局长黄震给予记过处分，对常州黑牡丹建设投资有限公司副总经理李飞、项目现场负责人蒋跃栋分别给予免职。对新北区人民政府给予通报批评，并责成其向市政府作出深刻检查。新北区有关部门已依法对相关单位作出行政处罚。' ) ).to.equal( '867d6adbc4cb96eb04ba9084ec2641fc' );
        } );
    } );
} );

var expect$6 = chai.expect;

describe( 'ajax', function() {
    it( 'Should return a resolved Promise after get response', function( done ) {
        ajax( './extra/php/get.php', {
            method : 'GET',
            data : {
                x : 1,
                y : 2
            }
        } ).then( function( response ) {
            expect$6( response ).to.be.an.instanceof( Response );
            done();
        } ).catch( function( response ) {
            console.error( response );
        } );
    } );

    it( 'Should return a rejected Promise while request is error', function( done ) {
        ajax( './extra/php/err.php', {
            method : 'GET'
        } ).catch( function( response ) {
            expect$6( response ).to.be.an.instanceof( Response );
            done();
        } );
    } );

    it( 'Should be parse response text to JSON easily.', function( done ) {
        ajax( './extra/php/get.php', {
            method : 'GET',
            data : {
                x : 1,
                y : 2
            }
        } ).then( function( response ) {
            expect$6( response.url ).to.include( 'x=1&y=2' );
            done();
        } ).catch( function( response ) {
            console.error( response );
        } );
    } );

    it( 'Should get an URL with params transfered in data if the request method is "GET"', function( done ) {
        ajax( './extra/php/get.php', {
            method : 'GET',
            data : {
                x : 1,
                y : 2
            }
        } ).then( function( response ) {
            expect$6( response.json().x ).to.equal( '1' );
            done();
        } ).catch( function( response ) {
            console.error( response );
        } );
    } );

    it( 'Should get the real xhr object with getXhr', function() {
        ajax( './extra/php/get.php', {
            getXhr : xhr => expect$6( xhr ).to.be.an.instanceof( XMLHttpRequest )
        } );
    } );
} );

describe( 'request', function() {
    describe( 'Normal Request', function() {
        it( 'Should working........', function( done ) {
            request( './extra/php/get.php', {
                data : {
                    x : 1,
                    y : 2
                }
            } ).then( function( response ) {
                expect$6( response ).to.be.an.instanceof( Response );
                done();
            } );
        } );

        it( 'Should have been stored in Storage with storage configuration', function() {

        } );
    } );
} );

const sequence$1 = new Sequence();
const pool$2 = {};

const Style = {
    create : ( options = {} ) => {
        var resolve;

        var {
            url = null,
            style = null,
            id = null,
            data = {},
            external = config.style.external
        } = options;

        if( !url && !style ) throw new TypeError( 'Invalid URL and Style' );

        url && ( url = realPath( url ) );

        id = id || ( ( external ? 'style-external-' : 'style-' ) + ( url || uniqueId() ) );

        const exists = pool$2[ id ];

        if( external && exists ) return exists.promise;

        const promise = new Promise( ( r1 ) => { 
            resolve = r1;
        } );

        const head = document.head;
        const baseElem = document.getElementsByTagName( 'base' )[ 0 ];

        pool$2[ id ] = { id, url, style, promise, external };

        if( external ) {
            sequence$1.append( () => {
                const node = document.createElement( 'link' );
                node.onload = () => { resolve( id ); };
                node.id = id;
                node.rel = 'stylesheet';
                node.type = 'text/css';
                node.href = url;
                node.setAttribute( 'data-src', url );
                baseElem ? head.insertBefore( node, baseElem ) : head.appendChild( node );
                return promise;
            } );
            return promise;
        }

        const o = options.storage || {};
        const c = config.style.storage;

        sequence$1.append( () => {
            ( url ? request( url, {
                type : 'text',
                storage : {
                    level : o.level || c.level,
                    lifetime : o.lifetime !== undefined ? o.lifetime : c.lifetime,
                    priority : o.priority !== undefined ? o.priority : c.priority,
                    type : 'style'
                }
            } ).then( r => r.text() ) : style ).then( response => {
                pool$2[ id ].style = style = response;

                const node = document.createElement( 'style' );
                node.type = 'text/css';
                node.id = id;

                node.appendChild(
                    document.createTextNode( stringf( style, assign( { window, document }, data ), '{=', '=}' ) ) 
                );
                url && node.setAttribute( 'data-src', url );
                const old = document.getElementById( id );
                old ? head.replaceChild( node, old ) : head.appendChild( node );
                resolve( id );
            } ).catch( e => { throw e } );
            return promise;
        } );
        return promise;
    },
    remove : () => {
    }
};

var getComputedStyle = function(element, key){
    var styles;
    if (document.defaultView && document.defaultView.getComputedStyle) {
        styles = document.defaultView.getComputedStyle( element, null );
        if (styles) {
            return styles[key] || styles.getPropertyValue(key);
        }
    }
    return ''; 
};

var $ = function( id ) {
    return document.getElementById( id );
};

var $$ = function( selector) {
    return document.querySelectorAll( selector );
};

var expect$7 = chai.expect;

var node = document.getElementById( 'style-helper' );

describe( 'Style', function() {

    it( 'Should return a promise object', function() {
        expect$7( Style.create( {
            url : './extra/css/style1.css',
            external : true
        } ) ).to.have.property( 'then' ).and.be.a( 'Function' );
    } );

    it( 'Should create <link> node if external = true', function( done ) {
    	Style.create( {
            url : './extra/css/style1.css',
            external : true
        } ).then( function() {
            var background = getComputedStyle( node, 'width' );
            expect$7( background ).to.equal( '100px' );
            done();
		} );
    } );

    it( 'Should create only one <link> node if load stylesheet has same url multiple times', function( done ) {
    	Style.create( {
            url : './extra/css/style1.css',
            external : true
        } ).then( function() {
            expect$7( $$( 'link[href$="style1.css"]' ).length ).to.equal( 1 );
            done();
		} );
    } );

    it( 'Should create <style> tag if external = false', function( done ) {
        Style.create( {
            url : './extra/css/style1.css'
        } ).then( function( id ) {
            expect$7( $( id ) ).to.be.ok;
            done();
        } );
    } );

    it( 'Should create only one <style> tag if load same stylesheet multiple times wihtout specify different ids', function( done ) {
        Style.create( {
            url : './extra/css/style1.css'
        } ).then( function() {
            expect$7( $$( 'style[data-src$="style1.css"]' ).length ).to.equal( 1 );
            done();
        } );
    } );

    it( 'Should create another <style> tag with specify a different id', function( done ) {
        Style.create( {
            url : './extra/css/style1.css',
            id : 'custom-style-id-1'
        } ).then( function() {
            expect$7( $( 'custom-style-id-1' ) ).to.be.ok;
            done();
        } );
    } );

    it( 'Should compile style text content with stringf method', function( done ) {
        Style.create( {
            url : './extra/css/style1.css',
            id : 'custom-style-id-2',
            data : {
                'fontSize' : 59
            }
        } ).then( function() {
            expect$7( $( 'custom-style-id-1' ) ).to.be.ok;
            expect$7( $( 'custom-style-id-2' ) ).to.be.ok;
            expect$7( getComputedStyle( node, 'font-size' ) ).to.equal( '59px' );
            done();
        } );
    } );

    it( 'Should create <style> tags in order', function( done ) {
        Style.create( {
            url : './extra/php/style.php',
            id : 'style-in-order-1'
        } );

        Style.create( {
            url : './extra/css/style1.css',
            id : 'style-in-order-2'
        } ).then( function() {
            var styles = $$( 'style[id^="style-in-order"]' );
            expect$7( styles[ 0 ].id ).to.equal( 'style-in-order-1' );
            expect$7( styles[ 1 ].id ).to.equal( 'style-in-order-2' );
            done();
        } );
    } );

    it( 'Should render stylesheet with css text string', function( done ) {
        Style.create( {
            style : 'body{ background : {= color =} }',
            id : 'style-create-with-text',
            data : {
                color : 'cyan'
            }
        } ).then( function( id ) {
            expect$7( $( id ).textContent ).to.equal( 'body{ background : cyan }' );
            done();
        } );
    } );

    it( 'Should modify exists stylesheet if id is exists', function( done ) {
        Style.create( {
            style : 'body{ background : {= color =} }',
            id : 'style-create-with-text',
            data : {
                color : 'white'
            }
        } ).then( function( id ) {
            expect$7( $( id ).textContent ).to.equal( 'body{ background : white }' );
            done();
        } );
    } );

} );

var expect$8 = chai.expect;

var $$$1 = function( selector) {
    return document.querySelectorAll( selector );
};

describe( 'Script', function() {
    it( 'Should return a promise object', function() {
        expect$8( Script.create( {
            url : './extra/js/a.js'
        } ) ).to.have.property( 'then' ).and.be.a( 'Function' );
    } );
    it( 'Should create a <script> node with an attribute src', function( done ) {
        Script.create( {
            url : './extra/js/b.js',
            external : true
        } ).then( function( node ) {
            expect$8( window.TEST_IN_A_JS ).to.equal( 100 );
            expect$8( node.src && !node.text ).to.be.ok;
            done();
        } );
    } );

    it( 'Should create only one <script> node if create script with same url multiple times', function( done ) {
        Script.create( {
            url : './extra/js/a.js'
        } ).then( function() {
            expect$8( $$$1( 'script[data-src$="a.js"]' ).length ).to.equal( 1 );
            done();
        } );
    } );

    it( 'Should create <script> tags in correct order', function( done ) {
        Script.create( {
            url : './extra/php/script.php'
        } );

        Script.create( {
            url : './extra/js/c.js'
        } ).then( function() {
            expect$8( window.TEST_IN_SCRIPT_JS ).to.equal( 500 );
            done();
        } );
    } );
} );

const Package = function( o = {} ) {
    const script = currentScript();

    if( !script ) {
        throw new TypeError( 'Cannot find script element' );
    }

    const P = class extends J$1 {
        constructor( options = {}, i = {} ) {
            super( assign( {}, options ), i );
        }
    };

    assign( P.prototype, o );
    return( __packages[ script.getAttribute( 'data-src' ) ] = P );
};

const extend = c => __extensions[ currentScript().getAttribute( 'data-src' ) ] = c;

const view = {
    leftDelimiter : '{{',
    rightDelimiter : '}}',
    storage : {
        level : 'persistent',
        priority : 6,
        lifetime : 0
    }
};

config.view = view;

let id$1 = 0;

class Extension extends EventCenter {
    constructor( options, init ) {
        super();
        if( !init || !init.name || !init.package ) {
            console.error( '[J ERROR] Extension : the initial information is invalid.', init, this );
        }
        this.__isReady = false;
        this.__id = uniqueId();
        this.__resources = [];
        this.__ready = new Promise( r => ( this.__resolve = r ) );
        this.$name = init.name;
        this.$type = init.$type;
        this.$package = init.package;
        this.$package.__isReady || this.$package.$resources( this );
    }

    $init() {
        const init = checks.function( this.init ) && this.init();

        if( init && checks.function( init.then ) ) {
            init.then( () => {
                const promise = Promise.all( this.__resources );
                promise.then( () => {
                    this.__resolve();
                    this.__isReady = true;
                    checks.function( this.action ) && this.action();
                } );
            } );
        } else {
            Promise.all( this.__resources ).then( () => {
                this.__resolve();
                this.__isReady = true;
                checks.function( this.action ) && this.action();
            } );
        }
    }

    $ready( func ) {
        return func ? this.__ready.then( () => func.call( this ) ) : this.__ready;
    }

    $resources( resource ) {
        if( this.__isReady ) {
            console.warn( '[J WARN] Extension : Setting new item with "$resources" after "ready"' );
        }
        if( resource.$ready ) {
            this.__resources.push( resource.$ready() );
            return resource.$ready();
        } else {
            this.__resources.push( resource );
            return resource;
        }
    }

    $signal( signal, params ) {
        return this.$package.$receiver( signal, this.$name, params );
    }

    $mount( name, ...args ) {
        if( !name ) {
            name = `#anonymous-${this.$type || 'extension'}-mount-${id$1++}` + id$1++;
        }
        return this.$package.$mount( name, ...args );
    }

}

const eventcenter = new EventCenter();

const Record = {
    node : null,
    handler : null,
    events : {},
    set( path ) {
        if( this.events[ path ] ) return;
        this.events[ path ] = true;
        eventcenter.$on( path, this.handler );
        this.handler && this.node.$events.push( [ path, this.handler ] );
    },
    reset() {
        this.node = null;
        this.handler = null;
        this.events = null;
    },
    start( node, events, handler ) {
        this.node = node;
        this.events = events;
        this.handler = handler;
    }
};

function getDataByPath( src, path ) {
    return new Function( 's', 'try{with(s)return ' + path + '}catch(e){window.console.warn("[J WARN] getDataByPath : " + e)}' )( src );
}

const inCache = {};

// expression without {{ }}
function expression( str ) {
    if( inCache[ str ] ) return inCache[ str ];
    const args = [ 's', ...Array.prototype.splice.call( arguments, 1 ) ];
    return ( inCache[ str ] = new Function( ...args, 'try{with(s)return ' + str + '}catch(e){window.console.warn("[J WARN] extension : " +e);return null}' ) );
}

const leftDelimiter = '{{';
const rightDelimiter = '}}';
const leftDelimiterReg = escapeReg( leftDelimiter );
const rightDelimiterReg = escapeReg( rightDelimiter );

let id$2 = 0;

function wrapFilter( exp, filters ) {
    while( filters.length ) {
        const filter = filters.shift();
        const step = filter.trim().split( /[\s|,]+(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g );
        const func = JSON.stringify( step.shift().trim() );
        step.unshift( exp );
        exp = `__e(${func},$filters,__f)(${step.join(',')})`;
    }
    return exp;
}

function getFilter( exp, f1, f2 ) {
    const fn = new Function( 's', `with(s)return ${exp}` );
    try { return fn( f1 ) } catch( e ) { return fn( f2 ) }
}

function parseFilter( str ) {
    if( str.indexOf( '#' ) < 0 ) {
        return str;
    }
    const filters = str.split( /(?:#)(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g );

    if( filters.length === 1 ) {
        return str;
    }

    let exp = filters.shift();

    while( filters.length ) {
        const filter = filters.shift();
        const step = filter.trim().split( /[\s|,]+(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g );
        const func = JSON.stringify( step.shift().trim() );
        step.unshift( exp );
        exp = `__e(${func},$filters,__f)(${step.join(',')})`;
    }
    return exp;
}

function evalString( exp ) {
    return `var __e=${getFilter.toString()};
        try{
            var __f=J.View.$filters;
            with(s)return ${parseFilter( exp )}
        }catch(e){
            window.console.warn("[J WARN] View Interpolation : " + e);
            return null
        }`;
}

const inCache$1 = {};

// expression without {{ }}
function interpolation( str ) {
    if( inCache$1[ str ] ) return inCache$1[ str ];
    const args = [ 's', ...Array.prototype.splice.call( arguments, 1 ) ];
    return ( inCache$1[ str ] = new Function( ...args, evalString( str ) ) );
}

const reg = new RegExp( leftDelimiterReg + '((.|\\n)+?)' + rightDelimiterReg, 'g' );

const stringifyCache = {};
const fnCache = {};
// expression
function expression$1( str ) {
    if( fnCache[ str ] ) return fnCache[ str ];
    let match, index;
    let lastIndex = reg.lastIndex = 0;
    const tokens = [];
    const stringify = JSON.stringify;
    while( ( match = reg.exec( str ) ) ) {
        index = match.index;
        if( index > lastIndex ) {
            const t = str.slice( lastIndex, index );
            tokens.push( stringifyCache[ t ] || ( stringifyCache[ t ] = stringify( t ) ) );
        }
        tokens.push( '(' + parseFilter( match[ 1 ] ) + ')' );
        lastIndex = index + match[ 0 ].length;
    }
    if( lastIndex < str.length ) {
        const t = str.slice( lastIndex );
        tokens.push( stringifyCache[ t ] || ( stringifyCache[ t ] = stringify( t ) ) );
    }
    const exp = tokens.join( '+' + stringify( '' ) + '+' );
    return ( fnCache[ str ] = new Function( 's', evalString( exp ) ) );
}

function traverseNode$1( node, cb ) {
    cb( node );
    const nodes = node.childNodes;
    for( let i = 0, l = nodes.length; i < l; i = i + 1 ) {
        nodes[ i ].$id && traverseNode$1( nodes[ i ], cb );
    }
}

function purifyNode( node ) {
    traverseNode$1( node, item => {
        if( item.$package ) {
            item.$package.$parent.$unmount( item.$package.$name );
        }
        if( item.$id ) {
            const events = item.$events;
            for( let i = 0, l = events.length; i < l; i = i + 1 ) {
                eventcenter.$off( events[ i ][ 0 ], events[ i ][ 1 ] );
            }
        }
        item.$relevant && purifyNode( item.$relevant );
        item.$ec.$trigger( 'remove' );
    } );
}

function removeNode( node, parentNode ) {
    purifyNode( node );
    parentNode || ( parentNode = node.parentNode );
    return parentNode && parentNode.removeChild( node );
}

function replaceNode( newNode, oldNode, parentNode, pure = false ) {
    pure || purifyNode( oldNode );
    parentNode || ( parentNode = oldNode.parentNode );
    return parentNode && parentNode.replaceChild( newNode, oldNode );
}

function createAnchor( text, scope, options ) {
    const anchor = wrapNode( document.createTextNode( text || '' ), scope, options );
    anchor.$isAnchor = true;
    return anchor;
}

function wrapNode( node, scope, options ){
    if( node.$id ) return node;
    assign( node, { 
        $events : [],
        $eventMarks : {},
        $ec : new EventCenter(),
        $id : ++id$2,
        $scope : scope,
        $options : options = options ? assign( {}, options ) : {}
    } );
    return node;
}

function cloneNode( node ) {
    const n = node.cloneNode( true );
    n.$sign = node.$id;
    return n;
}


function copyDescripter( dest, src, keys ) {
    for( let i = 0, l = keys.length; i < l; i = i + 1 ) {
        const key = keys[ i ];
        const descriptor = Object.getOwnPropertyDescriptor( src, key );
        if( !descriptor ) continue;
        defineProperty( dest, key, descriptor );
    }
    return dest;
}

function convertPackage( str, pkg ) {
    return str.replace( 
        /(^|[^$_\w\d.])package\b(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g,
        '$1 J.find("' + pkg.$path().join( '.' ).replace( /(\$)/g, '$$$$' ) + '")'
    );
}

function strConvert( str, key, variable ) {
    return str.replace(
        new RegExp( 
            '(^|[^$_\\w\\d.])' + 
            escapeReg( key ) + 
            '\\b(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)', 'g'
        ),
        '$1' + variable
    );
}

function findMethod( func, view ) {
    for( let method in view ) {
        if( view[ method ] === func ) {
            return func.bind( view );
        }
    }

    if( view.$package ) {
        for( let method in view.$package ) {
            if( view.$package[ method ] === func ) {
                return func.bind( view.$package );
            }
        }
    }
}

var $skip = {
    compile( directive, node ) {
        node.removeAttribute( directive.name );
        node.$options.skip = true;
    }
};

var $once = {
    compile( directive, node ) {
        node.removeAttribute( directive.name );
        node.$options.once = true;
    }
};

function fail( view, node, f ) {
    const options = node.$options;
    const scope = node.$scope;
    const anchor = createAnchor( '', scope, options ); 

    function handler() {
        Record.start( anchor, anchor.$eventMarks, handler );
        if( f( scope ) ) {
            options.skip = false;
            const newNode = anchor.$originalNode.cloneNode( true );

            /**
             * replace node before traverse so that the "newNode" will be put in
             * node tree, some directive maybe want to replace it with another node
             */
            replaceNode( newNode, anchor );
            traverse( [ newNode ], view, scope, options );
            node.$originalNode = anchor.$originalNode;
            if( anchor.$forAnchor ) {
                newNode.$forAnchor = anchor.$forAnchor;
                anchor.$forAnchor.$items[ anchor.$forPosition ] = newNode;
            }
        }
        Record.reset();
    }

    options.once || handler();

    anchor.$originalNode = node.$originalNode;
    options.skip = true;
    replaceNode( anchor, node );
    if( node.$forAnchor ) {
        const forItems = node.$forAnchor.$items;
        anchor.$forAnchor = node.$forAnchor;
        const keys = getKeys( forItems );
        for( let i = 0, l = keys.length; i < l; i = i + 1 ) {
            if( forItems[ keys[ i ] ] === node ) {
                forItems[ anchor.$forPosition = keys[ i ] ] = anchor;
                break;
            }
        }
    }
}

var $if = {
    bind( directive, node ) {
        node.$originalNode || ( node.$originalNode = node.cloneNode( true ) );
        node.$$if = true;
        let next = node.nextElementSibling;
        const stack = [ '!(' + directive.value + ')' ];

        while( next && next.hasAttribute( ':elseif' ) ) {
            const exp = next.getAttribute( ':elseif' );
            next.setAttribute( ':if', stack.join( '&&' ) + '&& (' + exp + ')' );
            stack.push( '!(' + exp + ')' );
            next.removeAttribute( ':elseif' );
            next = next.nextElementSibling;
        }
        if( next && next.hasAttribute( ':else' ) ) {
            next.removeAttribute( ':else' );
            next.setAttribute( ':if', stack.join( '&&' ) );
        }
    },
    compile( directive, node, view ) {
        const value = directive.value;
        const scope = node.$scope;
        const f = interpolation( value );
        const style = node.style;
        const display = style.display;
        node.removeAttribute( ':if' );
        let remove = true;

        if ( node.hasAttribute( 'if-remove' ) ) {
            if( checks.false( node.getAttribute( 'if-remove' ) ) ) {
                remove = false;
            }
        }

        if( !node.$options.once ) {
            Record.start( node, node.$eventMarks[ ':if' ], function() {
                if( remove ) {
                    f( scope ) || fail( view, node, f );
                    return;
                }
                style.display = f( scope ) ? display : 'none';
            } );
        }
        f( scope ) || fail( view, node, f );
        Record.reset();
    }
};

var $show = {
    bind( directive, node ) {
        let next = node.nextElementSibling;
        const stack = [ '!(' + directive.value + ')' ];

        while( next && next.hasAttribute( ':elseshow' ) ) {
            const exp = next.getAttribute( ':elseshow' );
            next.setAttribute( ':show', stack.join( '&&' ) + '&& (' + exp + ')' );
            stack.push( '!(' + exp + ')' );
            next.removeAttribute( ':elseshow' );
            next = next.nextElementSibling;
        }
        if( next && next.hasAttribute( ':else' ) ) {
            next.removeAttribute( ':else' );
            next.setAttribute( ':show', stack.join( '&&' ) );
        }
    },
    compile( directive, node ) {
        const value = directive.value;
        const scope = node.$scope;
        const f = interpolation( value );
        const style = node.style;
        const display = style.display;
        node.removeAttribute( directive.name );

        function handler() {
            Record.start( node, node.$eventMarks[ ':show' ], handler );
            style.display = f( scope ) ? display : 'none'; 
            Record.reset();
        }

        if( node.$options.once ) {
            style.display = f( scope ) ? display : 'none';
        } else {
            handler();
        }
    }
};

var Value = class {
    constructor( value, options ) {
        this.value = value;
        assign( this, options ); 
    }
};

const methods = Object.create( arrayPrototype );

[ 'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse' ].forEach( method => {

    const original = arrayPrototype[ method ];

    defineProperty( methods, method, {
        value() {
            const args = [ ...arguments ];
            const result = original.apply( this, args );
            const ob = this.__ob;
            const path = ob.__path;
            let inserted;
            const insertedArgs = [];
            switch( method ) {
                case 'push' :
                case 'unshift' :
                    inserted = args;
                    break;
                case 'splice' :
                    insertedArgs.push( args[ 0 ] );
                    ( args[ 1 ] !== undefined ) && insertedArgs.push( args[ 1 ] );
                    inserted = args.slice( 2 );
                    break;
            }
            if( inserted ) {
                for( let item of inserted ) {
                    const id = uniqueId(); 
                    insertedArgs.push( id );
                    if( typeof item === 'object' ) {
                        traverse$1( item, path + '.[' + id + ']' );
                    }
                }
            }
            original.apply( ob.__subs, insertedArgs.length ? insertedArgs : args );
            mtrigger( this );
            eventcenter.$strigger( path, this, this, path );
            return result;
        },
        enumerable : false,
        writable : true,
        configurable : true
    } );

    defineProperty( methods, '$set', {
        value( i, v ) {
            if( i >= this.length ) {
                this.length = +i + 1;
            }
            return this.splice( i, 1, v )[ 0 ];
        },
        enumerable : false,
        writable : true,
        configurable : true
    } );
} );

function bindProto( arr ) {
    if( '__proto__' in {} ) {
        /* jshint proto: true */
        arr.__proto__ = methods;
        /* jshint proto: false */
    }
    const keys = Object.getOwnPropertyNames( methods );
    for( let i = 0, l = keys.length; i < l; i = i + 1 ) {
        defineProperty( arr, keys[ i ], {
            value : methods[ keys[ i ] ]
        } );
    }
}

function subscope( dest, key, val ) {
    defineProperty( dest, key, {
        enumerable : true,
        configurable : true,
        set : function J_OB_SETTER( v ) {
            const data = val.data();
            val.arr ? data.$set( val.path, v ) : ( data[ val.path ] = v );
        },
        get : function J_OB_GETTER() {
            const data = val.data();
            if( Record.node && val.arr ) {
                const ob = data.__ob;
                if( ob ) {
                    Record.set( val.__ob ? val.__ob.__path : ( ob.__path + '[' +  ob.__subs[ val.path ] + ']' ) );
                }
            }
            return data[ val.path ];
        }
    } );
}

function translate( obj, key, val, dest ) {
    // skip properties start with double underline
    if( key.charAt( 0 ) === '_' && key.charAt( 1 ) === '_' ) return;
    if( !dest ) {
        dest = obj;
    }
    const ob = dest.__ob;
    const path = ob[ key ];

    const descriptor = Object.getOwnPropertyDescriptor( obj, key );
    if( descriptor && !descriptor.configurable ) return;
    const setter = descriptor && descriptor.set;
    const getter = descriptor && descriptor.get;

    if( val && val.__var ) {
        subscope( dest, key, val );
    } else {
        defineProperty( dest, key, {
            enumerable : true,
            configurable : true,
            set : function J_OB_SETTER( v ) {
                const value = getter ? getter.call( obj ) : val; 
                let special = null;
                if( v instanceof Value ) {
                    special = v;
                    v = v.value;
                }
                if( v === value ) return;
                console.log( '[J Observer] SET : ', path );
                const isArr = isArray( val );
                if( setter ) {
                    setter.call( obj, special || v  );
                    eventcenter.$strigger( path, v, value, path, special );
                } else {
                    val = v;
                    if( typeof v === 'object' && v !== null ) {
                        traverse$1( v, path );
                        isArr || traverseTrigger( v );
                        eventcenter.$strigger( path, v, value, path, special );
                    } else {
                        eventcenter.$strigger( path, v, value, path, special );
                    }
                }
            },
            get : function J_OB_GETTER() {
                const v = getter ? getter.call( obj ) : val;
                Record.node && Record.set( path );
                return v;
            }
        } );
    }
}

function mtrigger( obj ) {
    if( typeof obj !== 'object' ) return;
    const paths = obj.__ob.__paths;

    for( let i = 0, l = paths.length; i < l; i += 1 ) {
        eventcenter.$strigger( paths[ i ], obj, obj, paths[ i ] );
    }
}

function traverseTrigger( obj ) {
    const isarr = isArray( obj );

    if( isarr ) {
        for( let i = 0, l = obj.length; i < l; i = i + 1 ) {
            const path = obj.__ob.__path + '[' + obj.__ob.__subs[ i ] + ']';
            eventcenter.$strigger( path, obj[ i ], obj[ i ], path );
            typeof obj[ i ]=== 'object' && traverseTrigger( obj[ i ] );
        }
    }
    const keys = getKeys( obj );
    for( let i = 0, l = keys.length; i < l; i = i + 1 ) {
        const key = keys[ i ];
        const val = obj[ key ];
        if( isarr && ( Math.floor( key ) == key ) ) continue;
        const path = obj.__ob[ key ];
        eventcenter.$strigger( path, val, val, path );
        ( typeof val === 'object' && val && !val.__var ) && traverseTrigger( val );
    }
}

function traverse$1( obj, base, dest ) {
    dest || ( dest = obj );
    base || ( base = dest.__ob && dest.__ob.__path || '' );
    dest.__ob || defineProperty( dest, '__ob', {
        enumerable : false,
        writable : false,
        value : {}
    } );

    const ob = dest.__ob;
    ob.__path = base;
    if( ob.__paths ) {
        ob.__paths.indexOf( base ) < 0 && ob.__paths.push( base );
    } else {
        ob.__paths = [ base ];
    }
    const isarr = isArray( obj );

    if( isarr ) {
        const subs = ob.__subs = [];
        bindProto( obj );
        for( let i = 0, l = obj.length; i < l; i = i + 1 ) {
            const id = uniqueId();
            const item = obj[ i ];
            subs.push( id );
            if( typeof item === 'object' ) {
                traverse$1( obj[i], base + '[' + id + ']' );
            }
        }
    }
    const keys = getKeys( obj );
    for( let i = 0, l = keys.length; i < l; i = i + 1 ) {
        const key = keys[ i ];
        const val = obj[ key ];
        if( isarr && ( Math.floor( key ) == key ) ) continue;
        const path = base ? base + '.' + key : key;
        ob[ key ] = path;
        checks.function( val ) || translate( obj, key, val, dest );
        ( typeof val === 'object' && val && !val.__var ) && traverse$1( val, path );
    }
    return dest;
}

function observer( obj, id, inherit ) {
    const Observer = function( obj ) {
        traverse$1( obj, id, this );
    };
    inherit && ( Observer.prototype = inherit );
    return new Observer( obj );
}

const directiveCache = {};

let $id = 0;
function forIn( view, obj, func, anchor, key, value, index ) {
    const frag = document.createDocumentFragment();
    const node = anchor.$node;
    const anchorItems = anchor.$items;
    const ob = obj.__ob;
    const keys = getKeys( obj );
    for( let i = 0, l = keys.length; i < l; i += 1 ) {
        const attr = keys[ i ];
        const item = cloneNode( node );
        anchorItems[ ob[ attr ] ] = item;
        frag.appendChild( item );
        const v = {};
        value && ( v[ value ] = {
            data : func,
            path : attr,
            __var : true 
        } );
        index && ( v[ index ] = i );
        const nscope = observer( v, --$id, node.$scope );
        key && defineProperty( nscope, key, {
            enumerable : true,
            writable : true,
            value : attr
        } );
        wrapNode( item, nscope, node.options, true );
        item.$index = i;
        item.$forAnchor = anchor;
    }
    traverse( slice.call( frag.childNodes ), view );
    return frag;
}

function updateForIn( view, obj, func, anchor, key, value, index ) {
    const node = anchor.$node;
    const anchorItems = anchor.$items;
    const ob = obj.__ob;
    const scope = anchor.$scope;
    const options = anchor.$options;
    const keys = getKeys( obj );
    const newItems = assign( {}, anchorItems );
    const parentNode = anchor.parentNode;
    const style = parentNode.style;
    let visibility;
    if( style ) {
        visibility = style.visibility;
        style.visibility = 'hidden';
    }
    let sibling = anchor.nextSibling;

    const forItemKeys = getKeys( anchorItems );
    for( let i = 0, l = forItemKeys.length; i < l; i = i + 1 ) {
        delete anchorItems[ forItemKeys[ i ] ];
    }

    for( let i = 0, l = keys.length; i < l; i += 1 ) {
        const attr = keys[ i ];
        const path = ob[ attr ];
        const item = newItems[ path ];
        if( item ) {
            if( i !== item.$index ) {
                parentNode.insertBefore( item, sibling );
                item.$index = i;
                index && ( item.$scope[ index ] = i );
            }
            anchorItems[ path ] = item;
            delete newItems[ path ];
        } else {
            const nNode = node.cloneNode( true );
            const v = {};
            value && ( v[ value ] = {
                data : func,
                path : attr,
                __var : true 
            } );
            index && ( v[ index ] = i );
            const nscope = observer( v, --$id, scope );
            key && defineProperty( nscope, key, {
                enumerable : true,
                writable : true,
                value : attr
            } );
            anchorItems[ path ] = nNode;
            wrapNode( nNode, nscope, options, true );
            nNode.$index = i;
            nNode.$forAnchor = anchor;
            parentNode.insertBefore( nNode, sibling );
            traverse( [ nNode ], view );
        }
        sibling.$forEnd || ( sibling = sibling.nextSibling );
    }
    const ks = getKeys( newItems );
    for( let i = 0, l = ks.length; i < l; i = i + 1 ) {
        removeNode( newItems[ ks[ i ] ], parentNode );
    }
    style && ( style.visibility = visibility );
    if( node.tagName === 'OPTION' ) {
        parentNode.$$model && parentNode.onchange();
    }
}

function updateForOf( view, list, func, anchor, endAnchor, value, index ) {
    const parentNode = anchor.parentNode;
    const style = parentNode.style;
    let visibility;
    if( style ) { 
        visibility = style.visibility;
        style.visibility = 'hidden!important';
    }

    const frag = forOfNodes( view, list, func, anchor, value, index );
    parentNode.insertBefore( frag, endAnchor );

    style && ( style.visibility = visibility );
    if( anchor.$node.tagName === 'OPTION' ) {
        parentNode.$$model && parentNode.onchange();
    }
}
function forOfNodes( view, list, func, anchor, value, index ) {
    const frag = document.createDocumentFragment();
    const node = anchor.$node;
    const items = anchor.$items;
    const anchorItems = anchor.$items = {};
    const options = anchor.$options;
    const scope = anchor.$scope;
    if( list === null ) list = [];
    if( isArray( list ) ) {
        const subs = ( list && list.__ob ) ? list.__ob.__subs : null;
        for( let i = 0, l = list.length; i < l; i = i + 1 ) {
            const id = subs ? subs[ i ] : i;
            if( items[ id ] ) {
                const item = frag.appendChild( items[ id ] );
                const scope = item.$scope;
                subscope( scope, value, {
                    data : func,
                    path : i,
                    arr : true,
                    __var : true
                } );
                index && ( scope[ index ] = i );
                anchorItems[ id ] = item;
                delete items[ id ];
            } else {
                const item = cloneNode( node );
                anchorItems[ id ] = item;
                frag.appendChild( item );
                const v = {};
                value && ( v[ value ] = {
                    data : func,
                    path : i,
                    arr : true,
                    __var : true
                } );
                index && ( v[ index ] = i );
                item.$forAnchor = anchor;
                wrapNode( item, observer( v, --$id, scope ), options, true );
                traverse( [ item ], view );
            }
        }

        for( let id in items ) {
            removeNode( items[ id ] );
        }
    }

    return frag;
}

function forOf() {
    return forOfNodes( ...arguments );
}

var $for = {
    compile( directive, node, view ) {
        let descriptor, f, frag, func;
        const value = directive.value;
        const parentNode = node.parentNode;
        node.removeAttribute( directive.name ); 
        let m = directiveCache[ value ];
        if( !m ) {
            m = value.match( /(?:(.*?)(?:,\s*(.*?))?(?:,\s*(.*?))?)\s+(of|in)\s+(.*)/ );
            directiveCache[ value ] = m;
        }
        const options = node.$options;
        const scope = node.$scope;
        const startAnchor = createAnchor( '', scope, options );
        startAnchor.$forStart = true;
        startAnchor.$node = node;
        //startAnchor.$$$hasIf = node.$$if;
        parentNode.insertBefore( startAnchor, node ); 
        const endAnchor = startAnchor.cloneNode( false ); 
        endAnchor.$forEnd = true;
        parentNode.insertBefore( endAnchor, node.nextSibling );
        startAnchor.$items = {};
        if( /^\d+$/.test( value.trim() ) ) {
        } else {
            switch( m[ 4 ] ) {
                case 'in' :
                    descriptor = m[ 5 ];
                    f = interpolation( descriptor );
                    func = f.bind( null, scope );
                    if( !options.once ) {
                        Record.start( startAnchor, startAnchor.$eventMarks, function() {
                            updateForIn( view, f( scope ), func, startAnchor, m[ 1 ], m[ 2 ], m[ 3 ]);
                        } );
                    }
                    const obj = f( scope );
                    Record.reset();
                    if( !obj ) {
                        throw new TypeError( '[ J.ERROR ]' + descriptor + ' is ' + obj );
                    }
                    frag = forIn( view, obj, func, startAnchor, m[ 1 ], m[ 2 ], m[ 3 ]);
                    break;
                case 'of':
                    descriptor = m[ 5 ];
                    const range = descriptor.match( /(.*)\.{3}(.*)/ );
                    if( range ) {
                        const min = interpolation( range[ 1 ] );
                        const max = interpolation( range[ 2 ] );
                        f = ( s ) => {
                            const arr = [];
                            for( let i = min( s ), l = max( s ); i <= l; i += 1 ) {
                                arr.push( i );
                            }
                            return arr;
                        };
                    } else {
                        f = interpolation( descriptor );
                    }
                    func = f.bind( null, scope );

                    if( !options.once ) {
                        Record.start( startAnchor, startAnchor.$eventMarks, function() {
                            updateForOf( view, f( scope ), func, startAnchor, endAnchor, m[ 1 ], m[ 2 ] );
                        } );
                    }
                    const list = f( scope );
                    Record.reset();
                    if( !list ) {
                        throw new TypeError( '[ J.ERROR ]' + descriptor + ' is ' + list );
                    }
                    frag = forOf( view, list, func, startAnchor, m[ 1 ], m[ 2 ] );
                    break;
                default :
                    break;
            }
        }
        replaceNode( frag, node, parentNode, true );
        options.removed = true;
        if( startAnchor.$node.tagName === 'OPTION' ) {
            const select = startAnchor.parentNode;
            select.$$model && select.onchange();
        }
    }
};

var $prevent = {
    compile( directive, node ) {
        const value = directive.value;
        const tag = node.tagName;
        node.removeAttribute( directive.name );

        let events = [];
        if( value.trim() ) {
            events = value.split( ',' );
        } else {
            switch( tag ) {
                case 'A' :
                case 'BUTTON' :
                    events = [ 'click' ];
                    break;
                case 'INPUT' :
                    const inputType = node.type;
                    if( inputType === 'button' || inputType === 'submit' ) {
                        events = [ 'click' ];
                    }
                    break;
                case 'FORM' :
                    events = [ 'submit' ];
                    break;
            }
        }

        for( let i = 0, l = events.length; i < l; i = i + 1 ) {
            const ev = events[ i ];
            if( ev === 'enter' ) {
                node.addEventListener( 'keydown', e => {
                    e.keyCode === 13 && e.preventDefault();
                }, false );
            } else {
                node.addEventListener( ev, e => e.preventDefault(), false );
            }
        }
    }
};

var $stop = {
    compile( directive, node ) {
        const value = directive.value;
        let events = value.trim() ? value.split( ',' ) : [ 'click' ];
        node.removeAttribute( directive.name );
        for( let i = 0, l = events.length; i < l; i = i + 1 ) {
            node.addEventListener( events[ i ], e => e.stopPropagation(), false );
        }
    }
};

const stringify = JSON.stringify;
var $model = {
    bind( directive, node ) {
        node.$$model = true;
    },
    compile( directive, node ) {
        const value = directive.value;
        const scope = node.$scope;
        const $set = /\[[\s\d+]+\]$/.test( value );
        const tagName = node.tagName;
        let composition = false;
        let timer = null;
        let debounce = 50;

        if( node.hasAttribute( 'model-debounce' ) ) {
            debounce = +node.getAttribute( 'model-debounce' );
        }

        if( ( tagName === 'INPUT' ) || tagName === 'TEXTAREA' || node.isContentEditable ) {
            node.addEventListener( 'compositionstart', () => composition = true, false );
            node.addEventListener( 'compositionend', function() {
                composition = false;
                this.oninput();
            }, false );
        }
        node.oninput = node.onchange = node.onpaste = node.oncut = node.onkeyup = function() {
            if( composition ) return;
            timer && clearTimeout( timer );
            timer = setTimeout( () => {
                const bind = interpolation( value )( scope );
                //e && ( this.$$$modelChanged = true );
                let val = this.value;
                if( tagName === 'SELECT' && node.hasAttribute( 'multiple' ) ) {
                    val = [];
                    const options = this.options;
                    for( let i = 0, l = options.length; i < l; i = i + 1 ) {
                        options[ i ].selected && val.push( options[ i ].value );
                    }
                } else if( this.type === 'radio' ) {
                    if( !this.checked ) return;
                    val = this.value;
                } else if( this.type === 'checkbox' ) {
                    if( isArray( bind ) ) {
                        if( this.checked ) {
                            bind.push( this.value );
                        } else {
                            for( let i = 0, l = bind.length; i < l; i = i + 1 ) {
                                if( bind[ i ] === this.value ) {
                                    bind.splice( i );
                                    break;
                                }
                            }
                        }
                        return;
                    } else {
                        val = this.checked;
                    }
                } else if( this.isContentEditable ) {
                    val = this.innerHTML;
                }

                let model = value;

                if( value.indexOf( '#' ) > -1 ) {
                    const filters = value.split( /(?:#)(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g );
                    model = filters.shift();

                    if( filters.length ) {
                        val = wrapFilter( stringify( val ), filters );
                    } else {
                        val = stringify( val );
                    }
                } else {
                    val = stringify( val );
                }

                if( $set ) {
                    const exp = model.replace( /\[([\s\d+]+)\]$/, '.$$set($1,' + val + ')' );
                    new Function( 's', 'var __f=J.View.$filters;with(s)' + exp )( scope );
                } else {
                    new Function( 's', 'var __f=J.View.$filters;with(s)' + model + '=' + val )( scope );
                }
            }, debounce );
        };

        if( !eventSupported( 'input', node ) ) {
            // @todo
            console.log( 'eventSupported' );
        }

        node.removeAttribute( ':model' );
    }
};

var $pre = {
    compile( directive, node ) {
        node.removeAttribute( directive.name );
        node.$options.pre = true;
    }
};

let id$3 = 0;

var $mount = {
    compile( directive, node, view ) {
        const frag = document.createDocumentFragment();
        const value = directive.value;
        const scope = node.$scope;
        let url = node.getAttribute( 'mount-url' );

        if( !url ) return false;

        url = expression$1( url )( scope );

        const model = node.hasAttribute( ':model' ) ? node.getAttribute( ':model' ) : null;
        const attrs = node.attributes; 
        const init = { container : frag };
        const anchor = createAnchor();
        const pkgName = value.trim() ? expression$1( value )( scope ) : '#anonymous-directive-mount' + id$3++;

        let pkg;

        anchor.$relevant = node;

        node.parentNode.insertBefore( anchor, node );

        function onmatch( f, name ) {
            if( !node.$options.once ) {
                Record.start( node, node.$eventMarks[ ':mount' ], function() {
                    pkg && view.$package.$unicast( pkgName, 'paramchange', { 
                        name, 
                        value : new Value( f( scope ), { from : 'paramchange' } )
                    } );
                } );
            }
            init[ name ] = f( scope );
            Record.reset();
        }

        const events = [];

        for( let i = attrs.length - 1; i >= 0; i-- ) {
            const item = attrs[ i ];
            const name = item.name;
            const match = name.match( /^mount-param-(.*)$/ );
            if( match ) {
                if( !item.value ) {
                    init[ match[ 1 ] ] = null;
                    continue;
                }
                const f = expression$1( item.value );
                onmatch( f, match[ 1 ] );
            }
            if( name.charAt( 0 ) === '@' ) {
                events.push( { 
                    name : name.substr( 1 ),
                    handler : item.value
                } );
                node.removeAttribute( name );
            }
        }

        let r;

        view.$resources( new Promise( resolve => { r = resolve; } ) );

        init.beforeinit = function() {
            if( model ) {
                const $set = /\[[\s\d+]+\]$/.test( model );
                const stringify = JSON.stringify;
                this.$on( 'input', ( value, ov, path, special ) => {
                    if( special instanceof Value && special.from === 'paramchange' ) return;
                    if( $set ) {
                        const exp = model.replace( /\[([\s\d+]+)\]$/, '.$$set($1, new Value(' + stringify( value ) + ', { from : "paramchange" } )' );
                        new Function( 'scope', 'with(scope)' + exp )( scope );
                    } else {
                        new Function( 'scope', 'with(scope)' + model + '=new J.Value(' + stringify( value ) + ', { form : "paramchange" } )' )( scope );
                    }
                } );
            }
        };

        view.$mount( pkgName, url, init ).then( p => {
            pkg = p;
            anchor.$package = p;
            p.$ready( () => { 
                /**
                 * the target node might not be still there in the dom tree
                 * cuz that the loading of package is async
                 * so check if node.$options.skip is true and unmount the package
                 */
                if( node.$options.skip ) {
                    view.$package.$unmount( pkgName );
                    return;
                }
                /**
                 * all events was bound to the original node
                 * so can't remove the original node here
                 * @todo 
                 */
                node.parentNode.replaceChild( frag, node );
                //replaceNode( frag, node );
                r();

                const h = ( f, value ) => {
                    const func = f( scope );
                    checks.function( func ) && findMethod( func, view )( value );
                };

                for( let ev of events ) {
                    p.$on( ev.name, h.bind( this, interpolation(
                        ev.handler.replace( 
                            /(^|[^$_\w\d.])package\b(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g,
                            '$1 J.find("' + view.$package.$path().join( '.' ).replace( /(\$)/g, '$$$$' ) + '")'
                        )
                    ) ) );
                }
            } );
        } ).catch( ( e ) => {
            console.error( e );
        } );
    }
};

var $html = {
    compile( directive, node ) {
        const scope = node.$scope;
        const options = node.$options;
        const f = interpolation( directive.value );

        node.removeAttribute( directive.name );

        if( !options.once ) {
            Record.start( node, node.$eventMarks[ ':html' ], function() {
                const content = f( scope );
                if( node.innerHTML === content ) return;
                node.innerHTML = content;
            } );
        }
        node.innerHTML = f( scope );
        Record.reset();
        options.pre = !node.hasAttribute( 'html-parse' );
    }
};

var $text = {
    compile( directive, node ) {
        const scope = node.$scope;
        const options = node.$options;
        const f = interpolation( directive.value );

        node.removeAttribute( directive.name );

        if( !options.once ) {
            Record.start( node, node.$eventMarks[ ':text' ], function() {
                const content = f( scope );
                if( node.textContent === content ) return;
                node.textContent = content;
            } );
        }
        node.textContent = f( scope );
        Record.reset();
    }
};

var $els = {
    compile( directive, node, view ) {
        const value = directive.value;
        node.removeAttribute( directive.name );
        view.$els[ value ] = node;
    }
};

function nodePosition( node ) {
    let y = 0;
    let x = 0;
    while( node ) {
        y += node.offsetTop || 0;
        x += node.offsetLeft || 0;
        node = node.offsetParent;
    }
    return { x, y };
}

function fix( node, l, t ) {
    const style = node.style;
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const { x, y } = nodePosition( node );
    const holder = document.createElement( 'div' );

    holder.style.width = w + 'px';
    holder.style.height = h + 'px';
    style.position = 'fixed';
    style.left = ( l === null ? ( x + 'px' ) : ( l + 'px' ) );
    style.top = ( t === null ? ( y + 'px' ) : ( t + 'px' ) );
    style.width = w + 'px';
    style.height = h + 'px';
    node.$holder = holder;
    
    node.parentNode.insertBefore( holder, node );
}

var $fixed = {
    compile( directive, node ) {
        const value = directive.value;
        const f = interpolation( value );
        const style = node.style;
        const cssText = style.cssText;
        const l = node.getAttribute( 'fixed-left' );
        const t = node.getAttribute( 'fixed-top' );
        node.removeAttribute( 'fixed-left' );
        node.removeAttribute( 'fixed-top' );

        node.removeAttribute( directive.name );

        if( !value ) {
            let startScoll = false;
            let fixed = false;
            let pos = null;
            let width = null;
            let height = null;
            let timer = null;
            window.addEventListener( 'scroll', () => {
                if( !startScoll && !fixed ) {
                    pos = nodePosition( node );
                    width = node.offsetWidth;
                    height = node.offsetHeight;
                    startScoll = true;
                }

                timer && clearTimeout( timer );
                timer = setTimeout( () => {
                    startScoll = false;
                }, 100 );

                const scrollTop = document.body.scrollTop;

                if( pos.y <= scrollTop + ( +t || 0 ) ) {
                    if( fixed ) return;
                    fixed = true;
                    fix( node, +l, +t || 0 );
                } else {
                    if( !fixed ) return;
                    fixed = false;
                    node.$holder && node.parentNode.removeChild( node.$holder );
                    style.cssText = cssText;
                }
            }, { passive : true } );
            return;
        } 

        if( !node.$options.once ) {
            const handler = function() {
                if( f( node.$scope ) ) {
                    fix( node, +l, +t );
                } else {
                    node.$holder && node.parentNode.removeChild( node.$holder );
                    style.cssText = cssText;
                }
            };
            Record.start( node, node.$eventMarks[ ':fixed' ], handler );
            handler();
            Record.reset();
        }
    }
};

var $var = {
    compile( directive, node ) {
        const scope = node.$scope;
        const pos = directive.value.indexOf( '=' );

        let varName, varVal;

        if( pos < 0 ) {
            varName = directive.value;
            varVal = 'undefined';
        } else {
            varName = directive.value.substr( 0, pos ).trim();
            varVal = directive.value.substr( pos + 1 ).trim();
        }

        const f = interpolation( varVal );

        const subscope$$1 = {};
        if( !node.$options.once ) {
            Record.start( node, node.$eventMarks[ ':var' ], function() {
                node.$scope[ varName ] = f( scope );
            } );
        }
        subscope$$1[ varName ] = f( scope );
        Record.reset();
        node.$scope = observer( subscope$$1, uniqueId(), scope );
        node.removeAttribute( directive.name );
    }
};

const emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const urlReg = /^(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;

var Validate = {
    required : ( value ) => isArray( value ) ? value.length : ( value === 0 || !!value ),
    email : email => emailReg.test( email ),
    phone : num => { return /^\d{1,14}$/.test( num ) },
    url : text => urlReg.test( text ),
    numeric : n => !isNaN( parseFloat( n ) ) && isFinite( n ),
    int : n => !isNaN( n ) && parseInt( Number( n ) ) == n && !isNaN( parseInt( n, 10 ) ),
    min : ( value, min ) => value >= min,
    max : ( value, max ) => value <= max,
    minlength : ( value, min ) => value && value.length >= min,
    maxlength : ( value, max ) => !value || value.length <= max,
    neminlength : ( value, min ) => value && ( !value.length || value.length >= min ),
    nemaxlength : ( value, max ) => value && ( !value.length || value.length <= max ),
    pattern : ( value, reg ) => ( checks.regexp( reg ) ? reg : new RegExp( reg ) ).test( value ),
    in : ( value, haystack ) => haystack.indexOf( value ) > -1,
    date( str ) {
        if( !str ) return false;
        const match = str.match( /^(\d+)\-(\d{1,2})\-(\d{1,2})$/ );
        if( !match ) return false;
        const y = +match[ 1 ];
        const m = +match[ 2 ];
        const d = +match[ 3 ];
        if( !( y && m && d ) ) return false;
        if( m > 12 || d > 31 ) return false;
        if( [ 4, 6, 9, 11 ].indexOf( m ) > -1 && d > 30 ) return false;
        if( m === 2 ) {
            if( d > 29 ) return false;
            if( y % 4 && d > 28 ) return false;
        }
        return true;
    }
};

function defaultValue() {
    return {
        $valid : false,
        $checked : false,
        $modified : false,
        $dirty : false,
        $pristine : false,
        $error : false,
        $errors : {}
    };
}

function makeValidator( name, bound, model ) {
    return () => {
        const validation = model.$data.$validation;
        if( !validation ) return true;
        let res = true;
        const val = getDataByPath( model.$data, bound.path );
        for( let keys = getKeys( bound ), i = keys.length - 1; i >= 0; i-- ) {
            const key = keys[ i ];

            if( key.charAt( 0 ) === '_' && key.charAt( 1 ) === '_' ) continue;
            const item = bound[ key ];
            let error;

            if( checks.function( item ) ) {
                error = !item.call( model, val );
            } else if( checks.function( Validate[ key ] ) ) {
                error = !Validate[ key ]( val, bound[ key ] );
            } else { continue }
            error && ( res = false );
            model.$assign( validation[ name ].$errors, {
                [ key ] : error
            } );
        }

        if( bound.hasOwnProperty( 'method' ) ) {
            if( !bound.method.call( model, val ) ) {
                res = false;
                validation[ name ].$errors.method = true;
            }
            validation[ name ].$errors.method = false;
        }

        validation[ name ].$valid = res;

        return !( validation[ name ].$error = !res );
    };
}

const protoMethods = [ 
    '$reload', '$refresh', '$assign',
    '$submit', '$load', '$delete', '$update',
];

function model( data, m ) {

    if( typeof data !== 'object' ) {
        console.warn( '[J WARN ] Model : model data is not an object', data, m );
        return data;
    }
    const methods = {};
    const keys = protoMethods.concat( getKeys( m ) );

    for( let i = 0, l = keys.length; i < l; i += 1 ) {
        const item = m[ keys[ i ] ];
        methods[ keys[ i ] ] = checks.function( item ) ? item.bind( m ) : item;
    }

    for( let i = 0, l = keys.length; i < l; i += 1 ) {
        const key = keys[ i ];
        if( key.charAt( 0 ) !== '$' ) {
            if( m.expose.indexOf( key ) < 0 ) continue;
        }
        if( data.hasOwnProperty( key ) ) continue;
        defineProperty( data, key, {
            value : methods[ key ]
        } );
    }
    return data;
}

class Model extends Extension {
    constructor( options, init ) {
        super( options, assign( init, { $type : 'model' } ) );
        assign( this, options || {} );
        this.__init().then( () => {
            this.$init();
        } );
    }

    __init() {
        this.data || ( this.data = {} );
        this.expose || ( this.expose = [] );

        this.__snapshot = null;
        this.$events = [];
        this.$data = {};

        this.__initial = null;
        this.__boundValidation = false;
        this.__specialProperties = null;
        this.__triedSubmit = false;

        return this.$resources( this.__initData() ).then( () => {
            this.__initial = JSON.stringify( this.$data );
            this.__bindSpecialProperties();
        } );
    }

    $reload( options ) {
        assign( this, options );
        this.__init().then( () => {
            this.$trigger( 'refresh' );
        } );
    }

    $refresh() {
        this.$trigger( 'beforerefresh' );
        this.__initData().then( () => {
            this.__initial = JSON.stringify( this.$data );
            this.__bindSpecialProperties();
            this.$trigger( 'refresh' );
        } );
    }

    __bindSpecialProperties() {
        const properties = {
            $ready : true,
            $loading : false,
            $failed : false,
            $error : false,
            $submitting : false,
            $requesting : false,
            $response : null,
            $validation : defaultValue()
        };

        const makeChangeAfterSubmitHandler = item => {
            return ( ...args ) => {
                if( this.__triedSubmit ) item.__validator( ...args );
            };
        };

        if( this.validations ) {
            const keys = getKeys( this.validations );
            for( let i = 0, l = keys.length; i < l; i += 1 ) {
                const key = keys[ i ];
                const item = this.validations[ key ];
                properties.$validation[ key ] = defaultValue();
                if( !this.__boundValidation ) {
                    item.__validator = makeValidator( key, item, this );
                    item.path || ( item.path = key );
                    switch( item.on ) {
                        case 'change' :
                        case 1 :
                            this.$watch( item.path, item.__validator );
                            break;
                        case 'changeAfterSubmit' :
                        case 2 :
                            this.$watch( item.path, makeChangeAfterSubmitHandler( item ) );
                            break;
                        default :
                            break;
                    }
                }
            }
            this.__boundValidation = true;
        }
        this.$assign( this.$data, properties );
    }

    __initData( data = null ) {
        const promise = Promise.resolve();

        if( data ) {
            this.$data = model( data, this );
            traverse$1( this.$data, this.__id );
            return promise;
        }

        let params;

        if( this.api ) {
            this.url = this.api.url;
            params = this.api.params; 
        }

        if( this.url ) {
            this.url = realPath( this.url );
            return request( this.url, {
                data : params || null,
                storage : this.storage
            } ).then( response => {
                this.$data = model( response, this );
                traverse$1( this.$data, this.__id );
            } ).catch( () => {} );
        } else if( this.data ) {
            if( checks.function( this.data ) ) {
                const p = this.data();
                if( checks.promise( p ) ) {
                    return p.then( response => {
                        this.$data = model( response, this );
                        traverse$1( this.$data, this.__id );
                    } );
                } else {
                    this.$data = model( p || {}, this );
                    traverse$1( this.$data, this.__id );
                }
                return promise;

            } else if( checks.promise( this.data ) ) {
                return this.data.then( response => {
                    this.$data = model( response, this );
                    traverse$1( this.$data, this.__id );
                } );
            } else {
                if( this.__initial ) {
                    this.$reset();
                } else {
                    this.$data = model( this.data, this );
                    traverse$1( this.$data, this.__id );
                }
            }
        }
        return promise;
    }

    $reset() {
        this.$assign( JSON.parse( this.__initial ) );
        this.__bindSpecialProperties();
    }

    $assign( dest, key, value ) {
        if( typeof value === 'undefined' ) {
            if( typeof key === 'undefined' ) {
                return this.__initData( dest ).then( () => {
                    this.__bindSpecialProperties();
                    this.$trigger( 'refresh' );
                } );
            }
            traverse$1( key, null, dest );
            mtrigger( dest );
            return;
        }

        if( dest.hasOwnProperty( key ) ) {
            dest[ key ] = value;
            return;
        }
        this.$assign( dest, { [ key ] : value } );
    }

    $watch( path, handler ) {
        const events = {};
        Record.start( this, events, handler );   
        expression( path )( this.$data ); 
        Record.reset();
        const fullPath = this.__id + '.' + path;

        /**
         * if the property getting by path is not already existed.
         * bind the path directily to make the changes can be watched.
         */
        if( !events[ fullPath ] ) {
            eventcenter.$on( this.__id + '.' + path, handler );
        }
    }

    $unwatch( path, handler ) {
        eventcenter.$off( this.__id + '.' + path, handler );
    }

    $validate( name ) {
        let error = false;

        if( name ) {
            if( !this.validations[ name ] ) return true;
            return this.validations[ name ].__validator.call( this );
        }

        if( this.validations ) {
            const keys = getKeys( this.validations );
            const validation = this.$data.$validation;

            for( let i = 0, l = keys.length; i < l; i += 1 ) {
                const key = keys[ i ];
                const item = this.validations[ key ];
                if( item.__validator.call( this ) === false ) {
                    const vali = validation[ key ];
                    vali.$error = true;
                    vali.$errors[ key ] = true;
                    //this.$validation
                    error = true;
                }
            }
        }

        if( checks.function( this.validate ) ) {
            if( this.validate() === false ) {
                error = true;
            }
        }

        return !( this.$data.$validation.$error = error );
    }

    $submit( ...args ) {
        const data = this.$data;
        this.__triedSubmit = true;
        if( data.$submitting || this.$validate() === false ) return false;
        data.$submitting = data.$requesting = true;
        const res = this.submit( ...args );
        if( checks.function( res.then ) ) {
            res.then( response => {
                data.$error = false;
                data.$response = response;
                data.$submitting = data.$requesting = false;
                this.$signal( 'submit', response );
            } ).catch( e => {
                data.$submitting = data.$requesting = false;
                data.$error = e;
                data.$response = e;
            } );
        } else {
            if( res === false ) {
                data.$submitting = data.$requesting = false;
                data.$error = true;
            } else {
                data.$error = false;
                data.$submitting = data.$requesting = false;
            }
        }
    }
    
    $request( ...args ) {
        const data = this.$data;
        data.$requesting = true;

        return J.request( ...args ).then( response => {
            data.$error = false; 
            data.$response = response;
            data.$requesting = false;
            return response;
        } ).catch( e => {
            data.$requesting = false;
            data.$error = true;
            data.$response = e;
            throw e;
        } );

    }

    $pure( reverse = false, data = null ) {
        const res = {};
        const list = [ '$ready', '$loading', '$loaded', '$failed', '$error', '$submitting', '$requesting', '$validation', '$response' ];

        data || ( data = this.$data );

        if( reverse ) {
            for( let i = 0, l = list.length; i < l; i += 1 ) {
                res[ list[ i ] ] = data[ list[ i ] ];
            }
            return res;
        }

        if( isArray( data ) ) return data;

        for( let i = 0, keys = getKeys( data), l = keys.length; i < l; i += 1 ) {
            const key = keys[ i ];
            if( list.indexOf( key ) < 0 ) {
                res[ key ] = data[ key ];
            }
        }
        return res;
    }
}

Model.extend = properties => {
    assign( Model.prototype, properties );
};

var $data = {
    compile( directive, node, view ) {
        const variable = directive.value || 'data';
        const scope = node.$scope;
        const model = node.getAttribute( 'data-model' );
        const url = node.getAttribute( 'data-url' );
        const pkg = node.getAttribute( 'data-package' );
        //const delay = node.getAttribute( 'data-render-delay' );

        node.removeAttribute( directive.name );
        node.removeAttribute( 'data-url' );
        node.removeAttribute( 'data-model' );
        node.removeAttribute( 'data-package' );

        if( !url && !model && !pkg) return false;

        view.$assign( view, { [ variable ] : null } );

        let params = {};

        const attrs = node.attributes; 

        for( let i = attrs.length - 1; i >= 0; i-- ) {
            const item = attrs[ i ];
            const name = item.name;
            const match = name.match( /^data-param-(.*)$/ );
            if( match ) {
                if( !item.value ) {
                    params[ match[ 1 ] ] = null;
                    continue;
                }
                const f = expression$1( item.value );
                params[ match[ 1 ] ] = f( scope );
            }
        }

        const limited = node.getAttribute( 'data-global' ) === 'false';

        if( limited ) {
            node.$scope = observer( { [ variable ] : null }, uniqueId(), scope );
        }

        if( url ) {
            const req = request( expression$1( url )( scope ), params );
            if( limited ) {
                req.then( response => {
                    node.$scope[ variable ] = response;
                } );
            } else {
                view.$bind( variable, req );
            }
        } else if( pkg ) {
            const name = node.getAttribute( 'data-name' ) || '$__datainview.package$' + uniqueId();
            view.$package.$mount( name, pkg, params ).then( p => {
                const data = p[ node.getAttribute( 'data-expose-method' ) || 'expose' ]();
                if( data instanceof Model ) {
                    node.$scope[ variable ] = data.$data;
                }
            } );
        } else if( model ) {
            if( limited ) {
                const name = '$__modelinview.model$' + uniqueId();
                view.$bind( name, view.$package.$install( name, model, params ) ).then( () => {
                    node.$scope[ variable ] = view[ name ];
                } );
                node.$scope[ variable ] = view[ name ];
            } else {
                const name = node.getAttribute( 'data-name' ) || ( '__modelinview.model$' + uniqueId() );
                view.$bind( variable, view.$package.$install( name, model, params ) );
            }
        }
    }
};

function getTop( node ) {
    let y = 0;
    while( node ) {
        y += node.offsetTop || 0;
        node = node.offsetParent;
    }
    return y;
}

function remove( view, node ) {
    const frag = document.createDocumentFragment();
    while( node.childNodes.length ) {
        frag.appendChild( node.childNodes[ 0 ] );
    }
    node.$lazyFrag = frag;
    //node.$options.skip = true;
}

function show( view, node ) {
    const scope = node.$scope;
    const options = node.$options;
    options.skip = false;
    traverse( slice.call( node.$lazyFrag.childNodes ), view, scope, options );
    node.innerHTML = '';
    node.appendChild( node.$lazyFrag );
}

const handlers = [];

let timeout = null;

const onscroll = () => {
    if( timeout ) return;
    timeout = setTimeout( () => {
        for( let i = 0, l = handlers.length; i < l; i += 1 ) {
            if( handlers[ i ] ) {
                handlers[ i ]( i );
            } else {
                handlers.splice( i--, 1 );
                l--;
            }
        }
        timeout = null;
    }, 30 );
};
window.addEventListener( 'scroll', onscroll, { passive : true } );
window.addEventListener( 'resize', onscroll, { passive : true } );

var $lazy = {
    bind( directive, node ) {
        node.$originalNode || ( node.$originalNode = node.cloneNode( true ) );
        node.$$lazy = true;
    },
    compile( directive, node, view ) {

        const dis = +node.getAttribute( ':lazy' ) || 100;
        node.removeAttribute( ':lazy' );

        let interval = null;

        const handler = () => {
            const y = getTop( node );
            if( y - document.body.scrollTop - window.innerHeight < dis ) {
                show( view, node );
                handlers[ handlers.indexOf( handler ) ] = null;
            }
        };

        handlers.push( handler );
        interval = setInterval( () => {
            if( document.body.contains( node ) ) {
                clearTimeout( interval );
                handler();
            }
        }, 30 );
        remove( view, node );
    }
};

function getForm( node ) {
    while( node && node.nodeName !== 'FORM' ) {
        node = node.parentNode;
    }
    return node;
}

function defaultValue$1() {
    return {
        $valid : false,
        $checked : false,
        $touched : false,
        $modified : false,
        $dirty : false,
        $pristine : false,
        $error : false,
        $errors : {}
    };
}

var $validate = {
    compile( directive, node, view ) {
        const value = directive.value;
        const scope = node.$scope;
        const nodeName = node.nodeName;
        const options = node.$options;

        if( nodeName === 'FORM' ) {
            const subscope$$1 = {};
            const variable = value || '$validation';
            subscope$$1[ variable ] = {};
            node.$scope = observer( subscope$$1, uniqueId(), scope );
            node.$$$validation = node.$scope[ variable ];

            node.addEventListener( 'submit', ( e ) => {
                let res = true;
                traverseNode$1( node, item => {
                    if( item === node ) return;
                    if( item.$$$validateCheck && !item.$$$validateCheck() ) res = false;
                } ); 
                if( node.hasAttribute( 'validate-method' ) ) {
                    const func = interpolation( convertPackage( node.getAttribute( 'validate-method', view.$package ) ) )( scope );
                    if( checks.function( func ) && !findMethod( func, view )() ) {
                        res = false;
                    } else {
                        res = !!func;
                    }
                }
                if( !res ) {
                    e.preventDefault(); 
                    e.stopImmediatePropagation();
                }
            } );
            return;
        }

        if( !value ) {
            throw new TypeError( 'Directive :validate must have a value' );
        }

        const form = getForm( node );
        if( !form ) {
            console.error( '[J ERROR] VIEW:VALIDATE' );
        }
        const validation = form.$$$validation;
        const data = defaultValue$1();
        let oldValue = null;

        const f = expression$1( value );
        const bound = {};
        const attrs = node.attributes;

        for( let i = attrs.length - 1; i >= 0; i-- ) {
            const item = attrs[ i ];
            const name = item.name;
            const match = name.match( /^validate-(.*)$/ );

            if( match && match[ 1 ] !== 'on' ) {
                bound[ match[ 1 ] ] = item.value;
            }
        }

        const trim = /^true|on$/i.test( node.getAttribute( 'validate-trim' ) || 'true' );

        function check() {
            let res = true;
            const val = trim ? node.value.trim() : node.value;
            for( let item in Validate ) {
                if( !bound.hasOwnProperty( item ) ) continue;
                const error = !Validate[ item ]( val, bound[ item ] ? expression$1( bound[ item ] )( scope ) : true );
                error && ( res = false );
                view.$set( data.$errors, item, error );
            }

            if( bound.hasOwnProperty( 'method' ) ) {
                const value = convertPackage( bound.method, view.$package );
                let func = interpolation( value )( scope ); 
                if( checks.function( func ) ) {
                    if( !findMethod( func, view )( val ) ) {
                        res = true;
                    }
                }
                if( !func ) {
                    res = true;
                }
            }
            return !( data.$error = !res );
        }

        function set() {
            Record.start( node, node.$eventMarks[ ':validate' ], function() {
                set();
            } );
            view.$set( validation, f( scope ), data );
            Record.reset();
        }

        options.once ? view.$assign( validation, { [ f( scope ) ] : data } ) : set();

        node.$$$validateCheck = check;

        if( node.hasAttribute( 'validate-on' ) ) {
            const events = node.getAttribute( 'validate-on' ).split( ',' );

            for( let evt of events ) {
                node.addEventListener( evt, check, false );
            }
            node.removeAttribute( 'validate-on' );
        }

        node.addEventListener( 'focus', () => {
            if( data.$touched ) return;
            data.$touched = true;
            oldValue = node.value;
        } );

        node.addEventListener( 'input', () => {
            data.$dirty = true;
            data.$touched = true;
            data.$modified = ( node.value !== oldValue );
        } );

        node.addEventListener( 'change', () => {
            data.$touched = true;
            data.$dirty = true;
            data.$modified = ( node.value !== oldValue );
        } );
    }
};

function getForm$1( node ) {
    while( node && node.nodeName !== 'FORM' ) {
        node = node.parentNode;
    }
    return node;
}

var $submit = {
    compile( directive, node ) {
        const form = getForm$1( node );
        const button = document.createElement( 'input' );
        button.type = 'submit';
        button.setAttribute( 'hidden', true );
        button.setAttribute( 'style', 'display : none !important;' );
        form.appendChild( button );
        node.addEventListener( 'click', ( e ) => {
            e.preventDefault();
            button.click();
        } );
    }
};

var $checked = {
    compile( directive, node ) {
        const value = directive.value;  
        const scope = node.$scope;
        const f = interpolation( value );

        if( !node.$options.once ) {
            const handler = function() {
                node.checked = f( scope );
            };

            Record.start( node, node.$eventMarks[ ':checked' ], handler );
            handler();
            Record.reset();
        }
    }
};

window.addEventListener( 'popstate', e => {
    ec.$trigger( 'popstate', e );
} );

const pushState = ( state, title, url ) => {
    window.history.pushState( state, title, url );
    ec.$trigger( 'popstate', state );
};

var $state = {
    compile( directive, node ) {
        const scope = node.$scope;
        const state = directive.value || null; 
        const url = node.getAttribute( 'state-url' ) || null;
        const title = node.getAttribute( 'state-title' ) || '';

        let fState = state ? expression$1( state ) : () => null;
        let fURL = url ? expression$1( url ) : null;
        let fTitle = title ? expression$1( title ) : () => null;

        node.removeAttribute( directive.name );
        node.removeAttribute( 'state-url' );
        node.removeAttribute( 'state-title' );

        node.addEventListener( 'click', e => {
            const url = fURL ? fURL( scope ) : ( node.href || '' );
            if( !history.pushState ) {
                if( !node.href ) {
                    node.href = url;
                }
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            const state = fState( scope );
            pushState( state, fTitle( scope ), url );
        } );
    }
};

const sp = '!!!!!';

function createTest( rule ) {
    if( rule.indexOf( sp ) < 0 ) {
        return str => new RegExp( escapeReg( rule ) ).test( str );
    }
    return str => {
        const list = rule.split( sp );
        const last = list.pop();
        for( let item of list ) {
            if( new RegExp( escapeReg( item ) ).test( str ) ) {
                return false;
            }
        }
        return last ? new RegExp( escapeReg( last ) ).test( str ) : true;
    };
}

var $router = {
    bind( directive, node ) {
        node.$originalNode || ( node.$originalNode = node.cloneNode( true ) );
        node.$$router = true;
        let next = node.nextElementSibling;
        const stack = [ '!(' + directive.value + ')' ];

        while( next && next.hasAttribute( ':elserouter' ) ) {
            const exp = next.getAttribute( ':elserouter' );
            next.setAttribute( ':router', stack.join( sp ) + sp + exp );
            stack.push( exp );
            next.removeAttribute( ':elserouter' );
            next = next.nextElementSibling;
        }
        if( next && next.hasAttribute( ':routerelse' ) ) {
            next.removeAttribute( ':routerelse' );
            next.setAttribute( ':router', stack.join( sp ) + sp );
        }
    },
    compile( directive, node, view ) {
        const value = directive.value;
        const scope = node.$scope;
        const options = node.$options;
        const test = createTest( value );
        const style = node.style;
        const display = style.display;
        const anchor = createAnchor( '', scope, options );
        const parentNode = node.parentNode;

        options.skip = true;

        anchor.$originalNode = node.$originalNode;
        anchor.$originalNode.removeAttribute( ':router' );
        anchor.$node = null;

        let remove = true;
        if ( anchor.$originalNode.hasAttribute( 'router-remove' ) ) {
            if( checks.false( anchor.$originalNode.getAttribute( 'router-remove' ) ) ) {
                remove = false;
            }
        }

        parentNode.replaceChild( anchor, node );

        const handler = function() {
            const location = window.location;
            if( test( location.pathname + location.search ) ) {
                options.skip = false;
                if( anchor.$node ) {
                    remove || ( anchor.$node.style.display = display );
                } else {
                    const node = anchor.$originalNode.cloneNode( true );
                    traverse( [ node ], view, scope, options );
                    anchor.$node = node;
                    parentNode.insertBefore( node, anchor );
                }
            } else {
                if( remove ) {
                    if( anchor.$node ) {
                        removeNode( anchor.$node, parentNode );
                    }
                    anchor.$node = null;
                    return;
                }
                if( anchor.$node ) {
                    anchor.$node.style.display = 'none';
                }
            }
        };

        ec.$on( 'popstate', handler );

        /**
         * Remove bound event while the node being removed from the dom tree
         */
        anchor.$ec.$on( 'remove', () => {
            ec.$off( 'popstate', handler );
        } );
        handler();
    }
};

var $exec = {
    compile( directive, node ) {
        interpolation( directive.value )( node.$scope );
        node.removeAttribute( directive.name );
    }
};

const priorities = {
    ':skip' : 100,
    ':router' : 200,
    ':once' : 300,
    ':for' : 400,
    ':var' : 500,
    ':lazy' : 600,
    ':if' : 600, //:else
    ':data' : 700,
    ':show' : 800,
    ':mount' : 1000,
    ':prevent' : 1100,
    ':stop' : 1200,
    ':model' : 1300,
    ':pre' : 1400,
    ':html' : 1500,
    ':text' : 1600,
    ':els' : 1700,
    ':fixed' : 1800,
    ':validate' : 1900,
    ':submit' : 2000,
    ':checked' : 2100,
    ':state' : 2200,
    ':exec' : 2300
};

const directives = {
    ':skip' : $skip,
    ':once' : $once,
    ':router' : $router,
    ':for' : $for,
    ':var' : $var,
    ':lazy' : $lazy,
    ':if' : $if, // :else, :elseif
    ':data' : $data,
    ':show' : $show, // :showelse, :elseshow
    ':mount' : $mount,
    ':prevent' : $prevent,
    ':stop' : $stop,
    ':model' : $model,
    ':pre' : $pre,
    ':html' : $html,
    ':text' : $text,
    ':els' : $els,
    ':fixed' : $fixed,
    ':validate' : $validate,
    ':submit' : $submit,
    ':checked' : $checked,
    ':state' : $state,
    ':exec' : $exec
};

const sort = ( arr ) => {
    return arr.sort( ( a, b ) => priorities[ a.name ] > priorities[ b.name ] ? 1 : -1 );
};

const bindDirective = ( directive, node, view ) => {
    if( !directives[ directive.name ] ) {
        console.warn( '[J WARNING] Directive "' + directive.name + '" not exists.');
        return;
    }
    const bind = directives[ directive.name ].bind;
    return bind && bind( directive, node, view );
};

const compileDirective = ( directive, node, view ) => {
    if( !directives[ directive.name ] ) {
        console.warn( '[J WARNING] Directive "' + directive.name + '" not exists.');
        return;
    }
    const compile = directives[ directive.name ].compile;
    return compile && compile( directive, node, view );
};

const events = {
    enter : ( node, func ) => {
        node.addEventListener( 'keydown', e => {
            e.keyCode === 13 && func( e );
        } );
    },
    esc : ( node, func ) => {
        node.addEventListener( 'keydown', e => {
            e.keyCode === 27 && func( e );
        } );
    }
};

const regTag = new RegExp(
    leftDelimiterReg + '((.|\\n)+?)' + rightDelimiterReg
);

function compileTextNode( node ) {
    const f = expression$1( node.data );
    const scope = node.$scope;

    function value() {
        Record.start( node, node.$eventMarks, function() {
            node.data = value();
        } );
        const res = f( scope );
        Record.reset();
        return res;
    }
    if( !node.$options.once ) {
        node.data = value();
    } else {
        node.data = f( scope );
    }
}

function setAttr( node, name, value ) {
    let tag, nodeType;
    switch( name ) {
        case 'value' :
            tag = node.tagName;
            if( tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' ) {
                if( node.value === value ) return;
                node.value = value;
                node.onchange && node.onchange( true );
                /*if( !node.$$$modelChanged ) {
                    node.onchange && node.onchange( true );
                }*/
            } else {
                node.setAttribute( name, value );
            }
            break;
        case 'checked' :
            nodeType = node.type;
            tag = node.tagName;
            if( tag === 'INPUT' && ( nodeType === 'radio' || nodeType === 'checkbox' ) ) {
                node.checked = !!value;
            } else {
                node.setAttribute( name, value );
            }
            break;
        default : 
            node.setAttribute( name, value );
            break;
    }
}

function compileAttribute( node, attr ) {
    const name = attr.name.slice( 1 );
    const f = interpolation( attr.value );
    const scope = node.$scope;

    function value() {
        Record.start( node, node.$eventMarks[ attr.name ], function() {
            setAttr( node, name, value() );
        } );
        const res = f( scope );
        Record.reset();
        return res;
    }
    if( !node.$options.once ) {
        setAttr( node, name, value() );
    } else {
        setAttr( node, name, f( scope ) );
    }
    node.removeAttribute( attr.name );
}

function compileEvent( node, attr, view ) {
    const name = attr.name.slice( 1 );
    let value = attr.value;

    if( view.$package ) {
        value = convertPackage( value, view.$package );
    }

    value = strConvert( value, 'this', '__n' );

    const f = interpolation( value, '__n' );
    const scope = node.$scope;

    const handler = function( e ) {
        const func = f( scope, node );
        checks.function( func ) && findMethod( func, view )( e );
    };

    events[ name ] ? events[ name ]( node, handler ) : node.addEventListener( name, handler );
    node.removeAttribute( attr.name );
}

const compileElementCache = {};

function compileElement( node, view ) {
    let directives, events$$1, attributes, cache;
    const sign = node.$sign;
    if( sign && ( cache = compileElementCache[ sign ] ) ) {
        directives = cache.directives;
        events$$1 = cache.events;
        attributes = cache.attributes;
    } else {
        directives = [];
        events$$1 = [];
        attributes = [];
        const attrs = node.attributes;
        for( let i = attrs.length - 1; i >= 0; i-- ) {
            const item = attrs[ i ];
            const name = item.name;
            switch( name.charAt( 0 ) ) {
                case ':' :
                    directives.push( { name, value : item.value } );
                    break;
                case '@' :
                    events$$1.push( { name, value : item.value } );
                    break;
                case '$' :
                    attributes.push( { name, value : item.value });
                    break;
            }
        }
        sort( directives );
        sign && ( compileElementCache[ sign ] = {
            directives,
            events: events$$1,
            attributes
        } );
    }
    for( let i = 0, l = directives.length; i < l; i = i + 1 ) {
        bindDirective( directives[ i ], node );
    }
    const options = node.$options;
    for( let i = 0, l = directives.length; i < l; i = i + 1 ) {
        node.$eventMarks[ directives[ i ].name ] = {};
        compileDirective( directives[ i ], node, view );
        if( options.skip || options.removed ) {
            return {
                scope : node.$scope,
                options
            };
        }
    }

    if( !options.skip && !options.removed ) {
        for( let i = 0, l = events$$1.length; i < l; i = i + 1 ) {
            compileEvent( node, events$$1[ i ], view );
        }
        for( let i = 0, l = attributes.length; i < l; i = i + 1 ) {
            node.$eventMarks[ attributes[ i ].name ] = {};
            compileAttribute( node, attributes[ i ] );
        }
    }
    return {
        scope : node.$scope,
        options
    };
}

function traverse( nodes, view, scope, options ) {
    for( let i = 0, l = nodes.length; i < l; i = i + 1 ) {
        const node = nodes[ i ];
        let res;
        node.$id || wrapNode( node, scope, options, true );
        const type = node.nodeType;
        if( type === 1 ) {
            res = compileElement( node, view );
            let o;
            if( !res || !( o = res.options ) ) continue;
            if( !o.removed && !o.skip && !o.pre && node.tagName !== 'SCRIPT' ) {
                traverse( slice.call( node.childNodes ), view, res.scope, o );
            }
        } else if( type === 3 ) {
            node.data.trim() && regTag.test( node.data ) && compileTextNode( node );
        }
    }
}

const uppercase =  str => str.toString().toUpperCase();
const lowercase =  str => str.toString().toLowerCase();
const ucfirst = str => str.charAt( 0 ).toUpperCase() + str.slice( 1 );

// Time format rules same as the format rules of date function in PHP 
// @see http://php.net/manual/en/function.date.php
//
const get = ( timestamp ) => {
    const date = new Date( timestamp );
    return function( method, func ) {
        method = date[ 'get' + method ];
        if( !method || !checks.function( method ) ) return false;
        const val = method.call( date );
        return func ? func( val ) : val;
    };
};

const formats = {
    // ------- Day
    // A textual representation of a day, 3 characters
    // eg. Mon through Sun
    // support language settings. default language is (en)
    D : [ 'Day', day => {
        return [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ][ day ];
    } ],
    // Day of the month, 2 digits with leading zeros.
    // eg. 08, 09, 11
    d : [ 'Date', date => {
        return date < 10 ? ( '0' + date ) : date;
    } ],
    // Day of the month without leading zeros
    // eg. 8, 9, 11
    j : [ 'Date' ],
    // A full textual representation of the day of the week, Sunday through Saturday.
    // eg. Monday, Sunday
    l : [ 'Day', day => {
        return [ 
            'Sunday', 'Monday', 'Tuesday', 
            'Wednesday', 'Thursday', 'Friday', 'Saturday' 
        ][ day ];
    } ],
    // ISO-8601 numeric representation of the day of the week, 1 through 7
    // 1 for Monday and 7 for Sunday
    // different from "w"
    N : [ 'Day', day => ( day + 1 ) ],
    // Numeric representation of the day of the week. 0 through 6.
    // 0 for Sunday and 6 for Saturday
    // different from "N"
    w : [ 'Day' ],

    // ------------- Month
    // A full textual representation of a Month, such as January or March
    // January through December
    F : [ 'Month', month => {
        return [
            'January', 'February', 'March', 'April',
            'May', 'June', 'July', 'August',
            'September', 'October', 'November', 'December'
        ][ month ];
    } ],
    // A short textual representation of the month, three letters
    // Jan through Dec
    M : [ 'Month', month => {
        return [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ][ month ];
    } ],
    // Numeric representation of the month, with leading zeros.
    // 01 through 12
    m : [ 'Month', month => {
        return month < 9 ? '0' + ( month + 1 ) : ( month + 1 );
    } ],
    // Numeric representation of the month, without leading zeros.
    // 1 through 12
    n : [ 'Month', month => ( month + 1 ) ],

    // -------------- Year
    // A full numeric representation of a year, 4 digits.
    // eg. 1988, 1990
    Y : [ 'FullYear' ],
    // A two digit representation of a year
    // eg. 88, 90
    y : [ 'Year' ],

    // --------------- Time
    // Lowercase Ante Meridiem and Post Meridiem
    // eg. am or pm
    a : [ 'Hours', hour => hour < 12 ? 'am' : 'pm' ],
    // Uppercase Ante Meridiem and Post Meridiem
    // eg. AM or PM
    A : [ 'Hours', hour => hour < 12 ? 'AM' : 'PM' ],
    // 12-hour format of an hour without leading zeros.
    g : [ 'Hours', hour => hour > 12 ? hour % 12 : hour ],
    // 24-hour format of an hour without leading zeros.
    G : [ 'Hours' ],
    // 12-hour format of an hour with leading zeros.
    h : [ 'Hours', hour => {
        hour > 12 && ( hour = hour % 12 );
        return hour < 10 ? '0' + hour : hour;
    } ],
    // 24-hour format of an hour with leading zeros.
    H : [ 'Hours', hour => hour < 10 ? '0' + hour : hour ],
    // Minutes with leading zeros.
    // 00 to 59
    i : [ 'Minutes', minute => minute < 10 ? '0' + minute : minute ],
    // Seconds with leading zeros.
    // 00 to 59
    s : [ 'Seconds', second => second < 10 ? '0' + second : second ],
    // Millseconds
    // eg. 123
    v : [ 'Milliseconds' ]
};

function time( timestamp, format = 'Y-m-d' ) {
    if( !timestamp ) return null;
    if( timestamp instanceof Date || typeof timestamp === 'number' || /^\d+$/.test( timestamp ) ) {
        const g = get( timestamp );
        return format.replace( /\w/g, m  => {
            if( formats[ m ] ) {
                return g.apply( null, formats[ m ] );
            }
            return m;
        } );
    }
    return +new Date( timestamp );
}

const divide = ( n, divisor, f = 2 ) => ( n / divisor ).toFixed( f );
const multiply = ( n, multiplier ) => n * multiplier;
const add = ( n, addend ) => n + addend;
const minus = ( n, subtractor ) => n - subtractor;
const numberFormat = ( n, f = 2 ) => n.toFixed( f );

const split = ( str, delimiter ) => str.split( delimiter );
const trim = str => str.trim();
const cut = ( str, len, ext = '...' ) => str.substr( 0, len ) + ext;

const escape = str => encodeHTML( str );
const highlight = ( str, query, classname = '', escape = true ) => {
    if( escape ) str = encodeHTML( str );
    if( !query || !query.length ) return str;
    const reg = new RegExp( '(' + query.join( '|' ) + ')', 'ig' );
    return str.replace( reg, '<em class="' + ( classname || '' ) + '">$1</em>' );
};



var filters = Object.freeze({
	uppercase: uppercase,
	lowercase: lowercase,
	ucfirst: ucfirst,
	time: time,
	divide: divide,
	multiply: multiply,
	add: add,
	minus: minus,
	numberFormat: numberFormat,
	split: split,
	trim: trim,
	cut: cut,
	escape: escape,
	highlight: highlight
});

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


class URL {
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

window.xxxx = eventcenter;

const scope = { $location : {} };

function bindLocation() {
    const attrs = [
        'href', 'origin',
        'host', 'hash', 'hostname',  'pathname', 'port', 'protocol', 'search',
        'username', 'password', 'searchParams'
    ];
    const $location = {};
    const url = new URL( location.href );

    for( const attr of attrs ) {
        $location[ attr ] = url[ attr ] || '';
    }
    assign( scope.$location, $location );
}

bindLocation();

ec.$on( 'popstate', () => bindLocation() );
window.addEventListener( 'hashchange', () => bindLocation() );

class View extends Extension {
    constructor( options, init ) {
        super( options, assign( init, { $type : 'view' } ) );
        assign( this, options );

        if( !this.url && !this.template ) {
            throw new TypeError( 'Empty template url and template text' );
        }

        this.scope = assign( this.scope || {}, scope || {} );
        this.$els = {};
        this.$filters = {};

        this.$resources( 
            Promise.all( [
                this.__loadTpl(),
                this.__loadFilters()
            ] ).then( () => {
                this.__initScope = this.scope;
                this.scope = observer( this.scope, this.__id );
                this.__loadModels();
                copyDescripter( this, this.scope, getKeys( this.scope ) );
                const frag = html2Node( this.template );
                traverse( slice.call( frag.childNodes ), this, this );
                if( this.container ) {
                    this.$el = this.container;
                    this.$el.appendChild( frag );
                } else { this.$el = frag; }
                return Promise.resolve();
            } ) 
        ).then( () => { this.$init(); } );

        this.$package.$on( 'destruct', () => {
            this.$destruct();
        } );
    }

    __loadTpl() {
        return !this.url ? Promise.resolve() : new Promise( resolve => {
            const c = view.storage;
            this.url = realPath( this.url );
            request( this.url, {
                type : 'text',
                storage : {
                    level : c.level,
                    lifetime : c.lifetime,
                    priority : c.priority,
                    style : 'html'
                }
            } ).then( resposne => {
                this.template = resposne.text();
                resolve();
            } );
        } );
    }

    __loadModels() {
        if( !this.models ) return Promise.resolve();
        const promises = [];
        for( let name in this.models ) {
            promises.push( this.$bind( name, this.models[ name ] ) );
        }
        return Promise.all( promises );
    }

    $bind( name, model ) {
        this.$set( this, name, model.$data || null );
        if( model instanceof Model ) {
            model.$on( 'refresh', () => this.$set( this, name,  model.$data ) );
            return Promise.all( [ model.$ready(), this.$ready() ] ).then( () => {
                this.$set( this, name, model.$data );
            } );
        } else if( checks.promise( model ) ) {
            if( model.installation )  {
                return Promise.all( [ model, this.$ready() ] ).then( args => {
                    const m = args[ 0 ];
                    m.$ready( () => { this.$set( this, name, m.$data ); } );
                    m.$on( 'refresh', () => this.$set( this, name, m.$data ) );
                    return m.$ready();
                } );
            } else {
                return model.then( m => {
                    if( m instanceof Model ) {
                        m.$ready( () => { this.$set( this, name, m.$data ); } );
                        m.$on( 'refresh', () => this.$set( this, name, m.$data ) );
                        return m.$ready();
                    } else if( m instanceof J$1 ) {
                        return this.$bind( name, m.expose() );
                    } else {
                        return this.$set( this, name, m );
                    }
                } );
            }
        } else {
            this.$set( this, name, model );
            return Promise.resolve();
        }
    }

    __loadFilters() {
        const filters = this.filters;
        if( !filters ) return Promise.resolve();

        const promises = [];

        for( const name in filters ) {
            promises.push( this.$filter( name, filters[ name ] ) );
        }

        return Promise.all( promises );
    }

    $set( dest, key, value ) {
        if( dest.hasOwnProperty( key ) ) {
            dest[ key ] = value;
            return;
        }
        this.$assign( dest, { [ key ] : value } );
    }

    $assign( dest, src ) {
        if( typeof src === 'undefined' ) {
            src = dest;
            dest = this.scope;
        }
        dest === this && ( dest = this.scope );
        traverse$1( src, null, dest );

        if( dest === this.scope ) {
            copyDescripter( this, this.scope, getKeys( src ) );
        }
        mtrigger( dest );
    }

    $watch( path, handler ) {
        eventcenter.$on( this.__id + '.' + path, handler );
    }

    $unwatch( path, handler ) {
        eventcenter.$off( this.__id + '.' + path, handler );
    }

    $filter( name, func ) {
        if( checks.promise( func ) ) {
            return func.then( data => {
                if( !data ) return;
                if( data instanceof J$1 ) {
                    this.$filters[ name ] = checks.function( data.expose ) ? data.expose() : data;
                } else {
                    this.$filters[ name ] = data;
                }
            } );
        }
        if( checks.string( func ) ) {
            return this.$filter( name, this.$mount( func ) );
        }
        this.$filters[ name ] = func;
        return Promise.resolve( func );
    }

    $destruct() {
        eventcenter.$removeListeners( name => name.indexOf( this.__id + '.' ) > -1 );
        this.$trigger( 'destruct' );
    }
}

View.$filters = assign( {}, filters );

View.filter = function( name, func ) {
    View.$filters[ name ] = func;
};

View.extend = properties => {
    assign( View.properties, properties );
};

var expect$9 = chai.expect;

window.J || ( window.J = J$1 );
window.J.Package || ( window.J.Package = Package );
window.J.View || ( window.J.View = View );
window.J.extend || ( window.J.extend = extend );


var j = window.j1 = new J$1( 'j' );
var main;

var p1 = Promise.all( [
    j.$mount(
        'main', 
        '/ns/jolin/test/extra/packages/main/main.js'
    ),

    j.$mount( 
        'main2',
        '/ns/jolin/test/extra/packages/main/main.js'
    )
] ).then( function() {
    main = j.$find( 'main' );
    return Promise.all( [
        main.$mount(
            'sub',
            '/ns/jolin/test/extra/packages/sub/sub.js'
        ),
        main.$mount(
            'sub2',
            '/ns/jolin/test/extra/packages/sub/sub.js'
        )
    ] );
} );

describe( 'Package', function() {
    describe( 'mount', function() {

        it( 'Shoulda added a child into $children property', function( done ) {
            p1.then( function() {
                expect$9( j.$children ).to.have.property( 'main' );
                expect$9( j.$children ).to.have.property( 'main2' );
                done();
            } );
        } );

        it( 'Shouldna been the same object if added a package twice with different name', function( done ) {
            p1.then( function() {
                expect$9( j.$children.main ).to.not.equal( j.$children.main2 );
                done();
            } );
        } );

        it( 'Shoulda been executed initialize method in package automaticly', function( done ) {
            p1.then( function() {
                expect$9( j.$children.main.haveBeenMounted ).to.be.ok;
                expect$9( j.$children.main2.haveBeenMounted ).to.be.ok;
                done();
            } );
        } );

        it( 'Shoulda had a $parent property pointed to correct object', function( done ) {
            p1.then( function() {
                expect$9( j.$children.main.$parent ).to.equal( j );
                done();
            } );
        } );

        it( 'Shoulda had a $root property pointed to correct object', function( done ) {
            p1.then( function() {
                expect$9( j.$children.main.$root ).to.equal( j );
                done();
            } );
        } );

        it( 'Shoulda been enabled to find package with $find method', function( done ) {
            p1.then( function() {
                expect$9( j.$find( 'main' ) ).to.equal( j.$children.main );
                done();
            } );
        } );

        it( 'Shoulda been enabled to find package from root', function( done ) {
            p1.then( function() {
                expect$9( J$1.find( 'j.main' ) ).to.equal( j.$find( 'main' ) );
                expect$9( J$1.find( 'j.main2' ) ).to.equal( j.$find( 'main2' ) );
                done();
            } );
        } );

        it( 'Package can find sibling package with $find method', function( done ) {
            p1.then( function() {
                expect$9( J$1.find( 'j.main' ).$sibling( 'main2' ) ).to.equal( J$1.find( 'j.main2' ) );
                done();
            } );
        } );
    } );


    describe( 'nested mount', function() {
        it( 'Shoulda added a child into $children property', function( done ) {
            p1.then( function() {
                expect$9( main.$children ).to.have.property( 'sub' );
                expect$9( main.$children ).to.have.property( 'sub2' );
                done();
            } );
        } );

        it( 'Shouldna been the same object if added a package twice with different name', function( done ) {
            p1.then( function() {
                expect$9( main.$children.sub ).to.not.equal( main.$children.sub2 );
                done();
            } );
        } );

        it( 'Shoulda been executed initialize method in package automaticly', function( done ) {
            p1.then( function() {
                expect$9( main.$children.sub.haveBeenMounted ).to.be.ok;
                expect$9( main.$children.sub2.haveBeenMounted ).to.be.ok;
                done();
            } );
        } );

        it( 'Shoulda had a $parent property pointed to correct object', function( done ) {
            p1.then( function() {
                expect$9( main.$children.sub.$parent ).to.equal( main );
                done();
            } );
        } );

        it( 'Shoulda had a $root property pointed to correct object', function( done ) {
            p1.then( function() {
                expect$9( main.$children.sub.$root ).to.equal( j );
                done();
            } );
        } );

        it( 'Shoulda been enabled to find package with $find method', function( done ) {
            p1.then( function() {
                expect$9( main.$find( 'sub' ) ).to.equal( main.$children.sub );
                done();
            } );
        } );

        it( 'Shoulda been enabled to find package from root', function( done ) {
            p1.then( function() {
                expect$9( J$1.find( 'j.main.sub' ) ).to.equal( main.$find( 'sub' ) );
                expect$9( J$1.find( 'j.main.sub2' ) ).to.equal( main.$find( 'sub2' ) );
                done();
            } );
        } );

        it( 'Package can find sibling package with $find method', function( done ) {
            p1.then( function() {
                expect$9( main.$find( 'sub' ).$sibling( 'sub2' ) ).to.equal( main.$find( 'sub2' ) );
                done();
            } );
        } );
    } );

    describe( 'unmount', function() {
        it( 'Shoulda remove package from $children ', function( done ) {
            p1.then( function() {
                j.$unmount( 'main2' );
                expect$9( j.$children.main2 ).to.be.not.ok;
                done();
            } );
        } );
    } );
} );

var expect$10 = chai.expect;

window.J || ( window.J = J$1 );
window.J.Package || ( window.J.Package = Package );
window.J.Router || ( window.J.Router = Rule );

var j$1 = window.j2 = new J$1( 'MSG-TESTING' );
var main$1;

var promise = Promise.all( [
    j$1.$mount(
        'main', 
        '/ns/jolin/test/extra/packages/main/main.js'
    ),

    j$1.$mount( 
        'main2',
        '/ns/jolin/test/extra/packages/main/main.js'
    )
] ).then( function() {
    main$1 = j$1.$find( 'main' );
    return Promise.all( [
        main$1.$mount(
            'sub',
            '/ns/jolin/test/extra/packages/sub/sub.js'
        ),
        main$1.$mount(
            'sub2',
            '/ns/jolin/test/extra/packages/sub/sub.js'
        )
    ] );
} );

describe( 'Message', function() {
    describe( 'message', function() {
        it( 'Shoulda sent message successfully and gotten reply data ', function( done ) {
            promise.then( function() {
                var main = j$1.$find( 'main' );
                var main2 = j$1.$find( 'main2' );
                main.$message( main2, 'get', {} ).then( function( data ) {
                    expect$10( data ).to.equal( 'data' );
                    done();
                } );
            } );
        } );

        it( 'With rules', function( done ) {
            promise.then( function() {
                var main = j$1.$find( 'main' );
                var main2 = j$1.$find( 'main2' );
                main.$message( main2, 'msg', 'body' ).then( function( data ) {
                    expect$10( data ).to.equal( 'body' );
                    done();
                } );
            } );
        } );
    } );

    describe( 'unicast', function() {
    } );

    describe( 'broadcast', function() {
    } );

    describe( 'multicast', function() {
    } );

} );

var expect$11 = chai.expect;
var bowl = '__ob__';

function genData(n) {
    var ret = [];
	var sexMap = {
		'true': "男",
		'false': "女"
	};
    for( var i = 0; i < n; i++ ) {
        ret.push({
            name: Math.random(),
            age: 3 + Math.ceil((Math.random() * 30)),
            sex: sexMap[1 - Math.random() > 0.5],
            desc: Math.random()
        });
    }
    return ret;
}
window.genData = genData;
window.View = View;

describe( 'Extensions/View', function() {
    var view = window.view = new View( {
        template : '<div></div>',
        scope : {
            text : 'str',
            props : { p1 : 'a', p2 : 'b' },
            list : [ 'a', 'b', 'c' ],
            x : { y : { z : 'z' } },
            attrs : [ { first : 1 }, { last : 2 } ],
            nest : { list : [ { obj : { } } ] }
        }
    } );

    it( 'Should have property __mediator instance of EventCenter', function() {
        expect$11( view ).and.an.instanceOf( EventCenter );
    } );

    it( 'Should triggered event with event name same as data path after data be changed', function( done ) {
        view.$watch( 'props.p1', function( newVal, oldVal ) {
            expect$11( newVal ).to.equal( 'new' );
            expect$11( oldVal ).to.equal( 'a' );
            done();
        } );

        view.scope.props.p1 = 'new';
    } );

    it( 'Should triggered event after additional data be changed', function( done ) {

        view.$watch( 'x.y.z.additional', function( newVal, oldVal ) {
            expect$11( newVal ).to.equal( false );
            expect$11( oldVal ).to.equal( true );
            done();
        } );

        view.scope.x.y.z = {
            additional : true
        };

        view.scope.x.y.z.additional = false;
    } );

    it( 'Should have correct path after transdata', function() {
        expect$11( view.scope[ bowl ].text ).to.equal( view.__id + '.text' );
        expect$11( view.scope.nest[ bowl ].list ).to.equal( view.__id + '.nest.list' );

        view.scope.text = { 
            prefix : '--',
            content : 't'
        };

        expect$11( view.scope.text[ bowl ].prefix ).to.equal( view.__id + '.text.prefix' );
    } );
} );


describe( 'Extensions/View/Compile', function() {
    describe( 'Normal Template', function() {

        var view = window.xview = new View( {
            template : 'true1<div>true2</div>true3<span>{{data.name}}</span>',
            scope : {
                data : {
                    name : 'J'
                }
            }
        } );

        it( 'Should compile correct', function() {
            expect$11( view.$el.firstChild.nodeType ).to.equal( 3 );
            expect$11( view.$el.firstChild.data ).to.equal( 'true1' );
            expect$11( view.$el.childNodes[ 1 ].innerHTML ).to.equal( 'true2' );
            expect$11( view.$el.childNodes[ 2 ].data ).to.equal( 'true3' );
        } );
    } );

    describe( 'Complied Template', function() {

        var view2 = window.view2 = new View( {
            template : [
                '<div $data-x="\'-\' + x + \'-\'" $data-y="\'-\' + y +\'-\'" $data-mix="\'-\' + x + \'-\' + y + \'-\'">a{{x + y}}ccc</div>',
                '<div>{{z.length}}dddd{{n + 10}}e{{attr.name}}</div>'
            ].join( '' ),
            scope : {
                x : '_x_',
                y : '_y_',
                z : '123',
                n : 1,
                m : '_m_',
                text : 'str',
                attr : { name : 'L' },
                list : [ 'a', 'b', 'c' ],
                attrs : [ { first : 1 }, { last : 2 } ]
            }
        } );

        it( 'Should triggered event after modify array with function', function( done ) {
            view2.$watch( 'list', function( newVal ) {
                expect$11( newVal[ newVal.length - 1 ] ).to.equal( 'd' );
                done();
            } );

            view2.scope.list.push( 'd' );
        } );

        it( 'Should have $set method if data is of array', function( done ) {
            expect$11( view2.scope.list ).be.have.property( '$set' ).to.be.a( 'function' );
            done();
        } );

        it( 'Should parse text nodes correct', function( done ) {
            expect$11( view2.$el.firstChild.innerHTML ).to.equal( 'a_x__y_ccc' );
            expect$11( view2.$el.lastChild.innerHTML ).to.equal( '3dddd11eL' );
            done();
        } );

        it( 'Should parse node attributes correct', function( done ) {
            expect$11( view2.$el.firstChild.getAttribute( 'data-x' ) ).to.equal( '-_x_-' );
            expect$11( view2.$el.firstChild.getAttribute( 'data-mix' ) ).to.equal( '-_x_-_y_-' );
            done();
        } );

        it( 'Should modify corresponding text node after scope changed', function( done ) {
            view2.scope.x = '_X_';
            view2.scope.z = '12345';
            expect$11( view2.$el.firstChild.innerHTML ).to.equal( 'a_X__y_ccc' );
            expect$11( view2.$el.lastChild.innerHTML ).to.equal( '5dddd11eL' );
            done();
        } );

        it( 'Should modify normal attributes of corresponding node', function( done ) {
            expect$11( view2.$el.firstChild.getAttribute( 'data-x' ) ).to.equal( '-_X_-' );
            expect$11( view2.$el.firstChild.getAttribute( 'data-mix' ) ).to.equal( '-_X_-_y_-' );
            done();
        } );

        it( 'Should assign new data into scope with "view.$assign" method', function( done ) {
            view2.$assign( {
                assign1 : '123'
            } );
            expect$11( view2.scope.assign1 ).to.equal( '123' );
            view2.$assign( view2.scope, {
                assign2 : 123
            } );
            expect$11( view2.scope.assign2 ).to.equal( 123 );

            view2.$assign( view2.scope.attrs, {
                assign : 124
            } );

            expect$11( view2.scope.attrs.assign ).to.equal( 124 );
            done();
        } );

        it( 'Should also have correct path even if properties was added by "assgin" method', function( done ) {
            expect$11( view2.scope[ bowl ].assign2 ).to.equal( view2.__id + '.assign2' );
            expect$11( view2.scope.attrs[ bowl ].assign ).to.equal( view2.__id + '.attrs.assign' );
            done();
        } );

        it( 'Should also have been converted even if properties was asddes by "assign" method', function( done ) {
            var descriptor = Object.getOwnPropertyDescriptor( view2.scope.attrs, 'assign' );
            expect$11( descriptor && descriptor.set ).to.be.ok;
            done();
        } );
    } );
} );

describe( 'Extensions/View/Directives', function() {

    var view3 = window.view3 = new View( {
        template : [
            '<div :skip data-x="-{{x}}-" data-mix="\'-\' + x + \'-\'">',
                'a{{x + y}}ccc',
            '</div>',
            '<div $data-m="\'-\' + m + \'-\'">dddd{{n + 10}}e{{attr.name}}</div>'
        ].join( '' ),
        scope : {
            x : '_x_',
            y : '_y_',
            z : '123',
            n : 1,
            m : '_m_',
            text : 'str',
            attr : { name : 'L' },
            list : [ 'a', 'b', 'c' ],
            attrs : [ { first : 1 }, { last : 2 } ]
        }
    } );

    describe( ':skip', function() {
        it( 'Should skip parse all attributes if node has ":skip" directive', function( done ) {
            expect$11( view3.$el.firstChild.getAttribute( 'data-x' ) ).to.equal( '-{{x}}-' );
            expect$11( view3.$el.firstChild.innerHTML ).to.equal( 'a{{x + y}}ccc' );
            done();
        } );
        it( 'Should not affect other nodes', function( done ) {
            expect$11( view3.$el.lastChild.getAttribute( 'data-m' ) ).to.equal( '-_m_-' );
            expect$11( view3.$el.lastChild.innerHTML ).to.equal( 'dddd11eL' );
            done();
        } );
        it( 'Should removed the ":skip" attribute from node', function( done ) {
            expect$11( view3.$el.firstChild.hasAttribute( ':skip' ) ).to.be.not.ok;
            done();
        } );
    } );

    var view4 = window.view4 = new View( {
        template : [
            '<div :pre $data-x="\'-\' + x + \'-\'" $data-mix="\'-\' + x + \'-\'">',
                'a{{x + y}}ccc',
            '</div>',
            '<div $data-m="\'-\' + m + \'-\'">dddd{{n + 10}}e{{attr.name}}</div>'
        ].join( '' ),
        scope : {
            x : '_x_',
            y : '_y_',
            z : '123',
            n : 1,
            m : '_m_',
            text : 'str',
            attr : { name : 'L' },
            list : [ 'a', 'b', 'c' ],
            attrs : [ { first : 1 }, { last : 2 } ]
        }
    } );

    describe( ':pre', function() {
        it( 'Should not parse childnodes', function( done ) {
            expect$11( view4.$el.firstChild.innerHTML ).to.equal( 'a{{x + y}}ccc' );
            done();
        } );

        it( 'Should still parse attributes', function( done ) {
            expect$11( view4.$el.firstChild.getAttribute( 'data-x' ) ).to.equal( '-_x_-' );
            done();
        } );

        it( 'Should not affect other nodes', function( done ) {
            expect$11( view3.$el.lastChild.getAttribute( 'data-m' ) ).to.equal( '-_m_-' );
            expect$11( view3.$el.lastChild.innerHTML ).to.equal( 'dddd11eL' );
            done();
        } );

        it( 'Should removed the ":pre" attribute from node', function( done ) {
            expect$11( view3.$el.firstChild.hasAttribute( ':pre' ) ).to.be.not.ok;
            done();
        } );
    } );

    var view = window.view5 = new View( {
        template : [
            '<div :if="true">true</div>',
            '<div :if="display">display</div>',
            '<div :if="false">false</div>',
            '<div :if="show">!show</div>',
            '<div :if="outer"><div :if="inner">inner</div></div>',
            '<div :else>in else</div>'
        ].join( '' ),
        scope : {
            display : true,
            show : false,
            outer : true,
            inner : true
        }
    } );

    describe( ':if & :else', function() {
        it( ':if with condition "true"', function( done ) {
            expect$11( view.$el.firstChild.innerHTML ).to.equal( 'true' );
            expect$11( view.$el.childNodes[ 1 ].innerHTML ).to.equal( 'display' );
            done();
        } );

        it( ':if with condition "false"', function() {
            expect$11( view.$el.childNodes[ 2 ].nodeType ).to.equal( 3 );
            expect$11( view.$el.childNodes[ 3 ].nodeType ).to.equal( 3 );
        } );

        it( 'Should re-render after scope data has been changed', function() {
            view.scope.display = false;
            expect$11( view.$el.childNodes[ 1 ].nodeType ).to.equal( 3 );

            view.scope.display = true;
            expect$11( view.$el.childNodes[ 1 ].innerHTML ).to.equal( 'display' );
            
            view.scope.show = true;
            expect$11( view.$el.childNodes[ 3 ].innerHTML ).to.equal( '!show' );

            view.scope.show = false;
            expect$11( view.$el.childNodes[ 3 ].nodeType ).to.equal( 3 );

            view.scope.show = true;
            expect$11( view.$el.childNodes[ 3 ].innerHTML ).to.equal( '!show' );

        } );

        it( 'Should compile nested ":if" directive correct', function() {
            expect$11( view.$el.childNodes[ 4 ] ).to.be.ok;
            expect$11( view.$el.childNodes[ 4 ].childNodes[ 0 ].innerHTML ).to.equal( 'inner' );
            view.scope.inner = false;
            expect$11( view.$el.childNodes[ 4 ].childNodes[ 0 ].nodeType ).to.equal( 3 );
        } );

        it( ':else', function() {
            expect$11( view.$el.childNodes[ 5 ].$isAnchor ).to.be.ok;
            view.scope.outer = false;
            expect$11( view.$el.childNodes[ 5 ].innerHTML ).to.equal( 'in else');
            view.scope.outer = true;
            expect$11( view.$el.childNodes[ 5 ].$isAnchor ).to.be.ok;
        } );
    } );

    describe( ':show', function() {
        var view = window.viewShow = new View( {
            template : [
                '<div :show="show">show</div>',
                '<div :else>not show</div>'
            ].join( '' ),
            scope : {
                show : true
            }
        } );

        it( 'Should has been shown with "show" is true', function() {
            expect$11( view.$el.firstChild.style.display ).to.not.equal( 'none' );
            expect$11( view.$el.childNodes[ 1 ].style.display ).to.equal( 'none' );
            view.scope.show = false;

            expect$11( view.$el.firstChild.style.display ).to.equal( 'none' );
            expect$11( view.$el.childNodes[ 1 ].style.display ).to.not.equal( 'none' );
        } );

    } );

    describe( ':once', function() {
        var view6 = window.view6 = new View( {
            template : [
                '<div :once :if="show">{{ text }}</div>'
            ].join( '' ),
            scope : {
                show : true,
                text : 'name'
            }
        } );

        it( 'Should be compiled correct', function() {
            expect$11( view6.$el.firstChild.innerHTML ).to.equal( 'name' );
        } );

        it( 'Should not be re-compiled', function() {
            view6.scope.text = 'new';
            expect$11( view6.$el.firstChild.innerHTML ).to.equal( 'name' );
        } );
    } );

    describe( ':for', function() {

        describe( ':for...in', function() {
            var view7 = window.view7 = new View( {
                template : [
                    '<ul>',
                        '<li :for="item, value, index in data" $data-item="item" class="li-1">',
                            '<span>{{index}}.{{item}} : {{value.en}}</span>',
                            '<ul class="l2">',
                                '<li :for="x,y,i in value.sub" $data-item="x" $data-value="y" class="li-2">{{i}}.{{x}} : {{y}}</li>',
                            '</ul>',
                        '</li>',
                    '</ul>'
                ].join( '' ),
                scope : {
                    data : {
                        name : { en : 'J', sub : { sub : 'ssssub' } },
                        version : { en : '0.0.1', sub : { sub : 'ssssub2' } }
                    },
                }
            } );

            it( 'Shoule be compiled correct', function() {
                expect$11( view7.$el.querySelectorAll( '.li-1' ).length ).to.equal( 2 );
                expect$11( view7.$el.querySelectorAll( '.li-2' ).length ).to.equal( 2 );
            } );

            it( 'Should compiled attribute correct', function() {
                expect$11( view7.$el.querySelector( '.li-1' ).getAttribute( 'data-item' ) ).to.equal( 'name' );
                expect$11( view7.$el.querySelector( '.li-1 span' ).innerHTML ).to.equal( '0.name : J' );
            } );

            it( 'Should have been re-compiled after value is changed', function() {
                view7.scope.data.name.sub.sub = '123';
                expect$11( view7.$el.querySelector( '.li-2' ).getAttribute( 'data-value' ) ).to.equal( '123' );
                expect$11( view7.$el.querySelector( '.li-2' ).innerHTML ).to.equal( '0.sub : 123' );
            } );

            it( 'Should have been re-compiled after change data to another object', function() {
                view7.scope.data = { sex : { en : 'Male', sub : {sub : 'new sub' } } };
                expect$11( view7.$el.querySelectorAll( '.li-1' ).length ).to.equal( 1 );
                expect$11( view7.$el.querySelector( '.li-1' ).getAttribute( 'data-item' ) ).to.equal( 'sex' );
                expect$11( view7.$el.querySelectorAll( '.li-2' ).length ).to.equal( 1 );
                expect$11( view7.$el.querySelector( '.li-2' ).getAttribute( 'data-item' ) ).to.equal( 'sub' );
                expect$11( view7.$el.querySelector( '.li-2' ).getAttribute( 'data-value' ) ).to.equal( 'new sub' );
                expect$11( view7.$el.querySelector( '.li-2' ).innerHTML ).to.equal( '0.sub : new sub' );
            } );

            it( 'Should have been re-compiled after object add new property', function() {
                view7.$assign( view7.scope.data, { 
                    content : {
                        en : 'content',
                        sub : { sub : 'sub3' }
                    }
                } );

                expect$11( view7.$el.querySelectorAll( '.li-1' ).length ).to.equal( 2 );
                expect$11( view7.$el.querySelectorAll( '.li-1' )[ 1 ].getAttribute( 'data-item' ) ).to.equal( 'content' );
                expect$11( view7.$el.querySelectorAll( '.li-2' ).length ).to.equal( 2 );
                expect$11( view7.$el.querySelectorAll( '.li-2' )[ 1 ].getAttribute( 'data-item' ) ).to.equal( 'sub' );
                expect$11( view7.$el.querySelectorAll( '.li-2' )[ 1 ].getAttribute( 'data-value' ) ).to.equal( 'sub3' );
                expect$11( view7.$el.querySelectorAll( '.li-2' )[ 1 ].innerHTML ).to.equal( '0.sub : sub3' );

                view7.scope.data.content.sub.sub = 'sub4';
                expect$11( view7.$el.querySelectorAll( '.li-2' )[ 1 ].innerHTML ).to.equal( '0.sub : sub4' );
            } );
        } );

        describe( ':for...of simple', function() {
            var view8 = window.view8 = new View( {
                template : [
                    '<div>',
                        '<span :for="item of list">{{item}}</span>',
                    '</div>'
                ].join( '' ),
                scope : {
                    list : [ 'a', 1 ]
                }
            } );

            it( 'render', function() {
                expect$11( view8.$el.querySelectorAll( 'span' ).length ).equal( 2 );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( 'a' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '1' );
            } );

            it( 'change', function() {
                view8.scope.list = [ 'b', 2, 1 ];
                expect$11( view8.$el.querySelectorAll( 'span' ).length ).equal( 3 );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( 'b' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 2 ].innerHTML ).equal( '1' );
            } );

            it( 'splice', function(){
                view8.scope.list.splice( 2 ); // b, 2
                expect$11( view8.$el.querySelectorAll( 'span' ).length ).equal( 2 );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( 'b' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
            } );

            it( 'push & unshift', function() {
                view8.scope.list.push( 3 ); // b, 2, 3
                expect$11( view8.$el.querySelectorAll( 'span' ).length ).equal( 3 );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( 'b' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 2 ].innerHTML ).equal( '3' );
                view8.scope.list.unshift( 3 ); // 3, b, 2, 3
                expect$11( view8.$el.querySelectorAll( 'span' ).length ).equal( 4 );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( '3' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( 'b' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 2 ].innerHTML ).equal( '2' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 3 ].innerHTML ).equal( '3' );
            } );

            it( 'pop', function() {
                view8.scope.list.pop(); // 3, b, 2
                expect$11( view8.$el.querySelectorAll( 'span' ).length ).equal( 3 );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( '3' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( 'b' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 2 ].innerHTML ).equal( '2' );
            } );

            it( 'shift', function() {
                view8.scope.list.shift(); // b, 2
                expect$11( view8.$el.querySelectorAll( 'span' ).length ).equal( 2 );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( 'b' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
            } );

            it( '$set', function() {
                view8.scope.list.$set( 0, 0 ); // 0, 2
                expect$11( view8.$el.querySelectorAll( 'span' ).length ).equal( 2 );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( '0' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
                view8.scope.list.$set( 3, 3 ); // 0, 2, undefined, 3
                expect$11( view8.$el.querySelectorAll( 'span' ).length ).equal( 4 );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( '0' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 2 ].innerHTML ).equal( 'undefined' );
                expect$11( view8.$el.querySelectorAll( 'span' )[ 3 ].innerHTML ).equal( '3' );
            } );


        } );

        describe( ':for...of complex', function() {
            var list = genData( 100 );
            var view = window.view9 = new View( {
                template : [
                    '<ul>',
                        '<li :for="x, i of list" $data-i="i">',
                            '{{i + 1}}. {{x.name}}',
                        '</li>',
                    '</ul>'
                ].join( '' ),
                scope : {
                    list : list
                }
            } );

            it( 'render', function() {
                var lis = view.$el.querySelectorAll( 'li' );
                expect$11( view.$el.querySelectorAll( 'li' ).length ).to.equal( 100 );
                expect$11( lis[ 0 ].innerHTML ).to.equal( '1. ' + list[ 0 ].name );
                expect$11( lis[ 1 ].innerHTML ).to.equal( '2. ' + list[ 1 ].name );
            } );

            it( 'change', function() {
                var list = view.scope.list = genData( 99 );
                var lis = view.$el.querySelectorAll( 'li' );
                expect$11( view.$el.querySelectorAll( 'li' ).length ).to.equal( 99 );
                expect$11( lis[ 0 ].innerHTML ).to.equal( '1. ' + list[ 0 ].name );
                expect$11( lis[ 1 ].innerHTML ).to.equal( '2. ' + list[ 1 ].name );
                view.scope.list[ 0 ].name = 'JJ';
                expect$11( lis[ 0 ].innerHTML ).to.equal( '1. JJ' );
                view.scope.list.$set( 0, { a : 1, b : 2, name : 'xxx' } );
                expect$11( lis[ 0 ].innerHTML ).to.equal( '1. xxx' );
            } );

            it( 'splice', function() {
                view.scope.list.splice( 10, 10 );
                var lis = view.$el.querySelectorAll( 'li' );
                expect$11( lis[ 50 ].innerHTML ).to.equal( '51. ' + list[ 50 ].name );
            } );

            it( 'push & unshift', function() {
                view.scope.list = genData( 10 );
                view.scope.list.push( genData( 1 )[ 0 ] );
                view.scope.list[ 10 ].name = 'NEW';
                var lis = view.$el.querySelectorAll( 'li' );
                expect$11( lis[ 10 ].innerHTML ).to.equal( '11. NEW' );
            } );

            it( 'pop', function() {
                view.scope.list = genData( 10 );
                view.scope.list.pop();
                expect$11( view.$el.querySelectorAll( 'li' ).length ).to.equal( 9 );
            } );

            it( 'shift', function() {
                view.scope.list = genData( 10 );
                view.scope.list.shift();
                var lis = view.$el.querySelectorAll( 'li' );
                expect$11( lis.length ).to.equal( 9 );
                expect$11( lis[ 0 ].innerHTML ).to.equal( '1. ' + view.scope.list[ 0 ].name );
            } );

            it( '$set', function() {
                view.scope.list = genData( 10 );
                view.scope.list.$set( 0, { name : 'haha', a : 1, b : 2, c : 3, d : 5, e : 5 } );
                expect$11( view.$el.querySelector( 'li' ).innerHTML ).to.equal( '1. haha' );
            } );
        } );

        describe( ':for...in in :for...of', function() {
            var list = genData( 100 );
            var view = window.view10 = new View( {
                url : '/ns/jolin/test/extra/html/table.html',
                scope : {
                    list : list
                }
            } );

            it( 'render', function() {
                var tds = view.$el.querySelectorAll( 'td' );
                expect$11( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 100 );
                expect$11( tds.length ).to.equal( 500 );
                var key = Object.keys( list[ 0 ] );
                expect$11( tds[ 0 ].innerHTML ).to.equal( list[ 0 ].name.toString() );
                expect$11( tds[ 1 ].innerHTML ).to.equal( key[ 0 ] + ' : ' + list[ 0 ][ key[ 0 ] ] );
            } );

            it( 'change', function() {
                view.scope.list = genData( 99 );
                var tds = view.$el.querySelectorAll( 'td' );
                expect$11( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 99 );
                expect$11( tds.length ).to.equal( 495 );
                var key = Object.keys( list[ 0 ] );
                expect$11( tds[ 0 ].innerHTML ).to.equal( list[ 0 ].name.toString() );
                expect$11( tds[ 1 ].innerHTML ).to.equal( key[ 0 ] + ' : ' + list[ 0 ][ key[ 0 ] ] );
                view.scope.list[ 0 ].name = 'JJ';
                expect$11( tds[ 0 ].innerHTML ).to.equal( 'JJ' );
                view.$assign( view.scope.list[ 0 ], {
                    additional : 'added'
                } );
                expect$11( view.$el.querySelector( 'tr' ).querySelectorAll( 'td' ).length ).to.equal( 6 );

                view.scope.list.$set( 0, { a : 1, b : 2, c : 3, d : 4 } );
            } );

            it( 'splice', function() {
                view.scope.list.splice( 10, 10 );
                var tds = view.$el.querySelectorAll( 'td' );
                expect$11( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 89 );
                expect$11( tds[ 50 ].innerHTML ).to.equal( list[ 10 ].name.toString() );
            } );

            it( 'push & unshift', function() {
                view.scope.list = genData( 10 );
                view.scope.list.push( genData( 1 )[ 0 ] );
                var trs = view.$el.querySelectorAll( 'tr' );
                expect$11( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 11 );
                expect$11( trs[ 10 ].querySelectorAll( 'td' ).length ).to.equal( 5 ); 
                var keys = Object.keys( view.scope.list[ 10 ] );
                expect$11( trs[ 10 ].querySelectorAll( 'td' )[1].innerHTML ).to.equal( keys[ 0 ] + ' : ' + view.scope.list[ 10 ][ keys[ 0 ] ]);
                view.scope.list[ 10 ][ keys[ 0 ] ] = 'NEW';
                expect$11( trs[ 10 ].querySelectorAll( 'td' )[1].innerHTML ).to.equal( keys[ 0 ] + ' : NEW' );
            } );

            it( 'pop', function() {
                view.scope.list = genData( 10 );
                view.scope.list.pop();
                expect$11( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 9 );
            } );

            it( 'shift', function() {
                view.scope.list = genData( 10 );
                view.scope.list.shift();
                var trs = view.$el.querySelectorAll( 'tr' );
                expect$11( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 9 );
                expect$11( trs[ 0 ].getAttribute( 'data-i' ) ).to.equal( '0' );
            } );

            it( '$set', function() {
                view.scope.list = genData( 10 );
                view.scope.list.$set( 0, { name : 'haha', a : 1, b : 2, c : 3, d : 5, e : 5 } );
                var trs = view.$el.querySelectorAll( 'tr' );
                expect$11( trs[ 0 ].querySelectorAll( 'td' ).length ).to.equal( 7 );
            } );
        } );

    } );

    var isShow = function( node ) {
        expect$11( node.$isAnchor ).to.be.not.ok;
    };

    var isNotShow = function( node ) {
        expect$11( node.$isAnchor ).to.be.ok;
    };

    describe( ':if in for', function() {
        describe( ':if in :for...of', function() {

            var view = window.view11 = new View( {
                template : '<p :for="item, i of list" :if="item%2">{{i}}. {{item}}</p>',
                scope : {
                    list : [ 0, 1, 2, 3, 4, 5, 6 ] 
                }
            } );
            it( 'show even', function( done ) {
                var el = view.$el;
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                var childNodes = el.childNodes;
                for( var i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    i % 2 ? isNotShow( childNodes[ i ] ) : isShow( childNodes[ i ] );
                }
                done();
            } );

            it( 'modify list', function( done ) {
                view.scope.list.shift(); // 1,2,3,4,5,6
                var el = view.$el;
                var i, l;
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                var childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                var items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                view.scope.list.$set( 0, 99 ); // 99, 2, 3, 4, 5 6

                childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                expect$11( el.childNodes[ 1 ].innerHTML ).to.equal( '0. 99' );

                view.scope.list.$set( 1, 77 ); // 99, 77, 3, 4, 5
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 4 );

                childNodes = el.childNodes;
                isNotShow( childNodes[ 4 ] );

                view.scope.list = [ 1, 2, 3, 4, 5, 6 ];

                el = view.$el;
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                view.scope.list.$set( 1, 99 ); // 1,99,3,4,5,6
                el = view.$el;
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 4 );
                childNodes = el.childNodes;

                isShow( childNodes[ 2 ] );
                expect$11( childNodes[ 2 ].innerHTML ).to.equal( '1. 99' );

                done();
            } );

        } );

        describe( ':if in for...of complex', function() {
            var view = window.view12 = new View( {
                template : '<p :for="item, i of list" :if="item.val%2">{{i}}. {{item.val}}</p>',
                scope : {
                    list : [ 
                        { val : 0 }, 
                        { val : 1 },
                        { val : 2 },
                        { val : 3 },
                        { val : 4 },
                        { val : 5 },
                        { val : 6 }
                    ] 
                }
            } );

            it( 'show even', function( done ) {
                var el = view.$el;
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                var childNodes = el.childNodes;
                for( var i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    i % 2 ? isNotShow( childNodes[ i ] ) : isShow( childNodes[ i ] );
                }
                done();
            } );

            it( 'modify list', function( done ) {
                view.scope.list.shift(); // 1,2,3,4,5,6
                var el = view.$el;
                var i, l;
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                var childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                var items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                view.scope.list.$set( 0, { val : 99 } ); // 99, 2, 3, 4, 5 6

                childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                expect$11( el.childNodes[ 1 ].innerHTML ).to.equal( '0. 99' );

                view.scope.list.$set( 1, { val : 77 } ); // 99, 77, 3, 4, 5
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 4 );

                childNodes = el.childNodes;
                isNotShow( childNodes[ 4 ] );

                view.scope.list = [ 
                    { val : 1 },
                    { val : 2 },
                    { val : 3 },
                    { val : 4 },
                    { val : 5 },
                    { val : 6 }
                ];

                el = view.$el;
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                view.scope.list.$set( 1, { val : 99 } ); // 1,99,3,4,5,6
                el = view.$el;
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 4 );
                childNodes = el.childNodes;

                isShow( childNodes[ 2 ] );
                expect$11( childNodes[ 2 ].innerHTML ).to.equal( '1. 99' );


                done();
            } );
        } );

        describe( ':if in :for...in', function() {
            var view = window.view13 = new View( {
                template : '<p :for="key, val in data" :if="!(val.id%2)">{{key}}. {{val.id}}</p>',
                scope : {
                    data : {
                        x0 : { id : 0 },
                        x1 : { id : 1 },
                        x2 : { id : 2 }
                    }
                }
            } );

            it( 'Should show correct', function( done ) {
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 2 );
                done();
            } );

            it( 'modify data', function( done ) {
                view.scope.data.x1.id = 4;
                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                expect$11( view.$el.querySelectorAll( 'p' )[ 1 ].innerHTML ).to.equal( 'x1. 4' );

                view.$assign( view.scope.data, { 
                    x3 : { id : 3 },
                    x4 : { id : 4 } 
                } );

                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 4 );
                expect$11( view.$el.querySelectorAll( 'p' )[ 3 ].innerHTML ).to.equal( 'x4. 4' );

                view.scope.data = {
                    x10 : { id : 10 },
                    x11 : { id : 11 },
                    x12 : { id : 12 }
                };

                expect$11( view.$el.querySelectorAll( 'p' ).length ).to.equal( 2 );
                expect$11( view.$el.querySelectorAll( 'p' )[ 1 ].innerHTML ).to.equal( 'x12. 12' );

                done();
            } );
        } );
    } );
} );

var expect$12 = chai.expect;

var isFragment = function( node ) {
    return node && node.nodeType == 11;
};

describe( 'Extensions/View/Template', function() {
    it( 'Should return a DocumentFragment', function( done ) {
        expect$12( isFragment( html2Node( '<div></div>' ) ) ).to.ok;
        expect$12( isFragment( html2Node( 'abc' ) ) ).to.ok;
        expect$12( isFragment( html2Node( '<option>item</option>' ) ) ).to.ok;
        expect$12( isFragment( html2Node( '<!-- comment -->' ) ) ).to.ok;
        done();
    } );

    it( 'Should return correct fragment', function( done ) {
        var node = html2Node( '<div>1</div><div>2</div>' );
        expect$12( node.children.length ).to.equal( 2 );
        expect$12( node.firstChild.tagName ).to.equal( 'DIV' );
        expect$12( node.lastChild.tagName ).to.equal( 'DIV' );

        node = html2Node( '<option>item</option>' );
        expect$12( node.children.length ).to.equal( 1 );
        expect$12( node.firstChild.tagName ).to.equal( 'OPTION' );

        node = html2Node( '<!-- comment -->' );
        expect$12( node.firstChild.nodeType ).to.equal( 8 );

        node = html2Node( 'xyz' );
        expect$12( node.firstChild.nodeType ).to.equal( 3 );

        node = html2Node( '<div>true</div>' );
        expect$12( node.firstChild.innerHTML ).to.equal( 'true' );

        node = html2Node( '<div></div>true' );
        expect$12( node.lastChild.data ).to.equal( 'true' );

        done();
    } );
} );

var expect$13 = chai.expect;
describe( 'Extensions/View/Data', function() {
    var obj = {
        text : 'str',
        props : {
            p1 : 'a',
            p2 : 'b'
        },
        list : [
            'a', 'b', 'c'
        ]
    };
    traverse$1( obj );

    it( 'Should converted all properties to setter and getter ', function() {
        var descriptor = Object.getOwnPropertyDescriptor( obj, 'text' );

        expect$13( descriptor && descriptor.set ).to.be.ok;
    } );

    it( 'Should return correct value as normal after assign new value to properties', function() {
        obj.text = 'new';
        expect$13( obj.text ).to.equal( 'new' );
        obj.props = 'abc';
    } );
} );

}());
