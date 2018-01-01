const events = {
    enter : ( node, func ) => {
        node.addEventListener( 'keydown', e => {
            e.keyCode === 13 && func( e );
        } );
    },
    esc : ( node, func ) => {
        node.addEventListener( 'keydown', e => {
            e.keyCode === 27 && func( e );
        } );
    }
};

export default events;
