const gulp = require( 'gulp' );
const settings = require( '../settings' );
const { log } = require( '../utils' );

function info( attr ) {
    log.info( `Finish copying files to "${attr}"` );
}

gulp.task( 'deploy', () => {
    for( let attr in settings.deploy ) {
        gulp.src( [ 'dist/j.js', 'dist/j.bc.js' ] )
            .pipe( gulp.dest( settings.deploy[ attr ] ) ).on( 'end', info.bind( null, attr ) );
    }
} );
