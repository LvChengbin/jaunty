import EventCenter from './eventcenter';
import Promise from './promise';
import Script from './script';
import { assign, isArray, getKeys, __packages, __extensions } from '../variables';
import Event from './event';
import ec from './ec';
import Rule from './rule';

import { uniqueId, realPath, checks, extract, currentScript } from './utils';

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
        if( args !== false ) {
            pkg.$trigger( 'j://' + evt, subject, ...args );
        } 
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

class J extends EventCenter {
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
            $status : J.readyState.CREATED,
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

        let pkg = this;
        const path = [];

        while( pkg ) {
            path.unshift( pkg.$name );
            pkg = pkg.$parent;
        }

        this.$path = path;

        if( root === this  ) {
            roots[ this.$name ] = this;
            const handler = e => {
                this.$broadcast( '$routers', e );
            };
            ec.$on( 'routechange', handler );
            this.$on( 'destruct', () => {
                ec.$off( 'routechange', handler );
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
        ec.$on( 'routechange', onrouteHandler );

        this.$on( 'destruct', () => {
            ec.$off( 'routechange', onrouteHandler );
        } );

        const init = checks.function( this.init ) && this.init( options );

        this.$status = J.readyState.LOADING;

        if( init && checks.function( init.then ) ) {
            this.__ready = init.then( () => {
                const promise = Promise.all( this.__resources );
                promise.then( () => {
                    console.info( `[J Package] ${this.$path()} is ready @${this.__url} ` );
                    this.__isready = true;
                    this.$status = J.readyState.READY;
                    checks.function( this.action ) && this.action();
                } );
                return promise;
            } );
        } else {
            ( this.__ready = Promise.all( this.__resources ) ).then( () => {
                console.info( '[J Package] PACKAGE : "' + this.$path().join( '.' ) + '" is ready' );
                this.__isready = true;
                this.$status = J.readyState.READY;
                checks.function( this.action ) && this.action();
            } );
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

    $ready( handler ) {
        if( !handler ) return this.__ready;

        return this.__ready.then( () => {
            handler.call( this, this );
        } );
    }
    $find( path ) {
        return extract(
            isArray( path ) ? path.join( '.$children.' ) : path.replace( /\./g, '.$children.' ),
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
            if( !checks.function( this[ '$' + ns ] ) ) {
                this[ '$' + ns ] = n => {
                    return this[ '__$$' + ns ][ n ];
                };
            }
        }

        let r ;

        const promise = new Promise( resolve => { r = resolve } );
        const install = extension => {
            if( checks.function( extension ) ) {
                const ext = extension( { name, package : this }, ...params );
                ns ? ( this[ '__$$' + ns ][ rname ] = ext ) : ( this[ name ] = ext );
                checks.function( ext.$ready ) ?  ext.$ready( () => { r() } ) : r();
                return ext;
            } else {
                if( checks.function( extension.$ready ) ) {
                    extension.$ready( () => { r() } );
                } else if( checks.function( extension.then ) ) {
                    extension.then( () => { r() } );
                } else { r() }
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

    $style( path, options ) {
        const p = J.Style.create( assign( {
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

    $message( to, subject, body, from ) {
        if( !to ) {
            console.error( '[J Message] recipient is ' + to );
            return;
        }

        ( to instanceof J ) || ( to = this.$find( to ) );
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
        isArray( to ) || ( to = [ to ] );
        for( let i = 0, l = to.length; i < l; i += 1 ) {
            const item = checks.string( to[ i ] ) ? this.$find( to[ i ] ) : to[ i ];
            item && item.$trigger( 'j://event', subject, body, new Event( { from, subject } ) );
        }
    }

    $bubble( subject, body, from ) {
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

J.readyState = {
    CREATED : 0,
    LOADING : 1,
    READY : 2
};

J.find = function( path ) {
    var root ;
    !isArray( path ) && ( path = path.split( '.' ) );
    if( !path.length ) return null;
    root = path.shift();
    if( !roots[ root ] ) return null;
    if( !path.length ) return roots[ root ];
    return roots[ root ].$find( path );
};

/*
J.install = function( name, plugin, params ) {
    const install = c => {
        J[ name ] = c( params );
    };
    return new Promise( ( resolve, reject ) => {
        plugin = realPath( plugin );
        if( __extensions[ plugin ] ) {
            resolve( install( __extensions[ plugin ] ) );
        } else {
            Script.create( { url : plugin } ).then( () => {
                resolve( install( __extensions[ plugin ] ) );
            } ).catch( reason => {
                reject( reason );
            } );
        }
    } );
};
*/
export default J;
