import { interpolation } from '../utils';
export default {
    compile( directive, node ) {
        interpolation( directive.value )( node.$scope );
        node.removeAttribute( directive.name );
    }
};
