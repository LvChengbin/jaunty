import Promise from './promise.js';
import Sequence from './sequence.js';
import { uniqueId, stringf, realPath } from './utils.js';
import { request } from './http.js';
import { assign } from '../variables';
import config from './config';

const sequence = new Sequence();
const pool = {};

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

        const exists = pool[ id ];

        if( external && exists ) return exists.promise;

        const promise = new Promise( ( r1 ) => { 
            resolve = r1;
        } );

        const head = document.head;
        const baseElem = document.getElementsByTagName( 'base' )[ 0 ];

        pool[ id ] = { id, url, style, promise, external };

        if( external ) {
            sequence.append( () => {
                const node = document.createElement( 'link' );
                node.onload = () => { resolve( id ) };
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

        sequence.append( () => {
            ( url ? request( url, {
                type : 'text',
                storage : {
                    level : o.level || c.level,
                    lifetime : o.lifetime !== undefined ? o.lifetime : c.lifetime,
                    priority : o.priority !== undefined ? o.priority : c.priority,
                    type : 'style'
                }
            } ).then( r => r.text() ) : style ).then( response => {
                pool[ id ].style = style = response;

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
export default Style;
