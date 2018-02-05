import Promise from '@lvchengbin/promise';
import is from '@lvchengbin/is';
import { extract } from '../utils';

class Message {
    constructor( options = {} ) {
        Object.assign( this, options );
    }
    reply( data ) {
        return this.resolver( data );
    }
    forward( to, body ) {
        this.package.$message( to, this.subject, body || this.body ).then( response => {
            this.resolver( response );
        } ).catch( e => {
            this.rejector( e );
        } );
    }
}

 J.prototype.$message = function( to, subject, body, from ) {
    if( !to ) {
        throw new TypeError( `[J Message] Unexpected recipient: "${to}".` )
    }

    is.string( to ) && ( to = this.$find( to ) );

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
            execute( rule, this, message );
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

    let match = false, action, forward;

    /*
    if( !is.empty( rule.form ) ) {
        is.string( rule.from ) ? [ rule.from ] : rule.from;

        for( let item of from ) {
            if( item
            if( item === '@root' ) {

            }
        }
    }
    */


    if( is.regexp( rule.path ) ) {
        const matches = rule.path.exec( ename );

        if( matches ) {
            match = true;
            const replace = ( m, n ) => matches[ n ];

            if( is.string( rule.action ) ) {
                action = rule.action.replace( /\$(\d+)/g, replace );
                action = extract( action, pkg, '/' );
            } else if( is.function( rule.action ) ) {
                action = rule.action;
            }

        }
    } else if( is.string( rule.path ) ) {
        if( rule.path === ename ) {
            match = true;
            action = extract( rule.action, pkg, '/' );
        }
    }

    if( !match ) {
        action = extract( ename, pkg, '/' );
    }

    if( is.function( action ) ) {
        action.call( this, body, message );
    }

    if( match && rule.forward ) {
        let args;

        forward = is.string( rule.forward ) ? pkg.$find( rule.forward ) : rule.forward;
        if( !forward ) {
            return ;
        }
        if( is.function( rule.preprocess ) ) {
            args = rule.preprocess.call( this, message );
        }
        if( args !== false ) {
            forward.emit( 'j://message', message );
        }
    }
}
