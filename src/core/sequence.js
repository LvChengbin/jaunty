import Promise from './promise';
import EventCenter from './eventcenter';
import { isArray } from '../variables';

class Sequence extends EventCenter {
    constructor( steps = [] ) {
        super();
        this.promise = Promise.resolve();
        steps.length && this.append( steps );
    }

    append( steps ) {
        const then = i => {
            this.promise = this.promise.then( () => {
                return steps[ i ]();
            } );
        };

        isArray( steps ) || ( steps = [ steps ] );

        steps.forEach( ( step, i ) => {
            then( i );
        } );
    }
}

Sequence.all = ( steps ) => {
    var promise = Promise.resolve(),
        results = [];

    const then = i => {
        promise = promise.then( () => {
            return steps[ i ]().then( value => {
                results[ i ] = value;
            } );
        } );
    };

    steps.forEach( ( step, i ) => {
        then( i );
    } );

    return promise.then( () => results );
};

Sequence.race = ( steps ) => {
    return new Promise( ( resolve, reject ) => {
        var promise = Promise.reject();

        const c = i => {
            promise = promise.then( value => {
                resolve( value );
            } ).catch( () => {
                return steps[ i ]();
            } );
        };

        steps.forEach( ( step, i ) => {
            c( i );
        } );

        promise.then( value => {
            resolve( value );
        } ).catch( () => {
            reject();
        } );
    } );
};

export default Sequence;
