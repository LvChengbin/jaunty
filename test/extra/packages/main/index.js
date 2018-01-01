new J.Package( {
    init : function() {
        this.haveBeenMounted = true;
        this.data = 'data';
        this.$install( 'view', 'view.js' );
    },
    rules : [
        new J.Router( 'messages/msg', {
            action : 'msgs/msg'
        } )
    ],
    msgs : {
        msg : function( body, e ) {
            e.reply( body );
        },
    },
    messages : {
        get : function( body, e ) {
            e.reply( this.data );
        }
    }
} );
