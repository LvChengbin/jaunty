import { expression } from '../utils';
import { request } from '../../../core/http';
import { checks, uniqueId } from '../../../core/utils';
import { observer } from '../../observer';
import Model from '../../model';

export default {
    compile( directive, node, view ) {
        const variable = directive.value || 'data';
        const scope = node.$scope;
        const model = node.getAttribute( 'data-model' );
        const url = node.getAttribute( 'data-url' );
        const pkg = node.getAttribute( 'data-package' );
        //const delay = node.getAttribute( 'data-render-delay' );

        node.removeAttribute( directive.name );
        node.removeAttribute( 'data-url' );
        node.removeAttribute( 'data-model' );
        node.removeAttribute( 'data-package' );

        if( !url && !model && !pkg) return false;

        view.$assign( view, { [ variable ] : null } );

        let params = {};

        const attrs = node.attributes; 

        for( let i = attrs.length - 1; i >= 0; i-- ) {
            const item = attrs[ i ];
            const name = item.name;
            const match = name.match( /^data-param-(.*)$/ );
            if( match ) {
                if( !item.value ) {
                    params[ match[ 1 ] ] = null;
                    continue;
                }
                const f = expression( item.value );
                params[ match[ 1 ] ] = f( scope );
            }
        }

        const limited = checks.false( node.getAttribute( 'data-global' ) );

        if( limited ) {
            node.$scope = observer( { [ variable ] : null }, uniqueId(), scope );
        }

        if( url ) {
            const req = request( expression( url )( scope ), params );
            if( limited ) {
                req.then( response => {
                    node.$scope[ variable ] = response;
                } );
            } else {
                view.$bind( variable, req );
            }
        } else if( pkg ) {
            const name = node.getAttribute( 'data-name' ) || '$__datainview.package$' + uniqueId();
            view.$package.$mount( name, pkg, params ).then( p => {
                const data = p[ node.getAttribute( 'data-expose-method' ) || 'expose' ]();
                if( data instanceof Model ) {
                    node.$scope[ variable ] = data.$data;
                }
            } );
        } else if( model ) {
            if( limited ) {
                const name = '$__modelinview.model$' + uniqueId();
                view.$bind( name, view.$package.$install( name, model, params ) ).then( () => {
                    node.$scope[ variable ] = view[ name ];
                } );
                node.$scope[ variable ] = view[ name ];
            } else {
                const name = node.getAttribute( 'data-name' ) || ( '__modelinview.model$' + uniqueId() );
                view.$bind( variable, view.$package.$install( name, model, params ) );
            }
        }
    }
};
