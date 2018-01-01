const gulp = require( 'gulp' );
gulp.task( 'output', () => {
    return gulp.src( [ 
        '.tmp/j.js',
        '.tmp/j.bc.js',
        '.tmp/j.min.js',
        '.tmp/j.bc.min.js'
    ] ).pipe( gulp.dest( './dist' ) );
} );
