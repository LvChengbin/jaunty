import Promise from '@lvchengbin/promise';
import is from '@lvchengbin/is';
import { URL } from '@lvchengbin/url';
import Base from '@jaunty/base';

import Script from './script';
import { __packages, __extensions } from './variables';

import { uniqueId, extract, currentScriptURL } from './utils';

const roots = {};

class J extends Base {
    constructor( name, options = {}, initial = {} ) {
        super( name, options, initial );
    }

    __preinit( name, options, initial ) {
        if( is.string( name ) ) {
            this.$name = name;
        } else if( name ) {
            initial = options;
            options = name;
        } 

        const properties = {
            $extensions : {},
            $children : {},
            $name : 'j' + uniqueId(),
            $parent : null,
            $status : J.readyState.CREATED,
            rules : [],
            signals : {}
        };

        for( const attr in properties ) {
            if( !this.hasOwnProperty( attr ) ) {
                this[ attr ] = properties[ attr ];
            }
        }

        Object.assign( this, options, initial );

        if( !this.$url ) {
            this.$url = currentScriptURL();
        }

        // to get the root package of current package
        this.$root = this;
        while( this.$root.$parent ) {
            this.$root = this.$root.$parent;
        }

        // to get the path of current package in the package tree
        let pkg = this;
        this.$path = [];

        while( pkg ) {
            this.$path.unshift( pkg.$name );
            pkg = pkg.$parent;
        }

        this.$root === this && ( roots[ this.$name ] = this )

        this.__exts = {};
    }

    $find( path ) {
        return extract(
            is.array( path ) ? path.join( '.$children.' ) : path.replace( /\./g, '.$children.' ),
            this.$children
        ) || null;
    }

    $sibling( name ) {
        return this.$parent ? this.$parent.$find( name ) : null;
    }

    $siblings( path = false ) {
        const siblings = [];

        if( this.$root === this ) {
            for( let sibling in roots ) {
                if( roots[ sibling ] !== this ) {
                    siblings.push( path ? sibling : roots[ sibling ] );
                }
            }
            return siblings;
        }

        const all = this.$parant.$children;
        for( let name in all ) {
            if( all[ name ] !== this ) {
                siblings.push( path ? all[ name ].$path : all[ name ] );
            }
        }
        return siblings;
    }

    $install( name, url, ...params ) {
        const [ ns, rname ] = name.indexOf( '.' ) > 0 ? name.split( '.' ) : [ null, name ];

        if( ns ) {
            this[ '__$$' + ns ] || ( this[ '__$$' + ns ] = {} );
            if( !is.function( this[ '$' + ns ] ) ) {
                this[ '$' + ns ] = n => {
                    return this[ '__$$' + ns ][ n ];
                };
            }
        }

        let r ;

        const promise = new Promise( resolve => { r = resolve } );
        const install = extension => {
            if( is.function( extension ) ) {
                const ext = extension( { name, package : this }, ...params );
                ns ? ( this[ '__$$' + ns ][ rname ] = ext ) : ( this[ name ] = ext );
                is.function( ext.$ready ) ?  ext.$ready( () => { r() } ) : r();
                return ext;
            } else {
                if( is.function( extension.$ready ) ) {
                    extension.$ready( () => { r() } );
                } else if( is.promise( extension ) ) {
                    extension.then( () => { r() } );
                } else { r() }
                ns ? ( this[ '__$$' + ns ][ rname ] = extension ) : ( this[ name ] = extension );
                return extension;
            }
        };

        if( this.$status !== J.readyState.READY ) {
            this.$resources( promise, url );
        }

        if( !is.string( url ) ) {
            const p = new Promise( resolve => {
                resolve( install( url ) );
            } );
            p.installation = true;
            return p;
        }

        const p = new Promise( ( resolve, reject ) => {
            url = new URL( url, this.$url ).toString();
            if( __extensions[ url ] ) {
                resolve( install( __extensions[ url ] ) );
            } else {
                Script.create( url ).then( () => {
                    resolve( install( __extensions[ url ] ) );
                } ).catch( reason => {
                    reject( reason );
                } );
            }
        } );

        p.installation = true;
        return p;
    }

    $style( path, options ) {
        const p = J.Style.create( Object.assign( {
            url : this.$url( path )
        }, options || {} )  );

        if( this.$status === J.readyState.READY ) {
            return p;
        }

        return this.$resources( p, `Loading stylesheet @ ${path}` );
    }

    $script( path, options ) {
        const p = Script.create( new URL( path, this.$url ), options );

        if( this.$status === J.readyState.READY ) {
            return p;
        }

        return this.$resources( p, `Loading script @ ${path}` );
    }

    $mount( name, url, options = {} ) {
        let anonymous = false;
        if( arguments.length < 3 && !is.string( arguments[ 1 ] ) ) {
            options = url || {};
            url = name;
            name = null;
        }

        if( !name ) {
            anonymous = true;
            name = '#anonymous$' + uniqueId();
        }

        url = new URL( url, location.href ).toString();

        if( !/\/index\.js/.test( url ) ) {
            if( url.charAt( url.length - 1 ) != '/' ) {
                url += '/';
            }
            url = new URL( 'index.js', url ).toString();
        }

        const mount = P => {
            const p = new P( options, {
                $parent : this,
                $name : name,
                $url : url
            } );

            anonymous && ( p.$isanonymous = true );

            if( this.$status !== J.readyState.READY ) {
                this.$resources( p, `Mounting package @ ${url}` );
            }
            return ( this.$children[ name ] = p );
        };

        return new Promise( ( resolve, reject ) => {
            if( __packages[ url ] ) {
                mount( __packages[ url ] ).$ready( m => { resolve( m ) } );
            } else {
                Script.create( url ).then( () => {
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

    $destruct() {
        this.$emit( 'destruct' );
    }

    $throw( message, ...args ) {
        throw new TypeError( `[Package ${this.$name}@${this.__url}] ${message}`, ...args );
    }
}

J.find = function( path ) {
    var root ;
    !is.array( path ) && ( path = path.split( '.' ) );
    if( !path.length ) return null;
    root = path.shift();
    if( !roots[ root ] ) return null;
    if( !path.length ) return roots[ root ];
    return roots[ root ].$find( path );
};
export default J;
