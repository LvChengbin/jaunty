import Promise from './promise';
import { md5, checks } from './utils';
import { getKeys } from '../variables';

const engines = {
    memory : 1,
    localStorage : 2,
    sessionStorage : 3,
    indexedDB : 4
};

function check( unit, md5 ) {
    if( !unit ) return false;
    if( checks.string( unit ) ) {
        try {
            unit = JSON.parse( unit );
        }  catch( e ) { return false } 
    }
    const lifetime = unit.lifetime;
    if( lifetime !== 0 && ( new Date - unit.timestamp > lifetime ) ) return false;
    if( md5 && unit.md5 !== md5 ) return false;
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
    get( key, md5 ) {
        const engine = index[ key ];
        if( !engine ) return Promise.reject( 'not exists' );
        let unit;
        switch( engine ) {
            case 1 : // in memory
                unit = check( memory[ key ] );
                break;
            case 2 : // in localStorage
                unit = check( localStorage.getItem( prefix + key ), md5 );
                break;
            case 3 : // in sessionStorage
                unit = check( sessionStorage.getItem( prefix + key ), md5 );
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
export default Storage;
