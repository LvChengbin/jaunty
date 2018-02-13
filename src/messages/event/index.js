/**
 * @file Code for "j://event" message.
 * @author LvChengbin 
 */

import is from '@lvchengbin/is';
import { extract } from '../../utils';
import J from '../../j';
import Event from './event';

/**
 * @method $unicast
 * To send a "j://event" message to the specified pacakge(s)
 *
 * @param {Package|Array.<Package>} to The recipients of the message.
 * @param {String} subject The subject of the message
 * @param {*} body The body of the message
 * @param {Package} [from=this] The sender of the message
 */
J.prototype.$unicast = function( to, subject, body, from ) {
    if( is.empty( to ) ) {
        throw new TypeError( `[J Event] Unexpected recipient: "${to}".` );
    }

    from || ( from = this );
    is.array( to ) || ( to = [ to ] );

    for( let item of to ) {
        const recipient = is.string( item ) ? this.$find( item ) : item;
        if( !recipient ) {
            throw new TypeError( `Cannot find the recipient "${item}".` );
        }
        recipient.$emit( 'j://event', new Event( { from, subject, body } ) );
    }
};

/**
 * @method $bubble
 * To send a message to all packages above current package until one of recipients called the "stop" method or reached the "root" package.
 *
 * @param {String} subject The subject of the message.
 * @param {*} body The body of the message.
 * @param {Package} [from=this] The send of the message.
 */
J.prototype.$bubble = function( subject, body, from ) {
    from || ( from = this );
    let pkg = this.$parent;

    const message = new Event( { subject, body, from } );

    while( pkg ) {
        pkg.$emit( 'j://event', message );
        if( message.stopped ) break;
        pkg = pkg.$parent;
    }
};

/**
 * @method $broadcast
 * To send "j://event" message to every package in the package tree except the current package itself.
 *
 * @param {String} subject The subject of the message.
 * @param {*} body The body of the message.
 */
J.prototype.$broadcast = function( subject, body ) {
    this.$unicast( this.$root, subject, body );
    this.$root.$multicast( subject, body, true, this );
};

/**
 * @method $multicast
 *
 * To send "j://event" message to all child packages or all descendant packages
 *
 * @param {String} subject The subject of the message
 * @param {*} body The body of the message
 * @param {Boolean} [deep] To send the message to descendant packages or not.
 * @param {Package} [from = this] The sender of the message
 */
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
            execute( rule, message, this );
        }
    };

    this.on( 'j://event', handler );

    this.once( 'destruct', () => {
        this.removeListener( 'j://event', handler );
    } );
};

function execute( rule, message, pkg ) {
    const { subject, body } = message;
    const ename = 'event/' + subject;

    let match = false, action;

    if( is.regexp( rule.path ) ) {
        const matches = rule.path.exec( ename );

        if( matches ) {
            match = true;
            if( is.string( rule.action ) ) {
                action = rule.action.replace( /\$(\d+)/g, ( m, n ) => matches[ n ] );
                action = extract( action, pkg );
            } else if( is.function( rule.action ) ) {
                action = rule.action;
            }

        }
    } else if( is.string( rule.path ) ) {
        if( rule.path === ename ) {
            match = true;
            if( is.string( rule.action ) ) {
                action = extract( rule.action, pkg );
            } else if( is.function( rule.action ) ) {
                action = rule.action;
            }
        }
    }

    if( !match ) {
        action = extract( 'events/' + subject, pkg, '/' );
    }

    if( is.function( action ) ) {
        action.call( pkg, body, message );
    }

    if( match && rule.forward ) {
        let args;

        const forward = is.string( rule.forward ) ? pkg.$find( rule.forward ) : rule.forward;
        if( !forward ) {
            return ;
        }
        if( is.function( rule.preprocess ) ) {
            args = rule.preprocess.call( this, message );
        }
        if( args !== false ) {
            forward.emit( 'j://event', message );
        }
    }
}
