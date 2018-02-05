import is from '@lvchengbin/is';

import { createAnchor, removeNode } from '../utils';
import { traverse } from '../compile';
import ec from '../../../eventcenter';

const sp = '!!!!!';

function test( rule, str ) {
    const f = rule.charAt( 0 );
    const l = rule.charAt( rule.length - 1 );

    switch( f + l ) {
        case '//' :
            return new RegExp( rule.slice( 1, -1 ) ).test( str );
        case '[]' :
            return str.indexOf( rule.slice( 1, -1 ) ) > -1;
        default :
            return rule === str;
    }
}

function createTest( rule ) {
    if( rule.indexOf( sp ) < 0 ) {
        return str => test( rule, str );
    }
    return str => {
        const list = rule.split( sp );
        const last = list.pop();
        for( let item of list ) {
            if( test( item, str ) ) {
                return false;
            }
        }
        return last ? test( last, str ) : true;
    };
}

export default {
    bind( directive, node ) {
        node.$originalNode || ( node.$originalNode = node.cloneNode( true ) );
        node.$$router = true;
        let next = node.nextElementSibling;
        const stack = [ directive.value ];

        while( next && next.hasAttribute( ':elserouter' ) ) {
            const exp = next.getAttribute( ':elserouter' );
            next.setAttribute( ':router', stack.join( sp ) + sp + exp );
            stack.push( exp );
            next.removeAttribute( ':elserouter' );
            next = next.nextElementSibling;
        }
        if( next && next.hasAttribute( ':routerelse' ) ) {
            next.removeAttribute( ':routerelse' );
            next.setAttribute( ':router', stack.join( sp ) + sp );
        }
    },
    compile( directive, node, view ) {
        const value = directive.value;
        const scope = node.$scope;
        const options = node.$options;
        const originalOptions = Object.assign( {}, options );
        const test = createTest( value );
        const style = node.style;
        const display = style.display;
        const anchor = createAnchor( '', scope, originalOptions );
        const parentNode = node.parentNode;

        options.skip = true;

        anchor.$originalNode = node.$originalNode;
        anchor.$originalNode.removeAttribute( ':router' );
        anchor.$node = null;

        let remove = true;
        if ( anchor.$originalNode.hasAttribute( 'router-remove' ) ) {
            if( is.false( anchor.$originalNode.getAttribute( 'router-remove' ) ) ) {
                remove = false;
            }
        }

        parentNode.replaceChild( anchor, node );

        const handler = function() {
            const location = window.location;
            if( test( location.pathname + location.search ) ) {
                if( anchor.$node ) {
                    remove || ( anchor.$node.style.display = display );
                } else {
                    const node = anchor.$originalNode.cloneNode( true );
                    traverse( [ node ], view, scope, originalOptions );
                    anchor.$node = node;
                    parentNode.insertBefore( node, anchor );
                }
            } else {
                if( remove ) {
                    if( anchor.$node ) {
                        removeNode( anchor.$node, parentNode );
                    }
                    anchor.$node = null;
                    return;
                }
                if( anchor.$node ) {
                    anchor.$node.style.display = 'none';
                }
            }
        };

        ec.$on( 'routechange', handler );

        /**
         * Remove bound event while the node being removed from the dom tree
         */
        anchor.$ec.$on( 'remove', () => {
            ec.$removeListener( 'routechange', handler );
        } );
        handler();
    }
};
