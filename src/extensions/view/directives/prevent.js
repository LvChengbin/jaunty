export default {
    compile( directive, node ) {
        const value = directive.value;
        const tag = node.tagName;
        node.removeAttribute( directive.name );

        let events = [];
        if( value.trim() ) {
            events = value.split( ',' );
        } else {
            switch( tag ) {
                case 'A' :
                case 'BUTTON' :
                    events = [ 'click' ];
                    break;
                case 'INPUT' :
                    var inputType = node.type;
                    if( inputType === 'button' || inputType === 'submit' ) {
                        events = [ 'click' ];
                    }
                    break;
                case 'FORM' :
                    events = [ 'submit' ];
                    break;
            }
        }

        for( let i = 0, l = events.length; i < l; i = i + 1 ) {
            const ev = events[ i ];
            if( ev === 'enter' ) {
                node.addEventListener( 'keydown', e => {
                    e.keyCode === 13 && e.preventDefault();
                }, false );
            } else {
                node.addEventListener( ev, e => e.preventDefault(), false );
            }
        }
    }
};
