import Promise from '@lvchengbin/promise';
import Sequence from '@lvchengbin/sequence';
import biu from '@lvchengbin/biu';
import { URL } from '@lvchengbin/url';

import config from './config';

const sequence = new Sequence();
const pool = {};

const Script = {
    create( url, options = {} ) {
        let resolve;

        const conf = config.script;

        const { 
            external = conf.external,
            type = 'text/javascript',
            charset = 'utf-8',
            async = true,
            localcache = conf.localcache
        } = options;

        url = new URL( url, location.href );

        const exists = pool[ url ];
        if( exists ) return exists.promise;

        const promise = new Promise( r => { resolve = r } );
        const head = document.head;
        const baseElem = document.getElementsByTagName( 'base' )[ 0 ];
        const node = document.createElement( 'script' );
        node.type = type;
        node.charset = charset; 
        node.async = async;
        node.setAttribute( 'data-src', url );

        pool[ url ] = { url, promise, external };

        if( external ) {
            sequence.append( () => {
                node.onload = () => { resolve( node ) };
                node.src = url;
                baseElem ? head.insertBefore( node, baseElem ) : head.appendChild( node );
                return promise;
            } );
            return promise;
        }

        if( localcache ) {
            localcache.mime = 'application/javascript';
            localcache.type = 'js';
        }

        sequence.append( () => {
            biu.get( url, { localcache } ).then( response => {
                node.text = response;
                head.appendChild( node );
                node.setAttribute( 'data-from-cache', 1 );
                resolve( node );
            } );
            return promise;
        } );
        return promise;
    },
    get( url ) {
        return pool[ url ] || false;
    }
};
export default Script;
