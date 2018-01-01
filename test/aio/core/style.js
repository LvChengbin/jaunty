/* global J:false, expect:false */

( function() {

var getComputedStyle = function(element, key){
    var styles;
    if (document.defaultView && document.defaultView.getComputedStyle) {
        styles = document.defaultView.getComputedStyle( element, null );
        if (styles) {
            return styles[key] || styles.getPropertyValue(key);
        }
    }
    return ''; 
};

var $ = function( id ) {
    return document.getElementById( id );
};

var $$ = function( selector) {
    return document.querySelectorAll( selector );
};

var node = document.getElementById( 'style-helper' );

describe( 'J.Style', function() {

    it( 'Should return a promise object', function( done ) {
        expect( J.Style.create( {
            url : '../extra/css/style1.css',
            external : true
        } ) ).to.have.property( 'then' ).and.be.a( 'Function' );
        done();
    } );

    it( 'Should create <link> node if external = true', function( done ) {
    	J.Style.create( {
            url : '../extra/css/style1.css',
            external : true
        } ).then( function() {
            var background = getComputedStyle( node, 'width' );
            expect( background ).to.equal( '100px' );
            done();
		} );
    } );

    it( 'Should create only one <link> node if load stylesheet has same url multiple times', function( done ) {
    	J.Style.create( {
            url : '../extra/css/style1.css',
            external : true
        } ).then( function() {
            expect( $$( 'link[href$="style1.css"]' ).length ).to.equal( 1 );
            done();
		} );
    } );

    it( 'Should create <style> tag if external = false', function( done ) {
        J.Style.create( {
            url : '../extra/css/style1.css'
        } ).then( function( id ) {
            expect( $( id ) ).to.be.ok;
            done();
        } );
    } );

    it( 'Should create only one <style> tag if load same stylesheet multiple times wihtout specify different ids', function( done ) {
        J.Style.create( {
            url : '../extra/css/style1.css'
        } ).then( function() {
            expect( $$( 'style[data-src$="style1.css"]' ).length ).to.equal( 1 );
            done();
        } );
    } );

    it( 'Should create another <style> tag with specify a different id', function( done ) {
        J.Style.create( {
            url : '../extra/css/style1.css',
            id : 'custom-style-id-1'
        } ).then( function() {
            expect( $( 'custom-style-id-1' ) ).to.be.ok;
            done();
        } );
    } );

    it( 'Should compile style text content with stringf method', function( done ) {
        J.Style.create( {
            url : '../extra/css/style1.css',
            id : 'custom-style-id-2',
            data : {
                'fontSize' : 59
            }
        } ).then( function() {
            expect( $( 'custom-style-id-1' ) ).to.be.ok;
            expect( $( 'custom-style-id-2' ) ).to.be.ok;
            expect( getComputedStyle( node, 'font-size' ) ).to.equal( '59px' );
            done();
        } );
    } );

    it( 'Should create <style> tags in order', function( done ) {
        J.Style.create( {
            url : '../extra/php/style.php',
            id : 'style-in-order-1'
        } );

        J.Style.create( {
            url : '../extra/css/style1.css',
            id : 'style-in-order-2'
        } ).then( function() {
            var styles = $$( 'style[id^="style-in-order"]' );
            expect( styles[ 0 ].id ).to.equal( 'style-in-order-1' );
            expect( styles[ 1 ].id ).to.equal( 'style-in-order-2' );
            done();
        } );
    } );

    it( 'Should render stylesheet with css text string', function( done ) {
        J.Style.create( {
            style : 'body{ background : {= color =} }',
            id : 'style-create-with-text',
            data : {
                color : 'cyan'
            }
        } ).then( function( id ) {
            expect( $( id ).textContent ).to.equal( 'body{ background : cyan }' );
            done();
        } );
    } );

    it( 'Should modify exists stylesheet if id is exists', function( done ) {
        J.Style.create( {
            style : 'body{ background : {= color =} }',
            id : 'style-create-with-text',
            data : {
                color : 'white'
            }
        } ).then( function( id ) {
            expect( $( id ).textContent ).to.equal( 'body{ background : white }' );
            done();
        } );
    } );

} );

} )();
