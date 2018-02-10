import EventEmitter from '@lvchengbin/event-emitter';
import Promise from '@lvchengbin/promise';
import { URL } from '@lvchengbin/url';
import { currentScriptURL } from '../../src/utils';
import J from '../../src/j';
import Package from '../../src/package';
import config from './config';

const $url = currentScriptURL();

describe( 'Jaunty', () => {
    const j = new J;

    describe( 'J', () => {
        it( 'Should extend from EventEmitter', () => {
            expect( j instanceof EventEmitter ).toBeTruthy();
        } );
    } );

    describe( 'J.$url', () => {
        it( 'should equal to the url of current script', () => {
            expect( j.$url ).toEqual( $url );
        } );

        it( 'Can pass in an URL in options', () => {
            expect( new J( { $url } ).$url ).toEqual( $url );
        } );
    } );

    describe( 'J.$name', () => {
        it( 'Should have been assigned a name', () => {
            expect( j.$name ).toEqual( 'j1' );
        } );

        it( 'should use the speficied name', () => {
            expect( new J( 'page', { $url } ).$name ).toEqual( 'page' );
        } );
    } );

    describe( 'J.$path', () => {
        it( 'should have been allocated a name', () => {
            expect( j.$path ).toEqual( [ 'j1' ] );
        } );

        it( 'should use the speficied name', () => {
            expect( new J( 'root', { $url } ).$path ).toEqual( [ 'root' ] );
        } );
    } );

    describe( 'J.$root', () => {
        it( 'The $root property should point to itself', () => {
            expect( j ).toEqual( j.$root );
        } );

    } );

    describe( 'J.$parent', () => {
        it( 'should be null because the package is a root package', () => {
            expect( j.$parent ) .toEqual( null );
        } );
    } );

    describe( 'J.$children', () => {
        it( 'should have a property named $children', () => {
            expect( j.$children ).toEqual( {} );
        } );
    } );

    describe( 'J.$ready()', () => {
        it( 'call $ready function with a callback', done => {
            j.$ready( function () {
                expect( this.$url ).toEqual( $url );
                done();
            } )
        } );

        it( 'call $ready function for getting a promise', done => {
            j.$ready().then( p => {
                expect( p.$url ).toEqual( $url );
                done();
            } );
        } );

        it( 'should be resolved after init method resolved if the init method returned a promise object', done => {
            let i = 0;
            new J( {
                $url,
                init() {
                    return new Promise( resolve => {
                        setTimeout( () => {
                            resolve( i++ );
                        }, 50 );
                    } );
                }
            } ).$ready( () => {
                expect( i ).toEqual( 1 );
                done();
            } );
        } );

        it( 'should be ready after all resources promises resolved', done => {
            let i = 0;
            new J( {
                $url,
                init() {
                    this.$resources( new Promise( resolve => {
                        setTimeout( () => {
                            i++;
                            resolve();
                        }, 50 );
                    } ) );
                }
            }).$ready( () => {
                expect( i ).toEqual( 1 );
                done();
            } );
        } );
    } );

    describe( 'Hooks', () => {
        it( 'should call "init" function before ready', done => {
            new J( {
                $url,
                init() {
                    expect( this.$status ).toEqual( J.readyState.CREATED );
                    done();
                }
            } );
        } );

        it( 'should call "action" function after ready', done => {
            new J( {
                $url,
                init() {
                    return new Promise( resolve => {
                        setTimeout( resolve, 50 );
                    } );
                },
                action() {
                    expect( this.$status ).toEqual( J.readyState.READY );
                    done();
                }
            } );
        } );

        it( 'should execute functions start with "__init"', done => {
            new J( {
                $url,
                __initTest() {
                    expect( this.$url ).toEqual( $url );
                    done();
                }
            } );
        } );

        it( 'should execute functions start with "__init"', done => {
            let i = 0;
            new J( {
                $url,
                __init() {
                    i++;
                }
            } ).$ready( () => {
                expect( i ).toEqual( 0 );
                done();
            } );
        } );
    } );

    describe( 'J.$resources()', () => {
        it( 'should be added to __resources array', done => {
            const p = Promise.resolve();
            j.$resources( p );
            expect( j.__resources ).toContain( p );
            done();
        } );
    } );

    describe( 'J.$find()', () => {
    } );

    describe( 'J.$siblings()', () => {
        it( 'should have no siblings if the package is a root package', () => {
            expect( j.$siblings( true ) ).toContain( 'j2' );
        } );

        it( 'siblings should not container the root package itself', () => {
            expect( j.$siblings().indexOf( j ) < 0 ).toBeTruthy();
        } );
    } );

    describe( 'J.$script()', () => {
        const api = config.server + '/javascript';
        const str = 'abcdefghijklmnopqrstuvwxyz';
        const now = +new Date;
        let i = 0;
        const v = str.charAt( i++ ) + now;

        it( 'should have loaded the script file', done => {
            j.$script( `${api}?t=${v}=${now}` ).then( () => {
                expect( window[ v ] ).toEqual( now );
                done();
            } );
        } );

        it( 'should load the script in current package if the path is not an URL', done => {
            const path = './resources/j-script.js';
            j.$script( path ).then( node => {
                expect( new URL( path, $url ).toString() ).toEqual( node.getAttribute( 'data-src' ) );
                expect( window[ 'j-script-test-variable' ] ).toBeTruthy();
                done();
            } );
        } );

        it( 'should put the script into resources list of current package if the package is not ready', done => {
            const j = new J( {
                $url,
                init() {
                    this.$script( './resources/j-script.js' );
                }
            } );
            expect( j.__resources.length ).toEqual( 1 );
            done();
        } );
    } );

    describe( 'J.$style()', () => {
    } );

    describe( 'J.$mount()', () => {
        window.J = J;
        window.J.Package = Package;
        window.J.Promise = Promise;
        it( 'should have loaded package successfully', done => {
            j.$mount( 'test-1', config.packages + '/test-1' ).then( p => {
                expect( p.prop1 ).toEqual( 'test-1' );
                expect( j.$find( 'test-1' ) ).toEqual( p );
                expect( j.$find( 'test-1' ).$name ).toEqual( 'test-1' );
                done();
            } );
        } );

        it( 'a same package can be mounted multiple times', done => {
            j.$mount( 'test-1-2nd', config.packages + '/test-1' ).then( p => {
                expect( p.prop1 ).toEqual( 'test-1' );
                expect( j.$find( 'test-1' ) === p ).toBeFalsy();
                expect( j.$find( 'test-1-2nd' ) ).toEqual( p );
                expect( j.$find( 'test-1-2nd' ).$name ).toEqual( 'test-1-2nd' );
                done();
            } );
        } );

        it( 'the package should be ready after the sub package ready if mounting the package before ready', done => {
            new J( {
                $url,
                init() {
                    this.$mount( 'test-1', config.packages + '/test-1' );
                 }
            } ).$ready( function() {
                expect( this.$find( 'test-1' ).$status ).toEqual( J.readyState.READY );
                done();
            } );
        } );

        it( 'should add an anonymous sub package if calling "$mount" method without passing in a name', done => {
            j.$mount( config.packages + '/test-1' ).then( p => {
                expect( p.$name ).toMatch( /^#anonymous\$/ );
                done();
            } );
        } );
    } );

    describe( 'J.$touch()', () => {
        it( 'should mount a new package if the package is not existing', done => {
            j.$touch( 'test-1-3rd', config.packages + '/test-1' ).then( p => {
                expect( p.prop1 ).toEqual( 'test-1' );
                expect( j.$find( 'test-1-3rd' ) ).toEqual( p );
                expect( j.$find( 'test-1-3rd' ).$name ).toEqual( 'test-1-3rd' );
                done();
            } );
        } );

        it( 'should not mount a new package if the package is existing', done => {
            const pkg = j.$find( 'test-1-3rd' );

            j.$touch( 'test-1-3rd', config.packages + '/test-1' ).then( p => {
                expect( pkg ).toEqual( p );
                done();
            } );
        } );
    } );

    describe( 'J.$unmount()', () => {
        it( 'should remove the package from "children" property of current package', done => {
            j.$mount( 'test-1-4th', config.packages + '/test-1' ).then( () => {
                j.$unmount( 'test-1-4th' );
                expect( j.$find( 'test-1-4th' ) ).toEqual( null );
                done();
            } );
        } );
    } );

} );
