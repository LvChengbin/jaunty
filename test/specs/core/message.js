import J from '../../../src/core/j';
import Package from '../../../src/core/package';
import Router from '../../../src/core/rule';
import Promise from '../../../src/core/promise';

var expect = chai.expect;

window.J || ( window.J = J );
window.J.Package || ( window.J.Package = Package );
window.J.Router || ( window.J.Router = Router );

var j = window.j2 = new J( 'MSG-TESTING' );
var main;

var promise = Promise.all( [
    j.$mount(
        'main', 
        '/ns/jolin/test/extra/packages/main/main.js'
    ),

    j.$mount( 
        'main2',
        '/ns/jolin/test/extra/packages/main/main.js'
    )
] ).then( function() {
    main = j.$find( 'main' );
    return Promise.all( [
        main.$mount(
            'sub',
            '/ns/jolin/test/extra/packages/sub/sub.js'
        ),
        main.$mount(
            'sub2',
            '/ns/jolin/test/extra/packages/sub/sub.js'
        )
    ] );
} );

describe( 'Message', function() {
    describe( 'message', function() {
        it( 'Shoulda sent message successfully and gotten reply data ', function( done ) {
            promise.then( function() {
                var main = j.$find( 'main' );
                var main2 = j.$find( 'main2' );
                main.$message( main2, 'get', {} ).then( function( data ) {
                    expect( data ).to.equal( 'data' );
                    done();
                } );
            } );
        } );

        it( 'With rules', function( done ) {
            promise.then( function() {
                var main = j.$find( 'main' );
                var main2 = j.$find( 'main2' );
                main.$message( main2, 'msg', 'body' ).then( function( data ) {
                    expect( data ).to.equal( 'body' );
                    done();
                } );
            } );
        } );
    } );

    describe( 'unicast', function() {
    } );

    describe( 'broadcast', function() {
    } );

    describe( 'multicast', function() {
    } );

} );

