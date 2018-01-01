const gulp = require( 'gulp' );
const uglifyjs = require( 'uglify-es' );
const minifier = require( 'gulp-uglify/minifier' );
const { rename } = require( 'gulp-load-plugins' )();
const errorhandler = require( '../errorhandler' );

gulp.task( 'uglify', () => {
    return gulp.src( [
        '.tmp/j.js',
        '.tmp/j.bc.js'
    ] ).pipe( minifier( {}, uglifyjs ).on( 'error', errorhandler ) ).pipe( rename( { suffix : '.min' } ) ).pipe( gulp.dest( '.tmp' ) );
} );
