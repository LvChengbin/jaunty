J.extend( function( pkg, container ) {
    return new J.View( {
        container : container,
        url : '/ns/jolin/demo/packages/list/list.html',
        scope : {
            list : [ 'a', 'b', 'c' ],
            text : 'show'
        },
        mouseover : function( i ) {
            console.log( 'mouseover', i );
        } 
    }, pkg );
} );
