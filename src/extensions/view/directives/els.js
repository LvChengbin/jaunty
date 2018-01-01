export default {
    compile( directive, node, view ) {
        const value = directive.value;
        node.removeAttribute( directive.name );
        view.$els[ value ] = node;
    }
};
