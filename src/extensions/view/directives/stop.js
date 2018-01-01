export default {
    compile( directive, node ) {
        const value = directive.value;
        let events = value.trim() ? value.split( ',' ) : [ 'click' ];
        node.removeAttribute( directive.name );
        for( let i = 0, l = events.length; i < l; i = i + 1 ) {
            node.addEventListener( events[ i ], e => e.stopPropagation(), false );
        }
    }
};
