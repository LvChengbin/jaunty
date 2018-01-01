new J.Package( {
    init : function() {
        this.$install( 
            'view', 
            '/ns/jolin/demo/packages/list/view.js',
            document.body
        );
    },
    action : function() {
        console.log( 'package list is in action' );
    },
    show : function() {
        console.log( 'show', arguments );
    }
} );
