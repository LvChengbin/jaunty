const express = require( 'express' )
const ejs = require( 'ejs' )
const bodyparser = require( 'body-parser' )

let instance = null;

/**
 * Create http service with Express
 * @see https://expressjs.com
 */

module.exports = function app( config ) {
    if( instance ) {
        if( config ) {
            console.warn( 'Application has already created before this execution. Configuration cannot be set after the application created.' );
        }
        return instance;
    }

    instance = express();

    let {
        port = 8888,
        stc,
        settings = {}
    } = ( config || {} );
    
    stc && instance.use( '/', express.static( stc.root, stc.options || {} ) )
    instance.use( bodyparser.urlencoded( { extended : true } ) )
    instance.use( bodyparser.json() )

    for( const item in settings ) {
        instance.set( item, settings[ item ] )
    }

    instance.engine( 'html', ejs.renderFile )
    instance.listen( port );

    console.log( `Listening ${port}` );

    return instance;

};
