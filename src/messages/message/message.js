export default class Message {
    constructor( options = {} ) {
        Object.assign( this, options );
    }
    reply( data ) {
        return this.resolver( data );
    }
    forward( to, body ) {
        this.package.$message( to, this.subject, body || this.body ).then( response => {
            this.resolver( response );
        } ).catch( e => {
            this.rejector( e );
        } );
    }
}

