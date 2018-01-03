const gulp = require( 'gulp' );
const sequence = require( 'run-sequence' );
const { watch, clean, rollup } = require( 'gulp-load-plugins' )();

const errorhandler = function( e ) {
    console.log( e.toString() );
    this.emit( 'end' );
};

gulp.task( 'clean', () => {
    return gulp.src( 'dist', { read : false } ).pipe( clean() );
} );

gulp.task( 'default', [ 'clean' ], () => {
    return gulp.src( 'src/**/*.js' )
    .pipe( rollup( {
        input : 'src/j.js',
        format : 'iife'
    } ).on( 'error', errorhandler ) )
    .pipe( gulp.dest( 'dist' ) );
} );

gulp.task( 'watch',[ 'default' ], () => {
    watch( [ 'src/**/*' ], {}, () => {
        sequence( 'default' );
    } );
} );
