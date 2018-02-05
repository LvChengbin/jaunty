import parser from './parser';

class Style {
    constructor( source ) {
        if( !source ) {
            throw new TypeError( 'The source cannot be empty.' );
        }
        this.source = source.toString().trim();
        this.rules = parser( source );
    }

    stringify() {
    }
}

export default Style;
