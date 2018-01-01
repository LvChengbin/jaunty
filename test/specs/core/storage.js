import Storage from '../../../src/core/storage.js';

var expect = chai.expect;

describe( 'Storage', function() {
    describe( 'Storage in memory', function() {
        it( 'Can be stored with method "set" and pick out with method "get" ', function( done ) {
            Storage.set( 'Birth', 'November 8th', {
                level : 'page', 
                lifetime : 100000
            } );

            Storage.get( 'Birth' ).then( function( data ){
                expect( data.content ).to.equal( 'November 8th' );
                done();
            } );
        } );

        it( 'Data can be removed with method "remove"', function( done ) {
            Storage.set( 'Birth 2', 'November 8th', { 
                level : 'page'
            } ).then( function(){
                Storage.remove( 'Birth 2' ).then( function() {
                    Storage.get( 'Birth 2' ).catch( function( e ){
                        expect( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'All data can removed with method "clear" in one time', function( done ) {
            Storage.set( 'Birth 3', 'November 8th', { 
                level : 'page'
            } ).then( function(){
                Storage.clear().then( function() {
                    Storage.get( 'Birth 3' ).catch( function( e ){
                        expect( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'Should be removed if expired', function( done ) {
            Storage.set( 'Birth 4', 'November 8th', { 
                level : 'page',
                lifetime : 10
            } ).then( function(){
                setTimeout( function() {
                    Storage.get( 'Birth 4' ).then( function() {
                        throw new TypeError( 'Should not be here' );
                    } ).catch( function( e ){
                        expect( e ).to.be.ok;
                        done();
                    } );
                }, 20 );
            } );
        } );
    } );

    describe( 'Store data in localStorage', function() {
        it( 'Shoulda stored data with "set" method and picked out with method "get" ', function( done ) {

            Storage.set( 'Birth', 'November 8', {
                level : 'persistent' 
            } );

            Storage.get( 'Birth' ).then( function( data ){
                expect( data.content ).to.equal( 'November 8' );
                done();
            } ).catch( function( e ){
                throw e;
            } );
        } );

        it( 'Data can be removed with method "remove"', function( done ) {
            Storage.set( 'Birth', 'November 8th', {
                level : 'persistent'
            } ).then( function(){
                Storage.remove( 'Birth' ).then( function(){
                    Storage.get( 'Birth' ).catch( function( e ) {
                        expect( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'All data can removed with method "clear" in one time', function( done ) {
            Storage.set( 'Birth 3', 'November 8th', { 
                level : 'persistent'
            } ).then( function(){
                Storage.clear().then( function() {
                    Storage.get( 'Birth 3' ).catch( function( e ){
                        expect( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'Should be removed after over the life time', function( done ) {
            Storage.set( 'Birth 4', 'November 8th', { 
                level : 'persistent',
                lifetime : 10
            } ).then( function(){
                setTimeout( function() {
                    Storage.get( 'Birth 4' ).then( function() {
                        throw new TypeError( 'Should not be here' );
                    } ).catch( function( e ){
                        expect( e ).to.be.ok;
                        done();
                    } );
                }, 20 );
            } );
        } );
    } );

    describe( 'Store data in sessionStorage', function() {
        it( 'Can be stored with method "set" and pick out with method "get" ', function( done ) {
            Storage.set( 'Birth', 'November 8th', {
                level : 'session' 
            } );

            Storage.get( 'Birth' ).then( function( data ){
                expect( data.content ).to.equal( 'November 8th' );
                done();
            } );
        } );

        it( 'Data can be removed with method "remove"', function( done ) {
            Storage.set( 'Birth', 'November 8th', { 
                level : 'session'
            } ).then( function(){
                Storage.remove( 'Birth' ).then( function(){
                    Storage.get( 'Birth' ).catch( function( e ){
                        expect( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'All data can removed with method "clear" in one time', function( done ) {
            Storage.set( 'Birth 3', 'November 8th', { 
                level : 'session'
            } ).then( function(){
                Storage.clear().then( function() {
                    Storage.get( 'Birth 3' ).catch( function( e ){
                        expect( e ).to.be.ok;
                        done();
                    } );
                } );
            } );
        } );

        it( 'Should be removed after over the life time', function( done ) {
            Storage.set( 'Birth 4', 'November 8th', { 
                level : 'session',
                lifetime : 10
            } ).then( function(){
                setTimeout( function() {
                    Storage.get( 'Birth 4' ).then( function() {
                        throw new TypeError( 'Should not be here' );
                    } ).catch( function( e ){
                        expect( e ).to.be.ok;
                        done();
                    } );
                }, 20 );
            } );
        } );
    } );
} );
