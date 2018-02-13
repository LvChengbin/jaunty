/**
 * @class Event
 * @method stop
 */
export default class Event {
    constructor( options = {} ) {
        Object.assign( this, options );
        this.stopped = false;
    }
    stop() {
        this.stopped = true;
    }
}

