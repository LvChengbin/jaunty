export default {
    bind( directive, node, view ) {
        node.removeAttribute( directive.name );
        node.$refNode = view.__templates[ directive.value ];
    }
};
