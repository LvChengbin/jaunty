import { assign } from './variables';
export default class {
    constructor( value, options ) {
        this.value = value;
        assign( this, options ); 
    }
}
