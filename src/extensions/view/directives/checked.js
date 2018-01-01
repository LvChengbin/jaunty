import { Record } from '../../utils';
import { interpolation } from '../utils';

export default {
    compile( directive, node ) {
        const value = directive.value;  
        const scope = node.$scope;
        const f = interpolation( value );

        if( !node.$options.once ) {
            const handler = function() {
                node.checked = f( scope );
            };

            Record.start( node, node.$eventMarks[ ':checked' ], handler );
            handler();
            Record.reset();
        }
    }
};
