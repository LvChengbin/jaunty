import { expression } from '../utils';
import { pushState } from '../../../history';

export default {
    compile( directive, node ) {
        const scope = node.$scope;
        const state = directive.value || null; 
        const url = node.getAttribute( 'state-url' ) || null;
        const title = node.getAttribute( 'state-title' ) || '';

        let fState = state ? expression( state ) : () => null;
        let fURL = url ? expression( url ) : null;
        let fTitle = title ? expression( title ) : () => null;

        node.removeAttribute( directive.name );
        node.removeAttribute( 'state-url' );
        node.removeAttribute( 'state-title' );

        node.addEventListener( 'click', e => {
            const url = fURL ? fURL( scope ) : ( node.href || '' );
            if( !history.pushState ) {
                if( !node.href ) {
                    node.href = url;
                }
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            const state = fState( scope );
            pushState( state, fTitle( scope ), url );
        } );
    }
};
