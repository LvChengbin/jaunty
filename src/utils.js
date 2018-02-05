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

function extract( chain, data, separator = '.' ) { 
    var tmp = data || window;
    for( let item of chain.split( separator ) ) { 
        if( typeof ( tmp = tmp[ item ] ) === 'undefined' ) return tmp;
    }   
    return tmp;
}

const wrap = {
    $default : [ 0, '', '' ],
    option : [ 1, '<select multiple="multiple">', '</select>' ],
    thead : [ 1, '<table>', '</table>' ],
    tr : [ 2, '<table><tbody>', '</tbody></table>' ],
    col : [ 2, '<table><tbody></tbody><colgroup>', '</colgroup></table>' ],
    td : [ 3, '<table><tbody><tr>', '</tr></tbody></table>' ]
};

const rtag = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i; // eslint-disable-line

wrap.optgroup = wrap.option;
wrap.tbody = wrap.tfoot = wrap.colgroup = wrap.caption = wrap.thead;
wrap.th = wrap.td;

const dom = {
    create( html ) {
        const frag = document.createDocumentFragment();
        const tag = ( rtag.exec( html ) || [ '', '' ] )[ 1 ];
        const wr = wrap[ tag ] || wrap.$default;
        let node = document.createElement( 'div' );
        let depth = wr[ 0 ];
        node.innerHTML = wr[ 1 ] + html + wr[ 2 ];
        while( depth-- ) node = node.lastChild;
        let child;
        while( ( child = node.firstChild ) ) {
            frag.appendChild( child );
        }
        return frag;
    },

    traverse( nodes, cb ) {
        if( !nodes.length ) {
            nodes = [ nodes ];
        } else {
            nodes = Array.prototype.slice.call( nodes );
        }
        for( let i = 0, l = nodes.length; i < l; i = i + 1 ) {
            const node = nodes[ i ];
            cb && cb( node );
            if( node.nodeType === 1 && node.hasChildNodes() ) {
                dom.traverse( node.childNodes, cb );
            }
        }
    }
};

export { uniqueId, currentScript, extract, features, dom };
