/* global J:false, expect:false */

( function() {
describe( 'J.Promise', function() {
    describe( 'Class J.Promise', function() {
        it( 'Should throw an error while set promise instance itself as a argument of resolve function in constructor', function( done ) {
            var func;
            var p = new J.Promise( function( resolve ) {
                func = resolve;
            } );

            try { func( p ); } catch( e ) {
                expect( e ).to.be.an.instanceOf( TypeError );
                done();
            }
        } );
    } );

    describe( 'J.Promise.resolve', function() {
        it( 'Should return a instance of J.Promise', function( done ) {
            expect( J.Promise.resolve() ).to.be.an.instanceof( J.Promise );
            done();
        } );

        it( 'Shoule return a resolved promise', function( done ) {
            expect( J.Promise.resolve().status ).to.equal( 'resolved' );
            done();
        } );

        it( 'Should throw a TypeError', function( done ) {
            try {
                new J.Promise.resolve();
            } catch( e ) {
                expect( e ).to.be.an.instanceOf( TypeError );
                done();
            }
        } );
    } );

    describe( 'J.Promise.reject', function() {
        it( 'Should return a Promise object', function( done ) {
            expect( J.Promise.reject() ).to.be.an.instanceOf( J.Promise );
            done();
        } );
        /*
        it( 'Should throw a TypeError', function( done ) {
            try {
                J.Promise.reject.call( J.Promise.resolve );
            } catch( e ) {
                expect( e ).to.be.an.instanceOf( TypeError );
                done();
            }
        } );
        */
    } );

    describe( 'J.Promise.prototype.catch', function() {

        it( 'Should call "catch" while promise was rejected', function( done ) {
            new J.Promise( function( resolve, reject ) {
                setTimeout( function() {
                    reject( 'reject' );
                }, 30 );
            } ).catch( function( value ) {
                expect( value ).to.be.equal( 'reject' );
                done();
            } );

        } );

        it( 'Should call method "catch" immediately if add a "catch" method to a rejected promise', function( done ) {
            J.Promise.reject( 'reject' ).catch( function( value ) {
                expect( value ).to.be.equal( 'reject' ); 
                done();
            } );
        } );

    } );

    describe( 'J.Promise.prototype.then', function() {
        it( 'Shoulda been executed while Promise was resolved in async', function( done ) {
            new J.Promise( function( resolve ) {
                setTimeout( function() {
                    resolve( 'resolve' );
                }, 10 );
            } ).then( function( value ) {
                expect( value ).to.equal( 'resolve' );
                done();
            } );
        } );

        it( 'Method "reject" in "then" shoulda been exected while Promise was resolved in async', function( done ) {
            new J.Promise( function( resolve, reject ) {
                setTimeout( function() {
                    reject( 'reject' );
                }, 10 );
            } ).then( null, function( value ) {
                expect( value ).to.equal( 'reject' );
                done();
            } );
        } );

        it( 'If method "resolve" in "then" returned a Promise object, then the Promise shoulda be resolved while the Promise being resolved', function( done ) {
            J.Promise.resolve( '1' ).then( function() { 
                return J.Promise.resolve( 'resolve' );
            } ).then( function( value ) {
                expect( 'resolve' ).to.equal( value );
                done();
            } );
        } );

        it( 'If method "resolve" in "then" returned a Promise object, then wait for the Promise reject then to reject the previous Promise', function( done ) {
            J.Promise.resolve( '1' ).then( function() { 
                return J.Promise.reject( 'reject' );
            } ).catch( function( value ) {
                expect( 'reject' ).to.equal( value );
                done();
            } );
        } );

        it( 'In general, the value of promise shoulda been transfered to followed "resolve" in "then"', function( done ) {
            J.Promise.resolve(1).catch( function(){} ).then( function( value ){
                expect( value ).to.equal( 1 );
                done();
            } );

        } );

        it( 'Resolved status shoulda been transfered to all Promise objects which were following it, if there was no other promise objects was resolved', function( done ) {
            J.Promise.resolve(1).catch( function(){} ).then( function(){
            } ).then( function( value ){
                expect( value ).to.equal( undefined );
                done();
            } );
        } );

        it( 'If method "resolve" in "then" returned a Promise object, all Promise objects which were following it shoulda gotten status from the new Promise object from "resolve" method', function( done ) {
            J.Promise.resolve(1).catch( function(){} ).then( function(){} ).then( function() {
                return J.Promise.resolve( 2 );
            } ).then( function( value ) {
                expect( value ).to.equal( 2 );
                done();
            } );

        } );

        it( 'Method "reject" in "then" shoulda been called while the Promise was being rejected', function( done ) {
            J.Promise.reject( 1 ).then( null, function() {
                return J.Promise.resolve( 2 );
            } ).then( function( value ) {
                expect( value ).to.equal( 2 );
                done();
            } );
        } );

        if( typeof window.Promise == 'undefined' ) {
            window.Promise = J.Promise;
        }

        it( 'Shoulda gone well even if the method "resolve" returned a native Promise object', function( done ) {
            J.Promise.resolve( 1 ).then( function(){ 
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

            J.Promise.reject( 1 ).catch( function(){ 
                var p = new J.Promise( function( resolve, reject ) {
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
            new J.Promise( function( resolve ) {
                resolve( J.Promise.resolve( 2 ) );
            } ).then( function( value ) {
                expect( value ).to.equal( 2 );
                done();
            } );
        } );

        if( 'Shoulda gone well if the paramater of "resolved" methos was a native Promise object', function( done ) {
            new J.Promise( function( resolve ) {
                resolve( window.Promise.resolve( 2 ) );
            } ).then( function( value ) {
                expect( value ).to.equal( 2 );
                done();
            } );
        } );

        it( 'If the param of "resolve" method is a native Promise object, the "catch" method can catch the reason thrown from the native Promise object', function( done ) {
            new J.Promise( function( resolve ) {
                resolve( window.Promise.reject( 2 ) );
            } ).then( null, function( reason ) {
                expect( reason ).to.equal( 2 );
                done();
            } );
        } );

        it( 'Shoulda been executed well even if the param of "resolve" method is "null"', function( done ) {
            new J.Promise( function(resolve ) {
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
            J.Promise.all( [ J.Promise.resolve(), J.Promise.resolve() ] ).then( function() {
                expect( true ).to.be.ok;
                done();
            } );
        } );
        
        it( 'Shoulda catch the exception after one Promise object in params was rejected', function( done ) {
            J.Promise.all( [ J.Promise.reject( 'reject' ), J.Promise.resolve( 'reject2' ) ] ).catch( function( reason ) {
                expect( reason ).to.be.equal( 'reject' );
                done();
            } );
        } );

        it( 'Shoulda gotten all returned values as array in "resolve" method, after all Promise objects in params were resolved', function( done ) {
            J.Promise.all( [ J.Promise.resolve( 'one' ), J.Promise.resolve( 'two' ) ] ).then( function( v ) {
                expect( ( v.length === 2 ) && v[0] === 'one' && v[1] === 'two' ).to.be.ok;
                done();
            } );
        } );
    } );

    describe( 'Promise.race', function() {

        it( 'Shoulda been executed after anyone Promise object in params was resolved', function( done ) {
            J.Promise.race( [ J.Promise.resolve( 'one' ), J.Promise.resolve( 'two' ) ] ).then( function( value ) {
                expect( value ).to.equal( 'one' );
                done();
            } );
        } );

        it( 'Shoulda caught exception after anyone Promise object in params was rejected', function( done ) {
            J.Promise.race( [ J.Promise.reject( 'one' ), J.Promise.resolve( 'two' ) ] ).catch( function( reason ) {
                expect( reason ).to.equal( 'one' );
                done();
            } );
        } );
    } );
} );
} )();
