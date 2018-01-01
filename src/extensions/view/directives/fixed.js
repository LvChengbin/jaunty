import { Record } from '../../utils';
import { interpolation } from '../utils';
import { nodePosition } from '../../ui';

function fix( node, l, t ) {
    const style = node.style;
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const { x, y } = nodePosition( node );
    const holder = document.createElement( 'div' );

    holder.style.width = w + 'px';
    holder.style.height = h + 'px';
    style.position = 'fixed';
    style.left = ( l === null ? ( x + 'px' ) : ( l + 'px' ) );
    style.top = ( t === null ? ( y + 'px' ) : ( t + 'px' ) );
    style.width = w + 'px';
    style.height = h + 'px';
    node.$holder = holder;
    
    node.parentNode.insertBefore( holder, node );
}

export default {
    compile( directive, node ) {
        const value = directive.value;
        const f = interpolation( value );
        const style = node.style;
        const cssText = style.cssText;
        const l = node.getAttribute( 'fixed-left' );
        const t = node.getAttribute( 'fixed-top' );
        node.removeAttribute( 'fixed-left' );
        node.removeAttribute( 'fixed-top' );

        node.removeAttribute( directive.name );

        if( !value ) {
            let startScoll = false;
            let fixed = false;
            let pos = null;
            let timer = null;
            window.addEventListener( 'scroll', () => {
                if( !startScoll && !fixed ) {
                    pos = nodePosition( node );
                    startScoll = true;
                }

                timer && clearTimeout( timer );
                timer = setTimeout( () => {
                    startScoll = false;
                }, 100 );

                const scrollTop = document.body.scrollTop;

                if( pos.y <= scrollTop + ( +t || 0 ) ) {
                    if( fixed ) return;
                    fixed = true;
                    fix( node, +l, +t || 0 );
                } else {
                    if( !fixed ) return;
                    fixed = false;
                    node.$holder && node.parentNode.removeChild( node.$holder );
                    style.cssText = cssText;
                }
            }, { passive : true } );
            return;
        } 

        if( !node.$options.once ) {
            const handler = function() {
                if( f( node.$scope ) ) {
                    fix( node, +l, +t );
                } else {
                    node.$holder && node.parentNode.removeChild( node.$holder );
                    style.cssText = cssText;
                }
            };
            Record.start( node, node.$eventMarks[ ':fixed' ], handler );
            handler();
            Record.reset();
        }
    }
};
