import { html2Node as parse } from '../../../../src/core/utils';

var expect = chai.expect;

var isFragment = function( node ) {
    return node && node.nodeType == 11;
};

describe( 'Extensions/View/Template', function() {
    it( 'Should return a DocumentFragment', function( done ) {
        expect( isFragment( parse( '<div></div>' ) ) ).to.ok;
        expect( isFragment( parse( 'abc' ) ) ).to.ok;
        expect( isFragment( parse( '<option>item</option>' ) ) ).to.ok;
        expect( isFragment( parse( '<!-- comment -->' ) ) ).to.ok;
        done();
    } );

    it( 'Should return correct fragment', function( done ) {
        var node = parse( '<div>1</div><div>2</div>' );
        expect( node.children.length ).to.equal( 2 );
        expect( node.firstChild.tagName ).to.equal( 'DIV' );
        expect( node.lastChild.tagName ).to.equal( 'DIV' );

        node = parse( '<option>item</option>' );
        expect( node.children.length ).to.equal( 1 );
        expect( node.firstChild.tagName ).to.equal( 'OPTION' );

        node = parse( '<!-- comment -->' );
        expect( node.firstChild.nodeType ).to.equal( 8 );

        node = parse( 'xyz' );
        expect( node.firstChild.nodeType ).to.equal( 3 );

        node = parse( '<div>true</div>' );
        expect( node.firstChild.innerHTML ).to.equal( 'true' );

        node = parse( '<div></div>true' );
        expect( node.lastChild.data ).to.equal( 'true' );

        done();
    } );
} );
