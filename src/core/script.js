import Promise from './promise';
import Sequence from './sequence';
import { realPath } from './utils';
import { request } from './http';
import config from './config';

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

        const promise = new Promise( r => { resolve = r } );
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
                node.onload = () => { resolve( node ) };
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
export default Script;
