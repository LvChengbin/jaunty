import { uniqueId } from '../../../core/utils';
import { Record } from '../../utils';
import { interpolation } from '../utils';
import { observer } from '../../observer';

export default {
    compile( directive, node ) {
        const scope = node.$scope;
        const pos = directive.value.indexOf( '=' );

        let varName, varVal;

        if( pos < 0 ) {
            varName = directive.value;
            varVal = 'undefined';
        } else {
            varName = directive.value.substr( 0, pos ).trim();
            varVal = directive.value.substr( pos + 1 ).trim();
        }

        const f = interpolation( varVal );

        const subscope = {};
        if( !node.$options.once ) {
            Record.start( node, node.$eventMarks[ ':var' ], function() {
                node.$scope[ varName ] = f( scope );
            } );
        }
        subscope[ varName ] = f( scope );
        Record.reset();
        node.$scope = observer( subscope, uniqueId(), scope );
        node.removeAttribute( directive.name );
    }
};
