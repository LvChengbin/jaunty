const check = require( 'check-types' )
const querystring = require( 'querystring' )
const request = require( 'request' )
const Handler = require( './handler' )
const app = require( './app' );

module.exports = {

    /**
     * request - processing a normal request
     */
    request( uri, options = {}, action = null ) {
        return new Handler( uri, Object.assign( options, {
            method : 'all'
        } ), action )
    },

    /**
     * get - add a get request listening of expressjs
     *
     * get( '/index.html', {}, () => {} )
     */
    get( ...args ) {
        return new Handler( ...args )
    },

    /**
     * post
     */
    post( uri, options = {}, action = null ) {
        return new Handler( uri, Object.assign( options, {
            method : 'all'
        } ), action )
    },

    /**
     * forward - forward a request, from the client, to another url
     */
    forward( uri, options = {}, action = null ) {
        return new Handler( uri, options, function() {
            const { req, res } = this;
            
            const dest = this.dest + ( this.keepPath ? req.path : '' );

            const url = [
                dest.replace( /[&?]+$/g, '' ),
                querystring.stringify( req.query )
            ].join( dest.includes( '?' ) ? '&' : '?' );

            const options = {
                form : req.body,
                headers : {
                    cookie : req.headers.cookie,
                    'User-Agent' : req.headers[ 'user-agent' ],
                    'x-forward-for' : req.ip
                }
            }

            request[ req.method.toLowerCase() ]( url, options, ( err, response, body ) => {
                if( err ) {
                    console.warn( err, response )
                    return;
                }
                
                for( let item in response.headers ) {
                    res.append( item, response.headers[ item ] )
                }

                if( check.function( action ) ) {
                    return action.call( this )
                }

                return err || body;
            } );

        } )
    },

    /**
     * page
     */
    page( ...args ) {
        return new Handler( ...args );
    },

    jsonp( uri, options = {}, action = null ) {
        check.function( options ) && ( [ action, options ] = [ options, {} ] )
        return new Handler( uri, options, function( req, res ) {
            this.header( 'Content-Type', 'application/javascript' );
            if( check.function( action ) ) {
                const response = action.call( this, req, res ); 

                if( response ) {
                    const callback = req.query.callback || 'callback';
                    return `${callback}(${JSON.stringify( response )})`;
                }
            }
        } );
    },

    start( config ) {
        app( config || require( './config' ) );
    }
}
