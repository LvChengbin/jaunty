window.j = new J( {
    init : function() {
        this.$mount( 'list', '/ns/jolin/demo/packages/list/list.js' );
        this.$mount( '/ns/jolin/demo/packages/list/list.js' );
    }
} );
