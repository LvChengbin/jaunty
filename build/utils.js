const fs = require( 'fs' );
const { red, green, magenta } = require( 'colors' );

const utils = {
    uid : ( () => {
        var id = 0;
        return () => {
            return ( +new Date + process.pid + id++ ).toString( 36 );
        };
    } )(),

    extract : ( chain, data, separator ) => { 
        var tmp = data;
        const list = chain.split( separator || '.' );

        for( let item of list ) {
            tmp = tmp[ item ];
            if( typeof tmp === 'undefined' ) return tmp;
        }
 
        return tmp;
    },

    isPackage : ( path ) => {
        if( !path ) return false;
        if( !fs.lstatSync( path ).isDirectory() ) return false;
        path = path.replace( /\/+$/g, '' );
        var init = path.split( '/' ).pop() + '.js';
        return fs.existsSync( path + '/' + init );
    },

    getPackage : ( path ) => {
        path = path.split( '/' );

        while( path.length ) {
            if( utils.isPackage( path.join( '/' ) ) ) {
                return path.join( '/' ).replace( /\/+$/g, '' );
            }
            path.pop();
        }

        return null;
    },

    realPath : function( base, path ) {
        var url = location.href,
            reg = {
                dotdot : /\/[^/]+\/\.\.\//,
                dot : /\/\.\//g
            };

        if( arguments.length > 1 && base.length ) {
            path = [ 
                base.replace( /\/+$/g, '' ),
                path.replace( /^\/+/g, '' )
            ].join( '/' );
        } else {
            path = ( base ? base : path ) || '';
        }
        //@todo

        if( !/^([a-z]([a-z]|\d|\+|-|\.)*):\/\//.test( path ) ) {
            if( !path.indexOf( '/' ) ) {
                path = [
                    url.replace( /([^:/])\/.*/g, '$1' ),
                    path
                ].join( '' );
            } else {
                if( url.lastIndexOf( '/' ) === url.length - 1 ) {
                    path = [
                        url,
                        path.replace( /^\/+/g, '' )
                    ].join( '' );
                } else {
                    path = [
                        url.replace( /\/[^/]*?$/, '' ),
                        path.replace( /^\/+/g, '' )
                    ].join( '/' );
                }
            }
        }
        path = path.replace( reg.dot, '/' );

        while( path.match( reg.dotdot ) ) {
            path = path.replace( reg.dotdot, '/' );
        }
        return path;
    },
    encodeHTML : ( s ) => String( s ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' ).replace( /"/g, '&quot;' ).replace( /'/g, '&#39;' ),

    /**
     * escape css special characters
     * @see https://mathiasbynens.be/notes/css-escapes
     */
    escapeCss : ( s ) => String( s ).replace( /([!"#$%&'()*+,-./:;<=>?@[\]^`{|},~])/g, '\\$1' ),
    escapeReg : ( s ) => String( s ).replace( new RegExp( '([.*+?^=!:\x24{}()|[\\]\/\\\\])', 'g' ), '\\\x241' ),

    formatString : ( str, data, leftDelimiter = '{#', rightDelimiter = '}' ) => { 
        const reg = new RegExp( leftDelimiter + '([\\w.]+)' + rightDelimiter, 'g' );
        return str.replace( reg, ( m, n ) => { 
            const val = utils.extract( n, data );
            return typeof val === 'undefined' ? '' : val;
        } );
    },

    query : function( name ) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    depends : function( ) {
        var depends = [];
        return {
            get : function() {
                return depends;
            },
            push : function( url, force ) {
                ( !this.has( url ) || force === true ) && depends.push( url );
                return depends;
            },
            has : function( url ) {
                return depends.indexOf( url ) > -1;
            }
        };
    }(),

    log : ( () => { 
        const dashes = '-'.repeat( 99 );
        return {
            info : ( ...msg ) => {
                console.log( 
                    green( `  \n[INFO]  ` ),
                    ...msg,
                    green( `\n${dashes}` )  
                );
            },
            error : ( ...msg ) => {
                console.warn( 
                    red( `  \n[ERROR]  ` ),
                    ...msg,
                    red( `\n${dashes}` ) 
                );
            },
            warn : ( ...msg ) => {
                console.error( 
                    magenta( `  \n[WARNING]  ` ),
                    ...msg,
                    magenta( `\n${dashes}` ) 
                );
            }
        };
    } )()
};

module.exports = utils; 
