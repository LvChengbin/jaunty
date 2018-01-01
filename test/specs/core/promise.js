import Promise from '../../../src/core/promise.js';

var expect = chai.expect;

describe( 'Promise', function() {
    describe( 'Class Promise', function() {
        it( 'Should throw an error while set promise instance itself as a argument of resolve function in constructor', function() {
            var func;
            var p = new Promise( function( resolve ) {
                func = resolve;
            } );

            try { func( p ) } catch( e ) {
                expect( e ).to.be.an.instanceOf( TypeError );
            }
        } );
    } );

    describe( 'Promise.resolve', function() {
        it( 'Should return a instance of Promise', function() {
            expect( Promise.resolve() ).to.be.an.instanceof( Promise );
        } );

        it( 'Shoule return a resolved promise', function() {
            expect( Promise.resolve().status ).to.equal( 'resolved' );
        } );

        it( 'Should throw a TypeError', function() {
            try {
                new Promise.resolve();
            } catch( e ) {
                expect( e ).to.be.an.instanceOf( TypeError );
            }
        } );
    } );

    describe( 'Promise.reject', function() {
        it( 'Should return a Promise object', function() {
            expect( Promise.reject() ).to.be.an.instanceOf( Promise );
        } );
        it( 'Should throw a TypeError', function() {
            try {
                Promise.reject.call( Promise.resolve );
            } catch( e ) {
                expect( e ).to.be.an.instanceOf( TypeError );
            }
        } );
    } );

    describe( 'Promise.prototype.catch', function() {

        it( 'Should call "catch" while promise was rejected', function( done ) {
            new Promise( function( resolve, reject ) {
                setTimeout( function() {
                    reject( 'reject' );
                }, 30 );
            } ).catch( function( value ) {
                expect( value ).to.be.equal( 'reject' );
                done();
            } );

        } );

        it( 'Should call method "catch" immediately if add a "catch" method to a rejected promise', function( done ) {
            Promise.reject( 'reject' ).catch( function( value ) {
                expect( value ).to.be.equal( 'reject' ); 
                done();
            } );
        } );

    } );

    describe( 'Promise.prototype.then', function() {
        it( 'Shoulda been executed while Promise was resolved in async', function( done ) {
            new Promise( function( resolve ) {
                setTimeout( function() {
                    resolve( 'resolve' );
                }, 10 );
            } ).then( function( value ) {
                expect( value ).to.equal( 'resolve' );
                done();
            } );
        } );

        it( 'Method "reject" in "then" shoulda been exected while Promise was resolved in async', function( done ) {
            new Promise( function( resolve, reject ) {
                setTimeout( function() {
                    reject( 'reject' );
                }, 10 );
            } ).then( null, function( value ) {
                expect( value ).to.equal( 'reject' );
                done();
            } );
        } );

        it( 'If method "resolve" in "then" returned a Promise object, then the Promise shoulda be resolved while the Promise being resolved', function( done ) {
            Promise.resolve( '1' ).then( function() { 
                return Promise.resolve( 'resolve' );
            } ).then( function( value ) {
                expect( 'resolve' ).to.equal( value );
                done();
            } );
        } );

        it( 'If method "resolve" in "then" returned a Promise object, then wait for the Promise reject then to reject the previous Promise', function( done ) {
            Promise.resolve( '1' ).then( function() { 
                return Promise.reject( 'reject' );
            } ).catch( function( value ) {
                expect( 'reject' ).to.equal( value );
                done();
            } );
        } );

        it( 'In general, the value of promise shoulda been transfered to followed "resolve" in "then"', function( done ) {
            Promise.resolve(1).catch( function(){} ).then( function( value ){
                expect( value ).to.equal( 1 );
                done();
            } );

        } );

        it( 'Resolved status shoulda been transfered to all Promise objects which were following it, if there was no other promise objects was resolved', function( done ) {
            Promise.resolve(1).catch( function(){} ).then( function(){
            } ).then( function( value ){
                expect( value ).to.equal( undefined );
                done();
            } );
        } );

        it( 'If method "resolve" in "then" returned a Promise object, all Promise objects which were following it shoulda gotten status from the new Promise object from "resolve" method', function( done ) {
            Promise.resolve(1).catch( function(){} ).then( function(){} ).then( function() {
                return Promise.resolve( 2 );
            } ).then( function( value ) {
                expect( value ).to.equal( 2 );
                done();
            } );

        } );

        it( 'Method "reject" in "then" shoulda been called while the Promise was being rejected', function( done ) {
            Promise.reject( 1 ).then( null, function() {
                return Promise.resolve( 2 );
            } ).then( function( value ) {
                expect( value ).to.equal( 2 );
                done();
            } );
        } );

        if( typeof window.Promise == 'undefined' ) {
            window.Promise = Promise;
        }

        it( 'Shoulda gone well even if the method "resolve" returned a native Promise object', function( done ) {
            Promise.resolve( 1 ).then( function(){ 
                var p = new window.Promise( function( resolve ) {
                    setTimeout( function() {
                        resolve( 'resolve' );
                    }, 10 );
                } );
                return p;
            } ).then( function( value ) {
                expect( value ).to.equal( 'resolve' );
                done();
            } );
        } );

        it( 'Shoulda gone well even if the method "reject" returned a native Promise object', function( done ) {

            Promise.reject( 1 ).catch( function(){ 
                var p = new Promise( function( resolve, reject ) {
                    setTimeout( function() {
                        reject( 'reject' );
                    }, 10 );
                } );
                return p;
            } ).catch( function( value ) {
                expect( value ).to.equal( 'reject' );
                done();
            } );
        } );

        it( 'If the paramater of "resolve" method is another Promise object, the current Promise object should wait for the paramater Promise object resolved and then resolved itself', function( done ) {
            new Promise( function( resolve ) {
                resolve( Promise.resolve( 2 ) );
            } ).then( function( value ) {
                expect( value ).to.equal( 2 );
                done();
            } );
        } );

        it( 'Shoulda gone well if the paramater of "resolved" methos was a native Promise object', function( done ) {
            new Promise( function( resolve ) {
                resolve( window.Promise.resolve( 2 ) );
            } ).then( function( value ) {
                expect( value ).to.equal( 2 );
                done();
            } );
        } );

        it( 'If the param of "resolve" method is a native Promise object, the "catch" method can catch the reason thrown from the native Promise object', function( done ) {
            new Promise( function( resolve ) {
                resolve( window.Promise.reject( 2 ) );
            } ).then( null, function( reason ) {
                expect( reason ).to.equal( 2 );
                done();
            } );
        } );

        it( 'Shoulda been executed well even if the param of "resolve" method is "null"', function( done ) {
            new Promise( function(resolve ) {
                setTimeout( function() {
                    resolve( null );
                }, 10 );
            } ).then( function( value ) {
                expect( value ).to.equal( null );
                done();
            } ); 
        } );
    } );

    describe( 'Promise.all', function() {
        it( 'Shoulda execute "resolve" method in "then" after all Promise object in params were "resolved"', function( done ) {
            Promise.all( [ Promise.resolve(), Promise.resolve() ] ).then( function() {
                expect( true ).to.be.ok;
                done();
            } );
        } );
        
        it( 'Shoulda catch the exception after one Promise object in params was rejected', function( done ) {
            Promise.all( [ Promise.reject( 'reject' ), Promise.resolve( 'reject2' ) ] ).catch( function( reason ) {
                expect( reason ).to.be.equal( 'reject' );
                done();
            } );
        } );

        it( 'Shoulda gotten all returned values as array in "resolve" method, after all Promise objects in params were resolved', function( done ) {
            Promise.all( [ Promise.resolve( 'one' ), Promise.resolve( 'two' ) ] ).then( function( v ) {
                expect( ( v.length === 2 ) && v[0] === 'one' && v[1] === 'two' ).to.be.ok;
                done();
            } );
        } );
    } );

    describe( 'Promise.race', function() {

        it( 'Shoulda been executed after anyone Promise object in params was resolved', function( done ) {
            Promise.race( [ Promise.resolve( 'one' ), Promise.resolve( 'two' ) ] ).then( function( value ) {
                expect( value ).to.equal( 'one' );
                done();
            } );
        } );

        it( 'Shoulda caught exception after anyone Promise object in params was rejected', function( done ) {
            Promise.race( [ Promise.reject( 'one' ), Promise.resolve( 'two' ) ] ).catch( function( reason ) {
                expect( reason ).to.equal( 'one' );
                done();
            } );
        } );
    } );
} );
