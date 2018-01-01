/* global J:false, expect:false */

( function() {
describe( 'J.ajax', function() {
    it( 'Should return a resolved Promise after get response', function( done ) {
        J.ajax( '../extra/php/get.php', {
            method : 'GET',
            type : 'text',
            data : {
                x : 1,
                y : 2
            }
        } ).then( function( response ) {
            expect( response ).to.be.an.instanceof( J.Response );
            done();
        } ).catch( function( response ) {
            console.error( response );
        } );
    } );

    it( 'Should return a rejected Promise while request is error', function( done ) {
        J.ajax( '../extra/php/err.php', {
            method : 'GET',
            type : 'text',
        } ).catch( function( response ) {
            expect( response ).to.be.an.instanceof( J.Response );
            done();
        } );
    } );

    it( 'Should be parse response text to JSON easily.', function( done ) {
        J.ajax( '../extra/php/get.php', {
            method : 'GET',
            type : 'text',
            data : {
                x : 1,
                y : 2
            }
        } ).then( function( response ) {
            expect( response.url ).to.include( 'x=1&y=2' );
            done();
        } ).catch( function( response ) {
            console.error( response );
        } );
    } );

    it( 'Should get an URL with params transfered in data if the request method is "GET"', function( done ) {
        J.ajax( '../extra/php/get.php', {
            method : 'GET',
            type : 'text',
            data : {
                x : 1,
                y : 2
            }
        } ).then( function( response ) {
            expect( response.json().x ).to.equal( '1' );
            done();
        } ).catch( function( response ) {
            console.error( response );
        } );
    } );

    it( 'Should get the real xhr object with getXhr', function( done ) {
        J.ajax( '../extra/php/get.php', {
            getXhr : function( xhr ) {
                expect( xhr ).to.be.an.instanceof( XMLHttpRequest );
                done();
            }
        } );
    } );
} );

describe( 'J.request', function() {
    describe( 'Normal Request', function() {
        it( 'Should working........', function( done ) {
            J.request( '../extra/php/get.php', {
                type : 'text',
                data : {
                    x : 1,
                    y : 2
                }
            } ).then( function( response ) {
                expect( response ).to.be.an.instanceof( J.Response );
                done();
            } );
        } );

        it( 'Should have been stored in Storage with storage configuration', function() {

        } );
    } );
} );
} )();
