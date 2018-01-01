import { checks } from './utils.js';

class EventCenter {
    constructor() {
        this.__listeners = {};
    }
    $on( evt, handler ) {
        const listeners = this.__listeners;
        listeners[ evt ] ? listeners[ evt ].push( handler ) : ( listeners[ evt ] = [ handler ] );
        return this;
    }

    $once( evt, handler ) {
        const _handler = ( ...args ) => {
            handler.apply( this, args );
            this.$off( evt, _handler );
        };
        return this.$on( evt, _handler );
    }

    $off( evt, handler ) {
        var listeners = this.__listeners,
            handlers = listeners[ evt ];

        if( !handlers || ! handlers.length ) {
            return this;
        }

        for( let i = 0; i < handlers.length; i += 1 ) {
            handlers[ i ] === handler && ( handlers[ i ] = null );
        }

        setTimeout( () => {
            for( let i = 0; i < handlers.length; i += 1 ) {
                handlers[ i ] || handlers.splice( i--, 1 );
            }
        }, 0 );

        return this;
    }

    $trigger( evt, ...data ) {
        this.$strigger( evt, ...data );
        const func = this[ 'on' + evt ];
        checks.function( func ) && func.call( this, ...data );
        return this;
    }

    $strigger( evt, ...args ) {
        const handlers = this.__listeners[ evt ];
        if( handlers ) {
            for( let i = 0, l = handlers.length; i < l; i += 1 ) {
                handlers[ i ] && handlers[ i ]( ...args );
            }
        }
        return this;
    }

    $removeListeners( checker ) {
        const listeners = this.__listeners;
        for( let attr in listeners ) {
            if( checker( attr ) ) {
                listeners[ attr ] = null;
                delete listeners[ attr ];
            }
        }
    }
}
export default EventCenter;
