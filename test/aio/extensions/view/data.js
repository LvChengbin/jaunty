import { traverse } from '../../../../src/extensions/observer.js'; 

var expect = chai.expect;
describe( 'Extensions/View/Data', function() {
    var obj = {
        text : 'str',
        props : {
            p1 : 'a',
            p2 : 'b'
        },
        list : [
            'a', 'b', 'c'
        ]
    };
    traverse( obj );

    it( 'Should converted all properties to setter and getter ', function( done ) {
        var descriptor = Object.getOwnPropertyDescriptor( obj, 'text' );
        expect( descriptor && descriptor.set ).to.be.ok;
        done();
    } );

    it( 'Should return correct value as normal after assign new value to properties', function( done ) {
        obj.text = 'new';
        expect( obj.text ).to.equal( 'new' );
        done();
        obj.props = 'abc';
    } );
} );
