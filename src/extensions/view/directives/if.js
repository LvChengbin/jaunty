import { Record } from '../../utils';
import { checks } from '../../../core/utils';
import { interpolation, replaceNode, createAnchor } from '../utils';
import { traverse } from '../compile';
import { getKeys } from '../../../variables';
function fail( view, node, f ) {
    const options = node.$options;
    const scope = node.$scope;
    const anchor = createAnchor( '', scope, options ); 

    function handler() {
        Record.start( anchor, anchor.$eventMarks, handler );
        if( f( scope ) ) {
            options.skip = false;
            const newNode = anchor.$originalNode.cloneNode( true );

            /**
             * replace node before traverse so that the "newNode" will be put in
             * node tree, some directive maybe want to replace it with another node
             */
            replaceNode( newNode, anchor );
            traverse( [ newNode ], view, scope, options );
            node.$originalNode = anchor.$originalNode;
            if( anchor.$forAnchor ) {
                newNode.$forAnchor = anchor.$forAnchor;
                anchor.$forAnchor.$items[ anchor.$forPosition ] = newNode;
            }
        }
        Record.reset();
    }

    options.once || handler();

    anchor.$originalNode = node.$originalNode;
    options.skip = true;
    replaceNode( anchor, node );
    if( node.$forAnchor ) {
        const forItems = node.$forAnchor.$items;
        anchor.$forAnchor = node.$forAnchor;
        const keys = getKeys( forItems );
        for( let i = 0, l = keys.length; i < l; i = i + 1 ) {
            if( forItems[ keys[ i ] ] === node ) {
                forItems[ anchor.$forPosition = keys[ i ] ] = anchor;
                break;
            }
        }
    }
}

export default {
    bind( directive, node ) {
        node.$originalNode || ( node.$originalNode = node.cloneNode( true ) );
        node.$$if = true;
        let next = node.nextElementSibling;
        const stack = [ '!(' + directive.value + ')' ];

        while( next && next.hasAttribute( ':elseif' ) ) {
            const exp = next.getAttribute( ':elseif' );
            next.setAttribute( ':if', stack.join( '&&' ) + '&& (' + exp + ')' );
            stack.push( '!(' + exp + ')' );
            next.removeAttribute( ':elseif' );
            next = next.nextElementSibling;
        }
        if( next && next.hasAttribute( ':else' ) ) {
            next.removeAttribute( ':else' );
            next.setAttribute( ':if', stack.join( '&&' ) );
        }
    },
    compile( directive, node, view ) {
        const value = directive.value;
        const scope = node.$scope;
        const f = interpolation( value );
        const style = node.style;
        const display = style.display;
        node.removeAttribute( ':if' );
        let remove = true;

        if ( node.hasAttribute( 'if-remove' ) ) {
            if( checks.false( node.getAttribute( 'if-remove' ) ) ) {
                remove = false;
            }
        }

        if( !node.$options.once ) {
            Record.start( node, node.$eventMarks[ ':if' ], function() {
                if( remove ) {
                    f( scope ) || fail( view, node, f );
                    return;
                }
                style.display = f( scope ) ? display : 'none';
            } );
        }
        f( scope ) || fail( view, node, f );
        Record.reset();
    }
};
