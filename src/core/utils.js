import { getKeys, isArray, slice } from '../variables';

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

        try { [ November, 8 ] } catch( e ) { // eslint-disable-line
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

export {
    uniqueId, checks, currentScript, realPath, encodeHTML, md5,
    escapeCSS, escapeReg, stringf, extract, param, objectValues,
    eventSupported, html2Node, traverseNode
};
