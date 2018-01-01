import { Record } from '../../utils';
import { interpolation } from '../utils';

export default {
    compile( directive, node ) {
        const scope = node.$scope;
        const options = node.$options;
        const f = interpolation( directive.value );

        node.removeAttribute( directive.name );

        if( !options.once ) {
            Record.start( node, node.$eventMarks[ ':html' ], function() {
                const content = f( scope );
                if( node.innerHTML === content ) return;
                node.innerHTML = content;
            } );
        }
        node.innerHTML = f( scope );
        Record.reset();
        options.pre = !node.hasAttribute( 'html-parse' );
    }
};
