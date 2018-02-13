J.Package( {
    prop1 : 'test-2',
    init( options = {} ) {
        this.packages = options.packages;
        this.$mount( 'test-1', options.packages + '/test-1' );
    }
} );
