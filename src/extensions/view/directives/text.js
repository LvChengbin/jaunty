import { Record } from '../../utils';
import { interpolation } from '../utils';

export default {
    compile( directive, node ) {
        const scope = node.$scope;
        const options = node.$options;
        const f = interpolation( directive.value );

        node.removeAttribute( directive.name );

        if( !options.once ) {
            Record.start( node, node.$eventMarks[ ':text' ], function() {
                const content = f( scope );
                if( node.textContent === content ) return;
                node.textContent = content;
            } );
        }
        node.textContent = f( scope );
        Record.reset();
    }
};
