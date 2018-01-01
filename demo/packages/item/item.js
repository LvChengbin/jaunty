new J.Package( {
    init : function( options ) {
        console.log( 'item loaded' );
        this.view = new J.View( {
            container : options.container,
            template : '<a href="###" :prevent>ITEM</a>'
        } );
    }
} );
