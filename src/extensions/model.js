import Promise from '@lvchengbin/promise';
import is from '@lvchengbin/is';

import Extension from '../extension';
import { $u } from '../utils';
import { request } from '../http';
import { assign, getKeys, defineProperty, isArray } from '../variables';
import { traverse as traverseData, mtrigger } from './observer';
import { eventcenter, getDataByPath, Record, expression } from './utils';
import Validate from './validate';

function defaultValue() {
    return {
        $valid : false,
        $checked : false,
        $modified : false,
        $dirty : false,
        $pristine : false,
        $error : false,
        $errors : {}
    };
}

function makeValidator( name, bound, model ) {
    return () => {
        const validation = model.$data.$validation;
        if( !validation ) return true;
        let res = true;
        const val = getDataByPath( model.$data, bound.path );
        for( let keys = getKeys( bound ), i = keys.length - 1; i >= 0; i-- ) {
            const key = keys[ i ];

            if( key.charAt( 0 ) === '_' && key.charAt( 1 ) === '_' ) continue;
            const item = bound[ key ];
            let error;

            if( is.function( item ) ) {
                error = !item.call( model, val );
            } else if( is.function( Validate[ key ] ) ) {
                error = !Validate[ key ]( val, bound[ key ] );
            } else { continue }
            error && ( res = false );
            model.$assign( validation[ name ].$errors, {
                [ key ] : error
            } );
        }

        if( bound.hasOwnProperty( 'method' ) ) {
            if( !bound.method.call( model, val ) ) {
                res = false;
                validation[ name ].$errors.method = true;
            }
            validation[ name ].$errors.method = false;
        }

        validation[ name ].$valid = res;

        return !( validation[ name ].$error = !res );
    };
}

const protoMethods = [ 
    '$reload', '$refresh', '$assign',
    '$submit', '$load', '$delete', '$update',
];

function model( data, m ) {

    if( typeof data !== 'object' ) {
        console.warn( '[J WARN ] Model : model data is not an object', data, m );
        return data;
    }
    const methods = {};
    const keys = protoMethods.concat( getKeys( m ) );

    for( let i = 0, l = keys.length; i < l; i += 1 ) {
        const item = m[ keys[ i ] ];
        methods[ keys[ i ] ] = is.function( item ) ? item.bind( m ) : item;
    }

    for( let i = 0, l = keys.length; i < l; i += 1 ) {
        const key = keys[ i ];
        if( key.charAt( 0 ) !== '$' ) {
            if( m.expose.indexOf( key ) < 0 ) continue;
        }
        if( data.hasOwnProperty( key ) ) continue;
        defineProperty( data, key, {
            value : methods[ key ]
        } );
    }
    return data;
}

class Model extends Extension {
    constructor( options, init ) {
        super( options, assign( init, { $type : 'model' } ) );
        assign( this, options || {} );
        this.__init().then( () => {
            this.$init();
        } );
    }

    __init() {
        this.data || ( this.data = {} );
        this.expose || ( this.expose = [] );

        this.__snapshot = null;
        this.$data = {};

        this.__initial = null;
        this.__boundValidation = false;
        this.__specialProperties = null;
        this.__triedSubmit = false;

        return this.$resources( this.__initData(), 'Initializing data' ).then( () => {
            try {
                this.__initial = JSON.stringify( this.$data );
            } catch( e ) {
                console.warn( e );
            }
            this.__bindSpecialProperties();
        } );
    }

    $reload( options ) {
        options && assign( this, options );
        return this.__init().then( () => {
            this.$emit( 'refresh' );
            return this.$data;
        } );
    }

    $refresh() {
        this.$emit( 'beforerefresh' );
        return this.__initData().then( () => {
            try {
                this.__initial = JSON.stringify( this.$data );
            } catch( e ) {
                console.warn( e );
            }
            this.__bindSpecialProperties();
            this.$emit( 'refresh' );

            return this.$data;
        } );
    }

    __bindSpecialProperties() {
        const properties = {
            $ready : true,
            $loading : false,
            $failed : false,
            $error : false,
            $submitting : false,
            $requesting : false,
            $response : null,
            $validation : defaultValue()
        };

        const makeChangeAfterSubmitHandler = item => {
            return ( ...args ) => {
                if( this.__triedSubmit ) item.__validator( ...args );
            };
        };

        if( this.validations ) {
            const keys = getKeys( this.validations );
            for( let i = 0, l = keys.length; i < l; i += 1 ) {
                const key = keys[ i ];
                const item = this.validations[ key ];
                properties.$validation[ key ] = defaultValue();
                if( !this.__boundValidation ) {
                    item.__validator = makeValidator( key, item, this );
                    item.path || ( item.path = key );
                    switch( item.on ) {
                        case 'change' :
                        case 1 :
                            this.$watch( item.path, item.__validator );
                            break;
                        case 'change-after-submit' :
                        case 2 :
                            this.$watch( item.path, makeChangeAfterSubmitHandler( item ) );
                            break;
                        default :
                            break;
                    }
                }
            }
            this.__boundValidation = true;
        }
        this.$assign( this.$data, properties );
    }

