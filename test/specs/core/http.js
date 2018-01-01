import {
    ajax,
    request
} from '../../../src/core/http.js';

import Response from '../../../src/core/response.js';

var expect = chai.expect;

describe( 'ajax', function() {
    it( 'Should return a resolved Promise after get response', function( done ) {
        ajax( './extra/php/get.php', {
            method : 'GET',
            data : {
                x : 1,
                y : 2
            }
        } ).then( function( response ) {
            expect( response ).to.be.an.instanceof( Response );
            done();
        } ).catch( function( response ) {
            console.error( response );
        } );
    } );

    it( 'Should return a rejected Promise while request is error', function( done ) {
        ajax( './extra/php/err.php', {
            method : 'GET'
        } ).catch( function( response ) {
            expect( response ).to.be.an.instanceof( Response );
            done();
        } );
    } );

    it( 'Should be parse response text to JSON easily.', function( done ) {
        ajax( './extra/php/get.php', {
            method : 'GET',
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
        ajax( './extra/php/get.php', {
            method : 'GET',
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

    it( 'Should get the real xhr object with getXhr', function() {
        ajax( './extra/php/get.php', {
            getXhr : xhr => expect( xhr ).to.be.an.instanceof( XMLHttpRequest )
        } );
    } );
} );

describe( 'request', function() {
    describe( 'Normal Request', function() {
        it( 'Should working........', function( done ) {
            request( './extra/php/get.php', {
                data : {
                    x : 1,
                    y : 2
                }
            } ).then( function( response ) {
                expect( response ).to.be.an.instanceof( Response );
                done();
            } );
        } );

        it( 'Should have been stored in Storage with storage configuration', function() {

        } );
    } );
} );
