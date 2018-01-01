const gulp = require( 'gulp' );
const { rollup } = require( 'gulp-load-plugins' )();
const sequence = require( 'run-sequence' );
const errorhandler = require( '../errorhandler' );

gulp.task( 'rollup.code', () => {
    return gulp.src( '.tmp/**/*.js' ).pipe( rollup( {
        entry : [ '.tmp/j.js', '.tmp/j.bc.js' ],
        format : 'iife'
    } ).on( 'error', errorhandler ) ).pipe( gulp.dest( '.tmp' ) );
} );

gulp.task( 'rollup', ( done ) => {
    sequence( 'rollup.code', done );
} );
