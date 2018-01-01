import Promise from './promise';
import Response from './response';
import Storage from './storage';
import config from './config';
import { checks, param } from './utils';
import { assign } from '../variables';

const getXHR = () => new XMLHttpRequest();

const ajax = ( url, options = {} ) => {
    var {
        data,
        sync = false,
        type = 'json',
        cache = 'no-cache',
        method = 'GET',
        headers = {},
        username,
        password,
        processData = true,
        contentType = true,
        onreadystatechange,
        xhrHeader = false,
        credentials = false,
        xhr = getXHR()
    } = options;

    method = method.toUpperCase();
    const hasContent = !/^(?:GET|HEAD)$/.test( method );

    return new Promise( ( resolve, reject ) => {
        let ourl;

        if( credentials ) {
            xhr.withCredentials = true;
        }

        onreadystatechange || ( onreadystatechange = () => {
            if( xhr.readyState === 4 || xhr.readyState === 'complete' ) {
                if( xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 ) {
                    const response = new Response( {
                        url : ourl,
                        status : xhr.status,
                        statusText : xhr.statusText,
                        headers : xhr.getAllResponseHeaders(),
                        body : xhr.responseText
                    } );

                    if( type === 'json' ) {
                        try {
                            response.json();
                            resolve( response );
                        } catch( e ) {
                            reject( e );
                        }
                    } else {
                        resolve( response );
                    }
                } else {
                    reject( new Response( {
                        url : ourl,
                        status : xhr.status,
                        statusText : xhr.statusText,
                        headers : xhr.getAllResponseHeaders(),
                        body : xhr.responseText
                    } ) );
                }
            }
        } );

        ( processData === true && data && !checks.string( data ) ) && ( data = param( data ) );


        if( contentType && !hasContent ) {
            if( data ) {
                url += ( url.indexOf( '?' ) >= 0 ? '&' : '?' ) + data;
            }
            ourl = url;
            if( cache === 'no-cache' ) {
                url += ( url.indexOf( '?' ) >= 0 ? '&' : '?' ) + ( +new Date );
            }
        }
        
        xhr.open( method, url, !sync, username, password );

        if( xhrHeader === true ) {
            headers = assign( {
                'X-Requested-With' : 'XMLHttpRequest'
            }, headers );
        }

        if( contentType && hasContent && !headers[ 'Content-Type' ] ) {
            xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8' );
        }

        for( let key in headers ) {
            xhr.setRequestHeader( key, headers[ key ] );
        }

        sync || ( xhr.onreadystatechange = onreadystatechange );
        xhr.send( ( hasContent && data ) ? data : null );
        sync && onreadystatechange();
    } );
};

const pool = {};

const request = ( url, options = {} ) => {
    let cacheUrl = url;
    const method = options.method;
    const isGet = !method || method.toLowerCase() === 'get';
    const processData = options.processData === false ? false : true;

    if( isGet ) {
        let data = options.data;
        ( data && !checks.string( data ) && processData ) && ( data = param( data ) );
        if( data ) {
            cacheUrl += ( url.indexOf( '?' ) >= 0 ? '&' : '?' ) + data;
        }
    } else {
        if( processData ) {
            const data = {};
            data[ config.csrf.name ] = config.csrf.token;
            options.data = assign( data, options.data );
        }
    }

    if( isGet && pool[ cacheUrl ] ) {
        return pool[ cacheUrl ];
    }

    const match = url.match( /\.([\w\d-_]+)(?:\?|$)/ );
    
    if( match ) {
        if( match[ 1 ].toLowerCase() === 'json' ) {
            options.cache = null;
            
        }
    }

    if( isGet ) {

        const promise = new Promise( resolve => {
            if( options.storage === false ) {
                resolve( ajax( url, options ) );
                return;
            }
            Storage.get( cacheUrl ).then( data => {
                resolve( new Response( {
                    url,
                    status : 304,
                    statusText : 'From Storage',
                    body : data.content
                } ) );
            } ).catch( () => {
                resolve( ajax( url, options ) );
            } );
        } ).then( response => {
            if( options.storage !== false && response.statusText !== 'From Storage' ) {
                const o = options.storage || {};
                const c = config.request.storage;
                Storage.set( response.url, response.text(), {
                    level : o.level || c.level,
                    lifetime : o.lifetime !== undefined ? o.lifetime : c.lifetime,
                    priority : o.priority !== undefined ? o.priority : c.priority
                } );
            }
            if( !options.type || options.type === 'json' ) {
                return response.json();
            }
            return response;
        } );

        pool[ cacheUrl ] = promise;
        
        promise.then( () => {
            console.log( '[J Request] Finish : ', cacheUrl );
            pool[ cacheUrl ] = null;
        } );

        return promise;
    } else {
        return ajax( url, options ).then( response => {
            if( !options.type || options.type === 'json' ) {
                return response.json();
            }
            return response;
        } );
    }
};

let id = 0;

function createScriptTag( src, id ) {
    const head = document.head;
    const baseElem = document.getElementsByTagName( 'base' )[ 0 ];
    const node = document.createElement( 'script' );
    node.type = 'text/javascript';
    node.charset = 'utf-8';
    node.async = true;
    node.src = src;
    node.id = id;
    baseElem ? head.insertBefore( node, baseElem ) : head.appendChild( node );
}

const jsonp = function( url, options = {}, fn ) {
    if( checks.function( options ) ) {
        fn = options;
        options = {};
    }

    const params = options.data || {};
    const callback = 'J_JSONP_CALLBACK_' + Math.random().toString.substr( 2 ) + '_' + id++;

    let r;

    const promise = new Promise( resolve => { r = resolve } );

    params.callback || ( params.callback = callback );

    const querystring = param( params );

    url += ( url.indexOf( '?' ) >= 0 ? '&' : '?' ) + querystring;

    window[ callback ] = function( response ) {
        if( checks.function( fn ) ) {
            fn( response );
        }
        r( response );
        window[ callback ] = null;
        delete window[ callback ];
        const script = document.getElementById( callback );
        script && script.parentNode.removeChild( script );
    };

    createScriptTag( url, callback );

    return promise;
};

export { ajax, request, jsonp, getXHR as xhr };
