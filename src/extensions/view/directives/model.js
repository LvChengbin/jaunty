import { eventSupported } from '../../../core/utils';
import { interpolation, wrapFilter } from '../utils';
import { isArray } from '../../../variables';

const stringify = JSON.stringify;
export default {
    bind( directive, node ) {
        node.$$model = true;
    },
    compile( directive, node ) {
        const value = directive.value;
        const scope = node.$scope;
        const $set = /\[[\s\d+]+\]$/.test( value );
        const tagName = node.tagName;
        let composition = false;
        let timer = null;
        let debounce = 50;

        if( node.hasAttribute( 'model-debounce' ) ) {
            debounce = +node.getAttribute( 'model-debounce' );
        }

        if( ( tagName === 'INPUT' ) || tagName === 'TEXTAREA' || node.isContentEditable ) {
            node.addEventListener( 'compositionstart', () => composition = true, false );
            node.addEventListener( 'compositionend', function() {
                composition = false;
                this.oninput();
            }, false );
        }
        node.oninput = node.onchange = node.onpaste = node.oncut = node.onkeyup = function() {
            if( composition ) return;
            timer && clearTimeout( timer );
            timer = setTimeout( () => {
                const bind = interpolation( value )( scope );
                //e && ( this.$$$modelChanged = true );
                let val = this.value;
                if( tagName === 'SELECT' && node.hasAttribute( 'multiple' ) ) {
                    val = [];
                    const options = this.options;
                    for( let i = 0, l = options.length; i < l; i = i + 1 ) {
                        options[ i ].selected && val.push( options[ i ].value );
                    }
                } else if( this.type === 'radio' ) {
                    if( !this.checked ) return;
                    val = this.value;
                } else if( this.type === 'checkbox' ) {
                    if( isArray( bind ) ) {
                        if( this.checked ) {
                            bind.push( this.value );
                        } else {
                            for( let i = 0, l = bind.length; i < l; i = i + 1 ) {
                                if( bind[ i ] === this.value ) {
                                    bind.splice( i );
                                    break;
                                }
                            }
                        }
                        return;
                    } else {
                        val = this.checked;
                    }
                } else if( this.isContentEditable ) {
                    val = this.innerHTML;
                }

                let model = value;

                if( value.indexOf( '#' ) > -1 ) {
                    const filters = value.split( /(?:#)(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g );
                    model = filters.shift();

                    if( filters.length ) {
                        val = wrapFilter( stringify( val ), filters );
                    } else {
                        val = stringify( val );
                    }
                } else {
                    val = stringify( val );
                }

                if( $set ) {
                    const exp = model.replace( /\[([\s\d+]+)\]$/, '.$$set($1,' + val + ')' );
                    new Function( 's', 'var __f=J.View.$filters;with(s)' + exp )( scope );
                } else {
                    new Function( 's', 'var __f=J.View.$filters;with(s)' + model + '=' + val )( scope );
                }
            }, debounce );
        };

        if( !eventSupported( 'input', node ) ) {
            // @todo
            console.log( 'eventSupported' );
        }

        node.removeAttribute( ':model' );
    }
};
