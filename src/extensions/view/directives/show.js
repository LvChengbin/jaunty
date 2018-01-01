import { Record } from '../../utils';
import { interpolation } from '../utils';

export default {
    bind( directive, node ) {
        let next = node.nextElementSibling;
        const stack = [ '!(' + directive.value + ')' ];

        while( next && next.hasAttribute( ':elseshow' ) ) {
            const exp = next.getAttribute( ':elseshow' );
            next.setAttribute( ':show', stack.join( '&&' ) + '&& (' + exp + ')' );
            stack.push( '!(' + exp + ')' );
            next.removeAttribute( ':elseshow' );
            next = next.nextElementSibling;
        }
        if( next && next.hasAttribute( ':else' ) ) {
            next.removeAttribute( ':else' );
            next.setAttribute( ':show', stack.join( '&&' ) );
        }
    },
    compile( directive, node ) {
        const value = directive.value;
        const scope = node.$scope;
        const f = interpolation( value );
        const style = node.style;
        const display = style.display;
        node.removeAttribute( directive.name );

        function handler() {
            Record.start( node, node.$eventMarks[ ':show' ], handler );
            style.display = f( scope ) ? display : 'none'; 
            Record.reset();
        }

        if( node.$options.once ) {
            style.display = f( scope ) ? display : 'none';
        } else {
            handler();
        }
    }
};
