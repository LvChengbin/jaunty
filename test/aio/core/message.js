/* global J:false, expect:false */

( function() {

var j = window.j2 = new J( 'MSG-TESTING' );
var main;

var promise = J.Promise.all( [
    j.$mount(
        'main', 
        '/ns/jolin/test/extra/packages/main/index.js'
    ),

    j.$mount( 
        'main2',
        '/ns/jolin/test/extra/packages/main/index.js'
    )
] ).then( function() {
    main = j.$find( 'main' );
    return J.Promise.all( [
        main.$mount(
            'sub',
            '/ns/jolin/test/extra/packages/sub/index.js'
        ),
        main.$mount(
            'sub2',
            '/ns/jolin/test/extra/packages/sub/index.js'
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

        it( 'With routers', function( done ) {
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

} )();