    __initData( data = null ) {
        const promise = Promise.resolve();

        if( data ) {
            this.$data = model( data, this );
            traverseData( this.$data, this.__id );
            return promise;
        }

        let params;

        if( this.api ) {
            this.url = this.api.url;
            params = this.api.params; 
        }

        if( this.url ) {
            this.url = $u.generate( this.url );
            return request( this.url, {
                data : params || null,
                storage : this.storage
            } ).then( response => {
                this.$data = model( response, this );
                traverseData( this.$data, this.__id );
            } ).catch( e => {
                console.error( e );
            } );
        } else if( this.data ) {
            if( is.function( this.data ) ) {
                const p = this.data();
                if( is.promise( p ) ) {
                    return p.then( response => {
                        this.$data = model( response, this );
                        traverseData( this.$data, this.__id );
                    } );
                } else {
                    this.$data = model( p || {}, this );
                    traverseData( this.$data, this.__id );
                }
                return promise;

            } else if( is.promise( this.data ) ) {
                return this.data.then( response => {
                    this.$data = model( response, this );
                    traverseData( this.$data, this.__id );
                } );
            } else {
                if( this.__initial ) {
                    this.$reset();
                } else {
                    this.$data = model( this.data, this );
                    traverseData( this.$data, this.__id );
                }
            }
        }
        return promise;
    }

    $reset() {
        this.$assign( JSON.parse( this.__initial ) );
        this.__bindSpecialProperties();
        return Promise.resolve( this.$data );
    }

    $assign( dest, key, value ) {
        if( typeof value === 'undefined' ) {
            if( typeof key === 'undefined' ) {
                return this.__initData( dest ).then( () => {
                    this.__bindSpecialProperties();
                    this.$emit( 'refresh' );
                } );
            }
            traverseData( key, null, dest );
            mtrigger( dest );
            return;
        }

        if( dest.hasOwnProperty( key ) ) {
            dest[ key ] = value;
            return;
        }
        this.$assign( dest, { [ key ] : value } );
    }

    $watch( exp, handler ) {
        const events = {};
        Record.start( this, events, handler );   
        expression( exp )( this.$data ); 
        Record.reset();
        const fullPath = this.__id + '.' + exp;

        /**
         * if the property getting by exp is not already existed.
         * bind the exp directily to make the changes can be watched.
         */
        if( !events[ fullPath ] ) {
            eventcenter.$on( this.__id + '.' + exp, handler );
        }
    }

    $unwatch( exp, handler ) {
        eventcenter.$removeListener( this.__id + '.' + exp, handler );
    }

    $validate( name ) {
        let error = false;

        if( name ) {
            if( !this.validations[ name ] ) return true;
            return this.validations[ name ].__validator.call( this );
        }

        if( this.validations ) {
            const keys = getKeys( this.validations );
            const validation = this.$data.$validation;

            for( let i = 0, l = keys.length; i < l; i += 1 ) {
                const key = keys[ i ];
                const item = this.validations[ key ];
                if( item.__validator.call( this ) === false ) {
                    const vali = validation[ key ];
                    vali.$error = true;
                    vali.$errors[ key ] = true;
                    //this.$validation
                    error = true;
                }
            }
        }

        if( is.function( this.validate ) ) {
            if( this.validate() === false ) {
                error = true;
            }
        }

        return !( this.$data.$validation.$error = error );
    }

    $submit( method = 'submit', multiple = false, ...args ) {
        const data = this.$data;
        this.__triedSubmit = true;

        if( this.$validate() === false ) {
            return Promise.reject( {
                errmsg : 'invalid data'
            } );
        }

        if( !multiple && data.$submitting ) {
            return Promise.reject( {
                errmsg : 'multiple submitting'
            } );
        }
        data.$submitting = data.$requesting = true;

        let res;

        if( !is.function( method ) ) {
            console.error( `Cannot find "${method}" method.` );
        }

        res = this[ method ]( ...args );

        if( is.function( res.then ) ) {
            return res.then( response => {
                data.$error = false;
                data.$response = response;
                data.$submitting = data.$requesting = false;
                this.$signal( 'submit', response );
            } ).catch( e => {
                data.$submitting = data.$requesting = false;
                data.$error = e;
                data.$response = e;
            } );
        } else {
            if( res === false ) {
                data.$submitting = data.$requesting = false;
                data.$error = true;

                return Promise.reject( {
                } );
            } else {
                data.$error = false;
                data.$submitting = data.$requesting = false;
                return Promise.resolve( res );
            }
        }
    }
    
    $request( ...args ) {
        const data = this.$data;
        data.$requesting = true;

        return J.request( ...args ).then( response => {
            data.$error = false; 
            data.$response = response;
            data.$requesting = false;
            return response;
        } ).catch( e => {
            data.$requesting = false;
            data.$error = e;
            data.$response = e;
            throw e;
        } );

    }

    $pure( keys ) {
        const data = this.$data;

        if( isArray( data ) ) return data;

        const res = {};
        const list = [
            '$ready',
            '$loading',
            '$loaded',
            '$failed',
            '$error',
            '$submitting',
            '$requesting',
            '$validation',
            '$response'
        ];

        if( !keys ) {
            keys = getKeys( data );
        }

        for( let i = 0, l = keys.length; i < l; i += 1 ) {
            const key = keys[ i ];
            if( list.indexOf( key ) < 0 ) {
                res[ key ] = data[ key ];
            }
        }
        return res;
    }
}

Model.extend = properties => {
    assign( Model.prototype, properties );
};

export default Model;
