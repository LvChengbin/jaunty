let id = 0;
function uniqueId() {
    return ++id;
}

const features = {
    event( event, el ) {
        const eventName = 'on' + event;

        el = el ? el.cloneNode( false ) : document.createElement( 'div' );
        el.setAttribute( eventName,  'return' );
        return typeof el[ eventName ] === 'function';
    }
};

function currentScript() {
    return document.currentScript || ( () => {
        const scripts = document.scripts;

        for( let i = 0, l = scripts.length; i < l; i += 1 ) {
            if( scripts[ i ].readyState === 'interactive' ) {
                return scripts[ i ];
            }
        }

        try { [ November, 8 ] } catch( e ) { // eslint-disable-line
            if( 'stack' in e ) {
                for( let i = 0, l = scripts.length; i < l; i += 1 ) {
                    if( scripts[ i ].src === e.stack.split( /at\s+|@/g ).pop().replace( /:[\d:\s]+?$/, '' ) ) {
                        return scripts[ i ];
                    }
                }
            }
        }
        return null;
    } )();
}

function currentScriptURL() {
    const script = currentScript(); 

    if( !script ) {
        throw new TypeError( 'Please don\'t use "currentScriptURL" in asynchronous function.' );
    }

    const src = script.getAttribute( 'data-src' ) || script.src;
    const href = location.href;
    return src ? new URL( src, href ).toString() : href;
}

function extract( chain, data, separator = '.' ) { 
    var tmp = data || window;
    for( let item of chain.split( separator ) ) { 
        if( typeof ( tmp = tmp[ item ] ) === 'undefined' ) return tmp;
    }   
    return tmp;
}

export { uniqueId, currentScript, currentScriptURL, extract, features };
