/* global J:false, expect:false */

( function() {
var $$ = function( selector) {
    return document.querySelectorAll( selector );
};

describe( 'J.Script', function() {
    it( 'Should return a promise object', function( done ) {
        expect( J.Script.create( {
            url : '../extra/js/a.js'
        } ) ).to.have.property( 'then' ).and.be.a( 'Function' );
        done();
    } );
    it( 'Should create a <script> node with an attribute src', function( done ) {
        J.Script.create( {
            url : '../extra/js/b.js',
            external : true
        } ).then( function( node ) {
            expect( window.TEST_IN_A_JS ).to.equal( 100 );
            expect( node.src && !node.text ).to.be.ok;
            done();
        } );
    } );

    it( 'Should create only one <script> node if create script with same url multiple times', function( done ) {
        J.Script.create( {
            url : '../extra/js/a.js'
        } ).then( function() {
            expect( $$( 'script[data-src$="a.js"]' ).length ).to.equal( 1 );
            done();
        } );
    } );

    it( 'Should create <script> tags in correct order', function( done ) {
        J.Script.create( {
            url : '../extra/php/script.php'
        } );

        J.Script.create( {
            url : '../extra/js/c.js'
        } ).then( function() {
            expect( window.TEST_IN_SCRIPT_JS ).to.equal( 500 );
            done();
        } );
    } );
} );
} )();
