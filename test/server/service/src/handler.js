/**
 * The basic handler of each request
 */
const check = require( 'check-types' )

const app = require( './app' );

/**
 * Basic request handler
 */
module.exports = class {
    /**
     * constructor - constructor of handler
     *
     * new Handler( string uri, object options, function action )
     *
     * @param uri string - the uri of the listening request. eg. /index.html
     * @param options object
     * @param action function
     *
     * new Handler( string uir, function action )
     *
     * @param uri stirng
     * @param action function
     */
    constructor( uri, options = {}, action = null ) {
        const instance = app()

        Object.assign( this, {
            instance, 
            req : null,
            res : null,
            session : null
        } )

        check.function( options ) && ( [ action, options ] = [ options, {} ] )

        Object.assign( this, options )

        instance[ ( options.method || 'get' ).toLowerCase() ]( uri, ( req, res ) => {
            this.req = req
            this.res = res
            if( check.function( action ) ) {
                const response = action.call( this, req, res ) 
                if( check ) {
                    return res.send( response )
                }
            }
        } )

    }

    render( template, vars = {} ) {
        this.res.render( template, vars )
    }

    send( data ) {
        this.res.send( data )
    }

    header( key, value ) {
        this.res.append( key, value );
    }
}
