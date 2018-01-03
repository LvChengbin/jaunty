import config from './config';
import J from '../../core/j';
import Extension from '../../core/extension';
import { realPath, checks, html2Node } from '../../core/utils';
import { request } from '../../core/http';
import Promise from '../../core/promise';
import { eventcenter } from '../utils';
import { copyDescripter } from './utils';
import { traverse as compile } from './compile';
import { traverse as traverseData , observer, mtrigger } from '../observer';
import { assign, slice, getKeys } from '../../variables';
import Model from '../model';
import URL from '../url';
import ec from '../../core/ec';

const scope = { $location : {} };

let id = 0;

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

ec.$on( 'routechange', () => bindLocation() );
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
                compile( slice.call( frag.childNodes ), this, this );

                if( checks.string( this.container ) ) {
                    this.container = document.querySelector( this.container );
                }

                if( this.container ) {
                    this.$el = this.container;
                    this.$el.appendChild( frag );
                } else { 
                    this.$el = frag;
                }
                return Promise.resolve();
            } ), 'Loading resources'
        ).then( () => { this.$init() } );

        this.$package.$on( 'destruct', () => {
            this.$destruct();
        } );
    }

    __loadTpl() {
        const promise = !this.url ? Promise.resolve() : new Promise( resolve => {
            const c = config.storage;
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
            return this.$bind( name, this.$package.$install( '#anonymous-view-model-' + id++, model ) );
        } else if( model instanceof Model ) {
            model.$on( 'refresh', () => this.$set( this, name,  model.$data ) );
            return Promise.all( [ model.$ready(), this.$ready() ] ).then( () => {
                this.$set( this, name, model.$data );
            } );
        } else if( checks.promise( model ) ) {
            if( model.installation )  {
                return Promise.all( [ model, this.$ready() ] ).then( args => {
                    const m = args[ 0 ];
                    m.$ready( () => { this.$set( this, name, m.$data ) } );
                    m.$on( 'refresh', () => this.$set( this, name, m.$data ) );
                    return m.$ready();
                } );
            } else {
                return model.then( m => {
                    if( m instanceof Model ) {
                        m.$ready( () => { this.$set( this, name, m.$data ) } );
                        m.$on( 'refresh', () => this.$set( this, name, m.$data ) );
                        return m.$ready();
                    } else if( m instanceof J ) {
                        return this.$bind( name, checks.function( m.expose ) ?  m.expose() : m.data );
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
        traverseData( src, null, dest );

        if( dest === this.scope ) {
            copyDescripter( this, this.scope, getKeys( src ) );
        }
        mtrigger( dest );
    }

    $watch( exp, handler ) {
        eventcenter.$on( this.__id + '.' + exp, handler );
    }

    $unwatch( exp, handler ) {
        eventcenter.$off( this.__id + '.' + exp, handler );
    }

    $filter( name, handler ) {
        if( checks.promise( handler ) ) {
            return handler.then( data => {
                if( !data ) return;
                if( data instanceof J ) {
                    this.$filters[ name ] = checks.function( data.expose ) ? data.expose() : data;
                } else {
                    this.$filters[ name ] = data;
                }
            } );
        }
        if( checks.string( handler ) ) {
            return this.$filter( name, this.$mount( handler ).then( p => {
                for( let attr in p ) {
                    if( checks.function( p[ attr ] ) ) {
                        p[ attr ] = p[ attr ].bind( p );
                    }
                }
                return p;
            } ) );
        }
        this.$filters[ name ] = handler;
        return Promise.resolve( handler );
    }

    $destruct() {
        eventcenter.$removeListeners( name => name.indexOf( this.__id + '.' ) > -1 );
        this.$trigger( 'destruct' );
    }
}

View.filter = function( name, func ) {
    View.$filters[ name ] = func;
};

View.extend = properties => {
    assign( View.properties, properties );
};
export default View;
