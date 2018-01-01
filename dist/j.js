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

let id = 0;
function uniqueId() {
    return ++id;
}

function traverseNode( nodes, cb ) {
    nodes = slice.call( nodes );
    for( let i = 0, l = nodes.length; i < l; i = i + 1 ) {
        const node = nodes[ i ];
        cb && cb( node );
        if( node.nodeType === 1 && node.hasChildNodes() ) {
            traverseNode( node.childNodes, cb );
        }
    }
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
    plainObject( o ) {
        return !!o && Object.prototype.toString.call( o ) === '[object Object]';
    },
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




var Utils = Object.freeze({
	uniqueId: uniqueId,
	checks: checks,
	currentScript: currentScript,
	realPath: realPath,
	encodeHTML: encodeHTML,
	md5: md5,
	escapeCSS: escapeCSS,
	escapeReg: escapeReg,
	stringf: stringf,
	extract: extract,
	param: param,
	objectValues: objectValues,
	eventSupported: eventSupported,
	html2Node: html2Node,
	traverseNode: traverseNode
});

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

const getXHR = () => new XMLHttpRequest();

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
        onreadystatechange,
        xhrHeader = false,
        credentials = false,
        xhr = getXHR()
    } = options;

    method = method.toUpperCase();
    const hasContent = !/^(?:GET|HEAD)$/.test( method );

    return new Promise( ( resolve, reject ) => {
        let ourl;

        if( credentials ) {
            xhr.withCredentials = true;
        }

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

    $resources( resource, describe = null ) {
        if( this.__isready ) {
            console.warn( '[J WARN] PACKAGE : Setting new item with "$resources" after "ready"' );
        }

        if( resource.$ready ) {
            const ready = resource.$ready();
            ready[ '[[ResourceDesc]]' ] = describe;
            this.__resources.push( ready );
            return ready;
        } else {
            resource[ '[[ResourceDesc]]' ] = describe;
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

        this.__isready || this.$resources( promise, url );

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
        return this.__isready ? p : this.$resources( p, `Loading stylesheet @ ${path}` );
    }

    $script( path ) {
        const p = J$1.Script.create( {
            url : this.$url( path )
        } );
        return this.__isready ? p : this.$resources( p, `Loading script @ ${path}` );
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

            this.__isready || this.$resources( p, `Mounting package @ ${url}` );
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
            return Promise.resolve( this.$children[ name ] );
        }
        return this.$mount( name, url, options );
    }

    $unmount( name, mute = false ) {
        if( this.$children[ name ] ) {
            mute || this.$children[ name ].$destruct();
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

var Value = class {
    constructor( value, options ) {
        this.value = value;
        assign( this, options ); 
    }
};

const requestAnimationFrame = window.requestAnimationFrame || function( fn ){ window.setTimeout( fn, 30 ); }; /*jshint ignore:line*/

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

const easeInOutCubic = t => t < .5 ? 4 * t * t * t : ( t - 1 ) * ( 2 * t - 2 ) * ( 2 * t - 2 ) + 1;

function reposition( start, end, elapsed, duration ) {
    return elapsed > duration ? end : ( start + (end - start) * easeInOutCubic(elapsed / duration) );
}

//function scroll( dest = {}, duration = 500, callback = null, context = window ) {
function scroll( options ) {
    if( options.node ) {
        assign( options, nodePosition( options.node ) );
    }
    let {
        x = 0,
        y = 0,
        offsetX = 0,
        offsetY = 0,
        duration = 500,
        context = window,
        callback
    } = options;

    y = y - offsetY;
    x = x - offsetX;

    const startX = context.scrollLeft || context.pageXOffset;
    const startY = context.scrollTop || context.pageYOffset;

    const time = Date.now();

    const step = () => {
        const elapsed = Date.now() - time;
        if( context !== window ) {
            context.scrollLeft = reposition( startX, x, elapsed, duration );
            context.scrollTop = reposition( startY, y, elapsed, duration ); 
        } else {
            window.scrollTo(
                reposition( startX, x, elapsed, duration ),
                reposition( startY, y, elapsed, duration )
            );
        }

        if( elapsed > duration ) {
            checks.function( callback ) && callback();
        } else {
            requestAnimationFrame( step );
        }
    };

    step();
}




var UI = Object.freeze({
	requestAnimationFrame: requestAnimationFrame,
	nodePosition: nodePosition,
	scroll: scroll
});

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

let id$3 = 0;

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
        this.$package.__isReady || this.$package.$resources( this, this );
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

    $resources( resource, describe = null ) {
        if( this.__isReady ) {
            console.warn( '[J WARN] Extension : Setting new item with "$resources" after "ready"' );
        }
        if( resource.$ready ) {
            const promise = resource.$ready();
            promise[ '[[ResourceDesc]]' ] = describe;
            this.__resources.push( promise );
            return promise;
        } else {
            resource[ '[[ResourceDesc]]' ] = describe;
            this.__resources.push( resource );
            return resource;
        }
    }

    $signal( signal, params ) {
        return this.$package.$receiver( signal, this.$name, params );
    }

    $mount( name, ...args ) {
        if( !name ) {
            name = `#anonymous-${this.$type || 'extension'}-mount-${id$3++}` + id$3++;
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

let id$4 = 0;

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
    const fn = new Function( 's', 'with(s)return ' + exp );
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
        $id : ++id$4,
        $scope : scope,
        $options : options ? assign( {}, options ) : {}
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
        /(^|[^$_\w\d.])\$package\b(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g,
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

function unique( arr ) {
    const result = [];

    for( let item of arr ) {
        if( result.indexOf( item ) < 0 ) {
            result.push( item );
        }
    }

    return result;
}

function addClass( elem, className ) {
    checks.array( className ) && ( className = className.join( ' ' ) );

    const result = elem.className + ' ' + className;
    const arr = result.split( /\s+/ );
    elem.className = unique( arr ).join( ' ' );
    return elem;
}

function removeClass( elem, className ) {

    checks.array( className ) || ( className = className.split( /\s+/ ) );
    const exists = elem.className.split( /\s+/ );

    for( let i = 0, l = exists.length; i < l; i += 1 ) {
        if( className.indexOf( exists[ i ] ) > -1 ) {
            exists.splice( i--, 1 );
        }
    }

    elem.className = exists.join( ' ' );

    return elem;
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

let id$5 = 0;

var $mount = {
    compile( directive, node, view ) {
        const frag = document.createDocumentFragment();
        const value = directive.value;
        const scope = node.$scope;
        let url = node.getAttribute( 'mount-url' ) || node.getAttribute( '*url' );

        if( !url ) return false;

        url = expression$1( url )( scope );

        const model = node.hasAttribute( ':model' ) ? node.getAttribute( ':model' ) : null;
        const attrs = node.attributes; 
        const init = { container : frag };
        const anchor = createAnchor();
        const pkgName = value.trim() ? expression$1( value )( scope ) : '#anonymous-directive-mount' + id$5++;

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
            const match = name.match( /^(?:mount-param-|\*\*)(.*)$/ );
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

        view.$resources( new Promise( resolve => { r = resolve; } ), `Mounting package from a :mount directive in view ${url}` );

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

        return this.$resources( this.__initData(), 'Initializing data' ).then( () => {
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
            } ).catch( e => {
                console.error( e );
            } );
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
        let shown = false;

        const handler = () => {
            const y = getTop( node );
            const scrollTop = window.scrollY || window.pageYOffset || document.body.scrollTop + ( document.documentElement && document.documentElement.scrollTop || 0 );

            if( y - scrollTop - window.innerHeight < dis ) {
                shown = true;
                show( view, node );
                handlers[ handlers.indexOf( handler ) ] = null;
            }
        };

        handlers.push( handler );
        interval = setInterval( () => {
            if( shown || document.body.contains( node ) ) {
                clearTimeout( interval );
                shown || handler();
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

function test( rule, str ) {
    const f = rule.charAt( 0 );
    const l = rule.charAt( rule.length - 1 );

    switch( f + l ) {
        case '//' :
            return new RegExp( rule.slice( 1, -1 ) ).test( str );
        case '[]' :
            return str.indexOf( rule.slice( 1, -1 ) ) > -1;
        default :
            return rule === str;
    }
}

function createTest( rule ) {
    if( rule.indexOf( sp ) < 0 ) {
        return str => test( rule, str );
    }
    return str => {
        const list = rule.split( sp );
        const last = list.pop();
        for( let item of list ) {
            if( test( item, str ) ) {
                return false;
            }
        }
        return last ? test( last, str ) : true;
    };
}

var $router = {
    bind( directive, node ) {
        node.$originalNode || ( node.$originalNode = node.cloneNode( true ) );
        node.$$router = true;
        let next = node.nextElementSibling;
        const stack = [ directive.value ];

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
        const originalOptions = assign( {}, options );
        const test = createTest( value );
        const style = node.style;
        const display = style.display;
        const anchor = createAnchor( '', scope, originalOptions );
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
                if( anchor.$node ) {
                    remove || ( anchor.$node.style.display = display );
                } else {
                    const node = anchor.$originalNode.cloneNode( true );
                    traverse( [ node ], view, scope, originalOptions );
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

function compileStyle( node, attr ) {
    const name = attr.name.slice( 1 );
    const f = interpolation( attr.value );
    const scope = node.$scope;
    
    function value() {
        Record.start( node, node.$eventMarks[ attr.name ], function() {
            node.style[ name ] = value();
        } );
        const res = f( scope );
        Record.reset();
        return res;
    }

    if( !node.$options.once ) {
        node.style[ name ] = value();
    }  else {
        node.style[ name ] = f( scope );
    }
    node.removeAttribute( attr.name );
}

function compileClass( node, attr ) {
    const name = attr.name.slice( 1 );
    const f = interpolation( attr.value );
    const scope = node.$scope;

    function value() {
        Record.start( node, node.$eventMarks[ attr.name ], function() {
            const present = value();
            present ? addClass( node, name ) : removeClass( node, name );
        } );
        const res = f( scope );
        Record.reset();
        return res;
    }

    let present;

    if( !node.$options.once ) {
        present = value();
    } else {
        present = f( scope );
    }

    present ? addClass( node, name ) : removeClass( node, name );
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
    let directives, events$$1, attributes, cache, styles, classes;
    const sign = node.$sign;
    if( sign && ( cache = compileElementCache[ sign ] ) ) {
        directives = cache.directives;
        events$$1 = cache.events;
        attributes = cache.attributes;
        styles = cache.styles;
        classes = cache.classes;
    } else {
        directives = [];
        events$$1 = [];
        attributes = [];
        styles = [];
        classes = [];
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
                case '!' :
                    styles.push( { name, value : item.value } );
                    break;
                case '.' :
                    classes.push( { name, value : item.value } );
                    break;
            }
        }
        sort( directives );
        sign && ( compileElementCache[ sign ] = {
            directives,
            events: events$$1,
            attributes,
            styles,
            classes
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

        for( let i = 0, l = styles.length; i < l; i += 1 ) {
            node.$eventMarks[ styles[ i ].name ] = {};
            compileStyle( node, styles[ i ] );
        }

        for( let i = 0, l = classes.length; i < l; i += 1 ) {
            node.$eventMarks[ classes[ i ].name ] = {};
            compileClass( node, classes[ i ] );
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

const encode = url => encodeURIComponent( url );
const decode = url => decodeURIComponent( url );



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
	highlight: highlight,
	encode: encode,
	decode: decode
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
const decode$1 = str => decodeURIComponent( str.replace( /\+/g, ' ' ) );
const encode$1 = str => encodeURIComponent( str );

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
        this.dict.push( [ decode$1( name ), decode$1( value ) ] );
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
            pairs.push( encode$1( item[ 0 ] ) + '=' + encode$1( item[ 1 ] ) );
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

const scope = { $location : {} };

let id$2 = 0;

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
            } ), 'Loading resources'
        ).then( () => { this.$init(); } );

        this.$package.$on( 'destruct', () => {
            this.$destruct();
        } );
    }

    __loadTpl() {
        const promise = !this.url ? Promise.resolve() : new Promise( resolve => {
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
        this.$resources( promise, `Loading template file @ ${this.url}`);
        return promise;
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
        if( checks.string( model ) ) {
            return this.$bind( name, this.$package.$install( '#anonymous-view-model-' + id$2++, model ) );
        } else if( model instanceof Model ) {
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

        const result = Promise.all( promises );
        this.$resources( result, `Loading filters @ ${JSON.stringify(this.filters)}`);
        return result;
    }

    /**
     * @todo
     *
     * $set and $assign methods are not working while setting an value which is an instance of Value;
     */
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
            return this.$filter( name, this.$mount( func ).then( p => {
                for( let attr in p ) {
                    if( checks.function( p[ attr ] ) ) {
                        p[ attr ] = p[ attr ].bind( p );
                    }
                }
                return p;
            } ) );
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

assign( J$1, {
    Config: config,
    EventCenter,
    Utils,
    Package,
    extend,
    request,
    ajax,
    xhr: getXHR,
    Promise,
    Sequence,
    Response,
    Rule,
    Storage,
    Style,
    Script,
    Value,
    View,
    UI,
    Model,
    Validate,
    URL
} );
window.J = J$1;

}());
