import EventCenter from '../core/eventcenter';
const eventcenter = new EventCenter();

const Record = {
    node : null,
    handler : null,
    events : {},
    set( path ) {
        if( this.events[ path ] ) return;
        this.events[ path ] = true;
        eventcenter.$on( path, this.handler );
        this.handler && this.node.$events.push( [ path, this.handler ] );
    },
    reset() {
        this.node = null;
        this.handler = null;
        this.events = null;
    },
    start( node, events, handler ) {
        this.node = node;
        this.events = events;
        this.handler = handler;
    }
};

function getDataByPath( src, path ) {
    return new Function( 's', 'try{with(s)return ' + path + '}catch(e){window.console.warn("[J WARN] getDataByPath : " + e)}' )( src );
}

const inCache = {};

// expression without {{ }}
function expression( str ) {
    if( inCache[ str ] ) return inCache[ str ];
    const args = [ 's', ...Array.prototype.splice.call( arguments, 1 ) ];
    return ( inCache[ str ] = new Function( ...args, 'try{with(s)return ' + str + '}catch(e){window.console.warn("[J WARN] extension : " +e);return null}' ) );
}

export { eventcenter, Record, getDataByPath, expression };
