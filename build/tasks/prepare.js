const gulp = require( 'gulp' );
const del = require( 'del' );
const sequence = require( 'run-sequence' );

gulp.task( 'prepare.clean', () => del( [ '.tmp/**/*' ] ) );

gulp.task( 'prepare.move', () => gulp.src( 'src/**/*' ).pipe( gulp.dest( '.tmp' ) ) );

gulp.task( 'prepare', done => {
    sequence( 'prepare.clean', 'prepare.move', done );
} );
