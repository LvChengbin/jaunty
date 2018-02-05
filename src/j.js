import EventEmitter from '@lvchengbin/event-emitter';
import Promise from '@lvchengbin/promise';
import is from '@lvchengbin/is';
import { URL } from '@lvchengbin/url';

import Script from './script';
import { __packages, __extensions } from './variables';

import { uniqueId, extract, currentScript } from './utils';

const roots = {};

class J extends EventEmitter {
    constructor( name, options = {}, initial = {} ) {
        super();

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
            if( !this[ attr ] ) {
                this[ attr ] = properties[ attr ];
            }
        }

        Object.assign( this, options, initial );

        // get the URL of current package from currentScript
        const script = currentScript();
        script && ( this.__url = script.getAttribute( 'data-src' ) );

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
        this.__resources = [];
        this.__isready = false;

        for( let propery in this ) {
            if( /^__init[A-Z]+/.test( propery ) && is.function( this[ propery ] ) ) {
                this[ propery]();
            }
        }

        const init = is.function( this.init ) && this.init( options );

        this.$status = J.readyState.LOADING;

        if( is.promise( init ) ) {
            this.__ready = init.then( () => {
                return Promise.all( this.__resources ).then( () => {
                    console.info( `[J Package] ${this.$path()} is ready @${this.__url} ` );
                    this.__isready = true;
                    this.$status = J.readyState.READY;
                    is.function( this.action ) && this.action();
                } );
            } );
        } else {
            ( this.__ready = Promise.all( this.__resources ) ).then( () => {
                console.info( '[J Package] PACKAGE : "' + this.$path().join( '.' ) + '" is ready' );
                this.__isready = true;
                this.$status = J.readyState.READY;
                is.function( this.action ) && this.action();
            } );
        }
    }

    $url( path ){
        if( !this.__url ) return null;
        return path ? new URL( path, this.__url ).toString() : this.__url;
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

    $ready( handler ) {
        if( !handler ) return this.__ready;

        return this.__ready.then( () => {
            handler.call( this, this );
        } );
    }
    $find( path ) {
        return extract(
            is.array( path ) ? path.join( '.$children.' ) : path.replace( /\./g, '.$children.' ),
            this.$children
        );
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

        this.__isready || this.$resources( promise, url );

        if( !is.string( url ) ) {
            const p = new Promise( resolve => {
                resolve( install( url ) );
            } );
            p.installation = true;
            return p;
        }

        const p = new Promise( ( resolve, reject ) => {
            url = new URL( url, this.__url ).toString();
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

    $style( path, options ) {
        const p = J.Style.create( Object.assign( {
            url : this.$url( path )
        }, options || {} )  );
        return this.__isready ? p : this.$resources( p, `Loading stylesheet @ ${path}` );
    }

    $script( path ) {
        const p = J.Script.create( {
            url : this.$url( path )
        } );
        return this.__isready ? p : this.$resources( p, `Loading script @ ${path}` );
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
                mount( __packages[ url ] ).$ready( m => { resolve( m ) } );
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

    $destruct() {
        this.$emit( 'destruct' );
    }

    $throw( message, ...args ) {
        throw new TypeError( `[Package ${this.$name}@${this.__url}] ${message}`, ...args );
    }
}

J.readyState = {
    CREATED : 0,
    LOADING : 1,
    READY : 2
};

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
