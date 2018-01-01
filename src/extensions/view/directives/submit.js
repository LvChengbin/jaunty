function getForm( node ) {
    while( node && node.nodeName !== 'FORM' ) {
        node = node.parentNode;
    }
    return node;
}

export default {
    compile( directive, node ) {
        const form = getForm( node );
        const button = document.createElement( 'input' );
        button.type = 'submit';
        button.setAttribute( 'hidden', true );
        button.setAttribute( 'style', 'display : none !important;' );
        form.appendChild( button );
        node.addEventListener( 'click', ( e ) => {
            e.preventDefault();
            button.click();
        } );
    }
};
