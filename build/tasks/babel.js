const gulp = require( 'gulp' );
const { babel } = require( 'gulp-load-plugins' )();
const errorhandler = require( '../errorhandler' );

gulp.task( 'babel', () => {
    return gulp.src( [
        '.tmp/j.bc.js'
    ] ).pipe( babel().on( 'error', errorhandler ) ).pipe( gulp.dest( '.tmp' ) );
} );
