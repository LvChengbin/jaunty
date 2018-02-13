import Promise from '@lvchengbin/promise';
import is from '@lvchengbin/is';
import { extract } from '../../utils';
import J from '../../j';
import Message from './message';

/**
 * @method $message
 * To send a "j://message" message to the specified package(s)
 *
 * @param {Package} to The recipient of the message.
 * @param {String} subject The subject of the message.
 * @param {*} body Message body.
 * @param {Package} [from=this] The sender.
 */
J.prototype.$message = function( to, subject, body, from ) {
    if( !to ) {
        throw new TypeError( `Unexpected recipient: "${to}".` );
    }

    is.string( to ) && ( to = this.$find( to ) );

    if( !to ) {
        throw new TypeError( `Cannot find the recipient "${to}".` );
    }

    return new Promise( ( resolve, reject ) => {
        to.emit( 'j://message', new Message( {
            from : from || this,
            subject,
            body,
            resolver : resolve,
            rejector : reject,
            package : this
        } ) );
    } );
};

J.prototype.__initMessageMessage = function() {
    const handler =  message => {
        const rules = this.rules || [];
        for( let rule of rules ) {
            execute( rule, message, this );
        }
    };

    this.on( 'j://message', handler );

    this.once( 'destruct', () => {
        this.removeListener( 'j://message', handler );
    } );
};

function execute( rule, message, pkg ) {
    const { subject, body } = message;
    const ename = 'message/' + subject;

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
        action = extract( 'messages/' + subject, pkg, '/' );
    }

    if( is.function( action ) ) {
        action.call( pkg, body, message, pkg );
    }

    if( match && rule.forward ) {
        let args;

        const forward = is.string( rule.forward ) ? pkg.$find( rule.forward ) : rule.forward;
        if( !forward ) {
            return ;
        }
        if( is.function( rule.preprocess ) ) {
            args = rule.preprocess.call( pkg, message );
        }
        if( args !== false ) {
            forward.$emit( 'j://message', message );
        }
    }
}
