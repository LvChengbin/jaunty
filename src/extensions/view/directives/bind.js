export default {
    bind( directive, node ) {
        if( node.nodeName !== 'FORM' ) {
            console.error( 'Directive :bind must be used to a FORM element' );
        }
    },

    compile( directive, node, view ) {
    }
};
