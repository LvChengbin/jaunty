export default {
    compile( directive, node ) {
        node.removeAttribute( directive.name );
        node.$options.once = true;
    }
};
