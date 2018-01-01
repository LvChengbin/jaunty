import { traverse } from '../compile';
import { slice } from '../../../variables';

function getTop( node ) {
    let y = 0;
    while( node ) {
        y += node.offsetTop || 0;
        node = node.offsetParent;
    }
    return y;
}

function remove( view, node ) {
    const frag = document.createDocumentFragment();
    while( node.childNodes.length ) {
        frag.appendChild( node.childNodes[ 0 ] );
    }
    node.$lazyFrag = frag;
    //node.$options.skip = true;
}

function show( view, node ) {
    const scope = node.$scope;
    const options = node.$options;
    options.skip = false;
    traverse( slice.call( node.$lazyFrag.childNodes ), view, scope, options );
    node.innerHTML = '';
    node.appendChild( node.$lazyFrag );
}

const handlers = [];

let timeout = null;

const onscroll = () => {
    if( timeout ) return;
    timeout = setTimeout( () => {
        for( let i = 0, l = handlers.length; i < l; i += 1 ) {
            if( handlers[ i ] ) {
                handlers[ i ]( i );
            } else {
                handlers.splice( i--, 1 );
                l--;
            }
        }
        timeout = null;
    }, 30 );
};
window.addEventListener( 'scroll', onscroll, { passive : true } );
window.addEventListener( 'resize', onscroll, { passive : true } );

export default {
    bind( directive, node ) {
        node.$originalNode || ( node.$originalNode = node.cloneNode( true ) );
        node.$$lazy = true;
    },
    compile( directive, node, view ) {

        const dis = +node.getAttribute( ':lazy' ) || 100;
        node.removeAttribute( ':lazy' );

        let interval = null;
        let shown = false;

        const handler = () => {
            const y = getTop( node );
            const scrollTop = window.scrollY || window.pageYOffset || document.body.scrollTop + ( document.documentElement && document.documentElement.scrollTop || 0 );

            if( y - scrollTop - window.innerHeight < dis ) {
                shown = true;
                show( view, node );
                handlers[ handlers.indexOf( handler ) ] = null;
            }
        };

        handlers.push( handler );
        interval = setInterval( () => {
            if( shown || document.body.contains( node ) ) {
                clearTimeout( interval );
                shown || handler();
            }
        }, 30 );
        remove( view, node );
    }
};
