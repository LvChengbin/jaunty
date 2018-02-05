import EventEmitter from '@lvchengbin/event-emitter';
import Promise from '@lvchengbin/promise';
import is from '@lvchengbin/is';
import { uniqueId } from './utils';

let id = 0;

class Extension extends EventEmitter {
    constructor( options, init ) {
        super();
        if( !init || !init.name || !init.package ) {
            console.error( '[J ERROR] Extension : the initial information is invalid.', init, this );
        }
        this.$status = Extension.readyState.CREATED;
        this.__isReady = false;
        this.__id = uniqueId();
        this.__resources = [];
        this.__ready = new Promise( r => ( this.__resolve = r ) );
        this.$name = init.name;
        this.$type = init.$type;
        this.$package = init.package;
        this.$package.__isReady || this.$package.$resources( this, this );
        this.$status = Extension.readyState.LOADING;
    }

    $init() {
        const init = is.function( this.init ) && this.init();

        if( init && is.function( init.then ) ) {
            init.then( () => {
                const promise = Promise.all( this.__resources );
                promise.then( () => {
                    this.__resolve();
                    this.__isReady = true;
                    this.$status = Extension.readyState.READY;
                    is.function( this.action ) && this.action();
                } );
            } );
        } else {
            Promise.all( this.__resources ).then( () => {
                this.__resolve();
                this.__isReady = true;
                this.$status = Extension.readyState.READY;
                is.function( this.action ) && this.action();
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
            name = `#anonymous-${this.$type || 'extension'}-mount-${id++}` + id++;
        }
        return this.$package.$mount( name, ...args );
    }

}

Extension.readyState = {
    CREATED : 0,
    LOADING : 1,
    READY : 2
};

export default Extension;
