import is from '@lvchengbin/is';
import J from '../j';

class Event {
    constructor( options = {} ) {
        Object.assign( this, options );
        this.stopped = false;
    }
    stop() {
        this.stopped = true;
    }
}

J.prototype.$unicast = function( to, subject, body, from ) {
    from || ( from = this );
    is.array( to ) || ( to = [ to ] );
    for( let i = 0, l = to.length; i < l; i += 1 ) {
        const item = is.string( to[ i ] ) ? this.$find( to[ i ] ) : to[ i ];
        item && item.$emit( 'j://event', new Event( { from, subject, body } ) );
    }
};

J.prototype.$bubble = function( subject, body, from ) {
    from || ( from = this );
    let pkg = this;
    while( pkg ) {

        const event = new Event( { from, subject, body } );

        pkg.$emit( 'j://event', event );
        if( event.stopped || pkg === pkg.$root ) break;
        pkg = pkg.$root;
    }
};

J.prototype.$broadcast = function( subject, body ) {
    if( this.$root !== this ) {
        this.$unicast( this.$root, subject, body );
    }
    this.$root.$multicast( subject, body, true, this );
};

J.prototype.$multicast = function( subject, body, deep, from ) {
    from || ( from = this );
    const children = this.$children;
    for( let name in children ) {
        const child = children[ name ];
        this.$unicast( child, subject, body, from );
        deep && child.$multicast( subject, body, deep, from );
    }
};

J.prototype.__initEventMessage = function() {
    const handler = message => {
        const rules = this.rules || [];

        for( let rule of rules ) {
            execute( rule, this, message );
        }
    };

    this.on( 'j://event', handler );

    this.once( 'destruct', () => {
        this.removeListener( 'j://event', handler );
    } );
};

function execute() {
}
