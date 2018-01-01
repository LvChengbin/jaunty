class Event {
    constructor( options = {} ) {
        this.__returnValue = true;
        Object.assign( this, options );
    }

    stop() {
        this.stopPropagation();
    }

    stopPropagation() {
        this.__returnValue = false;
    }
}

export default Event;
