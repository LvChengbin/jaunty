const gulp = require( 'gulp' );
const sequence = require( 'run-sequence' );
const { log } = require( './build/utils' );
const { watch } = require( 'gulp-load-plugins' )();

require( 'require-dir' )( './build/tasks' );

gulp.task( 'default', () => {
    sequence( 'prepare', 'rollup', 'output', 'deploy' );
} );

gulp.task( 'production', () => {
    sequence( 'prepare', 'rollup', 'babel', 'uglify', 'output', 'deploy' );
} );

gulp.task( 'watch',[ 'default' ], () => {
    watch( [ 'src/**/*' ], {}, () => {
        sequence( 'default', () => {
            log.warn( 'Watching : jolin' );
            return Promise.resolve(); // jshint ignore:line
        } );
    } );
} );
