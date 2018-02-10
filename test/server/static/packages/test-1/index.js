J.Package( {
    prop1 : 'test-1',
    init() {
        return new J.Promise( resolve => {
            setTimeout( resolve, 20 );
        } );
    }
} );
