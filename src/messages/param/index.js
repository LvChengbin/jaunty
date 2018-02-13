import is from '@lvchengbin/is';
import { extract } from '../../utils';
import J from '../../j';
import Param from './param';

/**
 * @method $param
 * To send a "j://param" message to the specified package(s)
 *
 * @param {Package|Array.<Package>} to The recipients of the message.
 * @param {String} name The name of the changed param.
 * @param {*} value The new value of the changed param.
 * @param {Package} [from=this] The sender of the message.
 */
J.prototype.$param = function( to, name, value, from ) {
    if( is.empty( to ) ) {
        throw new TypeError( `[J Message] Unexpected recipient: "${to}".` );
    }

    from || ( from = this );
    is.array( to ) || ( to = [ to ] );

    for( let item of to ) {
        const recipient = is.string( item ) ? this.$find( item ) : item;
        if( !recipient ) {
            throw new TypeError( `Cannot find the recipent "${item}".` );
        }
        recipient.$emit( 'j://param', new Param( { name, value, from } ) );
    }
};

J.prototype.__initMessageParam = function() {
    const handler = message => {
        const rules = this.rules || [];
        for( let rule of rules ) {
            execute( rule, message, this );
        }
    };

    this.on( 'j://param', handler );
    
    this.once( 'destruct', () => {
        this.removeListener( 'j://param', handler );
    } );
};

function execute( rule, message, pkg ) {
    const { name, value } = message;
    const ename = 'param/' + name;

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
            } else {
                action = rule.action;
            }
        }
    }

    if( !match ) {
        action = extract( 'params/' + name, pkg, '/' );
    }

    if( is.function( action ) ) {
        action.call( pkg, value, message, pkg );
    }

    if( match && rule.forward ) {
        let args;

        const forward = is.string( rule.forward ) ? pkg.$find( rule.forward ) : rule.forward;

        if( !forward ) return;

        if( is.function( rule.preprocess ) ) {
            args = rule.preprocess.call( pkg, message );
        }

        if( args !== false ) {
            forward.$emit( 'j://param', message );
        }
    }
}
