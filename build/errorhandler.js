const { log } = require( './utils' );

module.exports = function( err ) {
    log.error( err.toString() );
    this.emit( 'end' );
};
