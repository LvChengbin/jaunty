import EventCenter from '../../../../src/core/eventcenter';
import View from '../../../../src/extensions/view/index';
var expect = chai.expect;
var bowl = '__ob__';

function genData(n) {
    var ret = [];
	var sexMap = {
		'true': "男",
		'false': "女"
	};
    for( var i = 0; i < n; i++ ) {
        ret.push({
            name: Math.random(),
            age: 3 + Math.ceil((Math.random() * 30)),
            sex: sexMap[1 - Math.random() > 0.5],
            desc: Math.random()
        });
    }
    return ret;
}
window.genData = genData;
window.View = View;

describe( 'Extensions/View', function() {
    var view = window.view = new View( {
        template : '<div></div>',
        scope : {
            text : 'str',
            props : { p1 : 'a', p2 : 'b' },
            list : [ 'a', 'b', 'c' ],
            x : { y : { z : 'z' } },
            attrs : [ { first : 1 }, { last : 2 } ],
            nest : { list : [ { obj : { } } ] }
        }
    } );

    it( 'Should have property __mediator instance of EventCenter', function() {
        expect( view ).and.an.instanceOf( EventCenter );
    } );

    it( 'Should triggered event with event name same as data path after data be changed', function( done ) {
        view.$watch( 'props.p1', function( newVal, oldVal ) {
            expect( newVal ).to.equal( 'new' );
            expect( oldVal ).to.equal( 'a' );
            done();
        } );

        view.scope.props.p1 = 'new';
    } );

    it( 'Should triggered event after additional data be changed', function( done ) {

        view.$watch( 'x.y.z.additional', function( newVal, oldVal ) {
            expect( newVal ).to.equal( false );
            expect( oldVal ).to.equal( true );
            done();
        } );

        view.scope.x.y.z = {
            additional : true
        };

        view.scope.x.y.z.additional = false;
    } );

    it( 'Should have correct path after transdata', function() {
        expect( view.scope[ bowl ].text ).to.equal( view.__id + '.text' );
        expect( view.scope.nest[ bowl ].list ).to.equal( view.__id + '.nest.list' );

        view.scope.text = { 
            prefix : '--',
            content : 't'
        };

        expect( view.scope.text[ bowl ].prefix ).to.equal( view.__id + '.text.prefix' );
    } );
} );


describe( 'Extensions/View/Compile', function() {
    describe( 'Normal Template', function() {

        var view = window.xview = new View( {
            template : 'true1<div>true2</div>true3<span>{{data.name}}</span>',
            scope : {
                data : {
                    name : 'J'
                }
            }
        } );

        it( 'Should compile correct', function() {
            expect( view.$el.firstChild.nodeType ).to.equal( 3 );
            expect( view.$el.firstChild.data ).to.equal( 'true1' );
            expect( view.$el.childNodes[ 1 ].innerHTML ).to.equal( 'true2' );
            expect( view.$el.childNodes[ 2 ].data ).to.equal( 'true3' );
        } );
    } );

    describe( 'Complied Template', function() {

        var view2 = window.view2 = new View( {
            template : [
                '<div $data-x="\'-\' + x + \'-\'" $data-y="\'-\' + y +\'-\'" $data-mix="\'-\' + x + \'-\' + y + \'-\'">a{{x + y}}ccc</div>',
                '<div>{{z.length}}dddd{{n + 10}}e{{attr.name}}</div>'
            ].join( '' ),
            scope : {
                x : '_x_',
                y : '_y_',
                z : '123',
                n : 1,
                m : '_m_',
                text : 'str',
                attr : { name : 'L' },
                list : [ 'a', 'b', 'c' ],
                attrs : [ { first : 1 }, { last : 2 } ]
            }
        } );

        it( 'Should triggered event after modify array with function', function( done ) {
            view2.$watch( 'list', function( newVal ) {
                expect( newVal[ newVal.length - 1 ] ).to.equal( 'd' );
                done();
            } );

            view2.scope.list.push( 'd' );
        } );

        it( 'Should have $set method if data is of array', function( done ) {
            expect( view2.scope.list ).be.have.property( '$set' ).to.be.a( 'function' );
            done();
        } );

        it( 'Should parse text nodes correct', function( done ) {
            expect( view2.$el.firstChild.innerHTML ).to.equal( 'a_x__y_ccc' );
            expect( view2.$el.lastChild.innerHTML ).to.equal( '3dddd11eL' );
            done();
        } );

        it( 'Should parse node attributes correct', function( done ) {
            expect( view2.$el.firstChild.getAttribute( 'data-x' ) ).to.equal( '-_x_-' );
            expect( view2.$el.firstChild.getAttribute( 'data-mix' ) ).to.equal( '-_x_-_y_-' );
            done();
        } );

        it( 'Should modify corresponding text node after scope changed', function( done ) {
            view2.scope.x = '_X_';
            view2.scope.z = '12345';
            expect( view2.$el.firstChild.innerHTML ).to.equal( 'a_X__y_ccc' );
            expect( view2.$el.lastChild.innerHTML ).to.equal( '5dddd11eL' );
            done();
        } );

        it( 'Should modify normal attributes of corresponding node', function( done ) {
            expect( view2.$el.firstChild.getAttribute( 'data-x' ) ).to.equal( '-_X_-' );
            expect( view2.$el.firstChild.getAttribute( 'data-mix' ) ).to.equal( '-_X_-_y_-' );
            done();
        } );

        it( 'Should assign new data into scope with "view.$assign" method', function( done ) {
            view2.$assign( {
                assign1 : '123'
            } );
            expect( view2.scope.assign1 ).to.equal( '123' );
            view2.$assign( view2.scope, {
                assign2 : 123
            } );
            expect( view2.scope.assign2 ).to.equal( 123 );

            view2.$assign( view2.scope.attrs, {
                assign : 124
            } );

            expect( view2.scope.attrs.assign ).to.equal( 124 );
            done();
        } );

        it( 'Should also have correct path even if properties was added by "assgin" method', function( done ) {
            expect( view2.scope[ bowl ].assign2 ).to.equal( view2.__id + '.assign2' );
            expect( view2.scope.attrs[ bowl ].assign ).to.equal( view2.__id + '.attrs.assign' );
            done();
        } );

        it( 'Should also have been converted even if properties was asddes by "assign" method', function( done ) {
            var descriptor = Object.getOwnPropertyDescriptor( view2.scope.attrs, 'assign' );
            expect( descriptor && descriptor.set ).to.be.ok;
            done();
        } );
    } );
} );

describe( 'Extensions/View/Directives', function() {

    var view3 = window.view3 = new View( {
        template : [
            '<div :skip data-x="-{{x}}-" data-mix="\'-\' + x + \'-\'">',
                'a{{x + y}}ccc',
            '</div>',
            '<div $data-m="\'-\' + m + \'-\'">dddd{{n + 10}}e{{attr.name}}</div>'
        ].join( '' ),
        scope : {
            x : '_x_',
            y : '_y_',
            z : '123',
            n : 1,
            m : '_m_',
            text : 'str',
            attr : { name : 'L' },
            list : [ 'a', 'b', 'c' ],
            attrs : [ { first : 1 }, { last : 2 } ]
        }
    } );

    describe( ':skip', function() {
        it( 'Should skip parse all attributes if node has ":skip" directive', function( done ) {
            expect( view3.$el.firstChild.getAttribute( 'data-x' ) ).to.equal( '-{{x}}-' );
            expect( view3.$el.firstChild.innerHTML ).to.equal( 'a{{x + y}}ccc' );
            done();
        } );
        it( 'Should not affect other nodes', function( done ) {
            expect( view3.$el.lastChild.getAttribute( 'data-m' ) ).to.equal( '-_m_-' );
            expect( view3.$el.lastChild.innerHTML ).to.equal( 'dddd11eL' );
            done();
        } );
        it( 'Should removed the ":skip" attribute from node', function( done ) {
            expect( view3.$el.firstChild.hasAttribute( ':skip' ) ).to.be.not.ok;
            done();
        } );
    } );

    var view4 = window.view4 = new View( {
        template : [
            '<div :pre $data-x="\'-\' + x + \'-\'" $data-mix="\'-\' + x + \'-\'">',
                'a{{x + y}}ccc',
            '</div>',
            '<div $data-m="\'-\' + m + \'-\'">dddd{{n + 10}}e{{attr.name}}</div>'
        ].join( '' ),
        scope : {
            x : '_x_',
            y : '_y_',
            z : '123',
            n : 1,
            m : '_m_',
            text : 'str',
            attr : { name : 'L' },
            list : [ 'a', 'b', 'c' ],
            attrs : [ { first : 1 }, { last : 2 } ]
        }
    } );

    describe( ':pre', function() {
        it( 'Should not parse childnodes', function( done ) {
            expect( view4.$el.firstChild.innerHTML ).to.equal( 'a{{x + y}}ccc' );
            done();
        } );

        it( 'Should still parse attributes', function( done ) {
            expect( view4.$el.firstChild.getAttribute( 'data-x' ) ).to.equal( '-_x_-' );
            done();
        } );

        it( 'Should not affect other nodes', function( done ) {
            expect( view3.$el.lastChild.getAttribute( 'data-m' ) ).to.equal( '-_m_-' );
            expect( view3.$el.lastChild.innerHTML ).to.equal( 'dddd11eL' );
            done();
        } );

        it( 'Should removed the ":pre" attribute from node', function( done ) {
            expect( view3.$el.firstChild.hasAttribute( ':pre' ) ).to.be.not.ok;
            done();
        } );
    } );

    var view = window.view5 = new View( {
        template : [
            '<div :if="true">true</div>',
            '<div :if="display">display</div>',
            '<div :if="false">false</div>',
            '<div :if="show">!show</div>',
            '<div :if="outer"><div :if="inner">inner</div></div>',
            '<div :else>in else</div>'
        ].join( '' ),
        scope : {
            display : true,
            show : false,
            outer : true,
            inner : true
        }
    } );

    describe( ':if & :else', function() {
        it( ':if with condition "true"', function( done ) {
            expect( view.$el.firstChild.innerHTML ).to.equal( 'true' );
            expect( view.$el.childNodes[ 1 ].innerHTML ).to.equal( 'display' );
            done();
        } );

        it( ':if with condition "false"', function() {
            expect( view.$el.childNodes[ 2 ].nodeType ).to.equal( 3 );
            expect( view.$el.childNodes[ 3 ].nodeType ).to.equal( 3 );
        } );

        it( 'Should re-render after scope data has been changed', function() {
            view.scope.display = false;
            expect( view.$el.childNodes[ 1 ].nodeType ).to.equal( 3 );

            view.scope.display = true;
            expect( view.$el.childNodes[ 1 ].innerHTML ).to.equal( 'display' );
            
            view.scope.show = true;
            expect( view.$el.childNodes[ 3 ].innerHTML ).to.equal( '!show' );

            view.scope.show = false;
            expect( view.$el.childNodes[ 3 ].nodeType ).to.equal( 3 );

            view.scope.show = true;
            expect( view.$el.childNodes[ 3 ].innerHTML ).to.equal( '!show' );

        } );

        it( 'Should compile nested ":if" directive correct', function() {
            expect( view.$el.childNodes[ 4 ] ).to.be.ok;
            expect( view.$el.childNodes[ 4 ].childNodes[ 0 ].innerHTML ).to.equal( 'inner' );
            view.scope.inner = false;
            expect( view.$el.childNodes[ 4 ].childNodes[ 0 ].nodeType ).to.equal( 3 );
        } );

        it( ':else', function() {
            expect( view.$el.childNodes[ 5 ].$isAnchor ).to.be.ok;
            view.scope.outer = false;
            expect( view.$el.childNodes[ 5 ].innerHTML ).to.equal( 'in else');
            view.scope.outer = true;
            expect( view.$el.childNodes[ 5 ].$isAnchor ).to.be.ok;
        } );
    } );

    describe( ':show', function() {
        var view = window.viewShow = new View( {
            template : [
                '<div :show="show">show</div>',
                '<div :else>not show</div>'
            ].join( '' ),
            scope : {
                show : true
            }
        } );

        it( 'Should has been shown with "show" is true', function() {
            expect( view.$el.firstChild.style.display ).to.not.equal( 'none' );
            expect( view.$el.childNodes[ 1 ].style.display ).to.equal( 'none' );
            view.scope.show = false;

            expect( view.$el.firstChild.style.display ).to.equal( 'none' );
            expect( view.$el.childNodes[ 1 ].style.display ).to.not.equal( 'none' );
        } );

    } );

    describe( ':once', function() {
        var view6 = window.view6 = new View( {
            template : [
                '<div :once :if="show">{{ text }}</div>'
            ].join( '' ),
            scope : {
                show : true,
                text : 'name'
            }
        } );

        it( 'Should be compiled correct', function() {
            expect( view6.$el.firstChild.innerHTML ).to.equal( 'name' );
        } );

        it( 'Should not be re-compiled', function() {
            view6.scope.text = 'new';
            expect( view6.$el.firstChild.innerHTML ).to.equal( 'name' );
        } );
    } );

    describe( ':for', function() {

        describe( ':for...in', function() {
            var view7 = window.view7 = new View( {
                template : [
                    '<ul>',
                        '<li :for="item, value, index in data" $data-item="item" class="li-1">',
                            '<span>{{index}}.{{item}} : {{value.en}}</span>',
                            '<ul class="l2">',
                                '<li :for="x,y,i in value.sub" $data-item="x" $data-value="y" class="li-2">{{i}}.{{x}} : {{y}}</li>',
                            '</ul>',
                        '</li>',
                    '</ul>'
                ].join( '' ),
                scope : {
                    data : {
                        name : { en : 'J', sub : { sub : 'ssssub' } },
                        version : { en : '0.0.1', sub : { sub : 'ssssub2' } }
                    },
                }
            } );

            it( 'Shoule be compiled correct', function() {
                expect( view7.$el.querySelectorAll( '.li-1' ).length ).to.equal( 2 );
                expect( view7.$el.querySelectorAll( '.li-2' ).length ).to.equal( 2 );
            } );

            it( 'Should compiled attribute correct', function() {
                expect( view7.$el.querySelector( '.li-1' ).getAttribute( 'data-item' ) ).to.equal( 'name' );
                expect( view7.$el.querySelector( '.li-1 span' ).innerHTML ).to.equal( '0.name : J' );
            } );

            it( 'Should have been re-compiled after value is changed', function() {
                view7.scope.data.name.sub.sub = '123';
                expect( view7.$el.querySelector( '.li-2' ).getAttribute( 'data-value' ) ).to.equal( '123' );
                expect( view7.$el.querySelector( '.li-2' ).innerHTML ).to.equal( '0.sub : 123' );
            } );

            it( 'Should have been re-compiled after change data to another object', function() {
                view7.scope.data = { sex : { en : 'Male', sub : {sub : 'new sub' } } };
                expect( view7.$el.querySelectorAll( '.li-1' ).length ).to.equal( 1 );
                expect( view7.$el.querySelector( '.li-1' ).getAttribute( 'data-item' ) ).to.equal( 'sex' );
                expect( view7.$el.querySelectorAll( '.li-2' ).length ).to.equal( 1 );
                expect( view7.$el.querySelector( '.li-2' ).getAttribute( 'data-item' ) ).to.equal( 'sub' );
                expect( view7.$el.querySelector( '.li-2' ).getAttribute( 'data-value' ) ).to.equal( 'new sub' );
                expect( view7.$el.querySelector( '.li-2' ).innerHTML ).to.equal( '0.sub : new sub' );
            } );

            it( 'Should have been re-compiled after object add new property', function() {
                view7.$assign( view7.scope.data, { 
                    content : {
                        en : 'content',
                        sub : { sub : 'sub3' }
                    }
                } );

                expect( view7.$el.querySelectorAll( '.li-1' ).length ).to.equal( 2 );
                expect( view7.$el.querySelectorAll( '.li-1' )[ 1 ].getAttribute( 'data-item' ) ).to.equal( 'content' );
                expect( view7.$el.querySelectorAll( '.li-2' ).length ).to.equal( 2 );
                expect( view7.$el.querySelectorAll( '.li-2' )[ 1 ].getAttribute( 'data-item' ) ).to.equal( 'sub' );
                expect( view7.$el.querySelectorAll( '.li-2' )[ 1 ].getAttribute( 'data-value' ) ).to.equal( 'sub3' );
                expect( view7.$el.querySelectorAll( '.li-2' )[ 1 ].innerHTML ).to.equal( '0.sub : sub3' );

                view7.scope.data.content.sub.sub = 'sub4';
                expect( view7.$el.querySelectorAll( '.li-2' )[ 1 ].innerHTML ).to.equal( '0.sub : sub4' );
            } );
        } );

        describe( ':for...of simple', function() {
            var view8 = window.view8 = new View( {
                template : [
                    '<div>',
                        '<span :for="item of list">{{item}}</span>',
                    '</div>'
                ].join( '' ),
                scope : {
                    list : [ 'a', 1 ]
                }
            } );

            it( 'render', function() {
                expect( view8.$el.querySelectorAll( 'span' ).length ).equal( 2 );
                expect( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( 'a' );
                expect( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '1' );
            } );

            it( 'change', function() {
                view8.scope.list = [ 'b', 2, 1 ];
                expect( view8.$el.querySelectorAll( 'span' ).length ).equal( 3 );
                expect( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( 'b' );
                expect( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
                expect( view8.$el.querySelectorAll( 'span' )[ 2 ].innerHTML ).equal( '1' );
            } );

            it( 'splice', function(){
                view8.scope.list.splice( 2 ); // b, 2
                expect( view8.$el.querySelectorAll( 'span' ).length ).equal( 2 );
                expect( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( 'b' );
                expect( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
            } );

            it( 'push & unshift', function() {
                view8.scope.list.push( 3 ); // b, 2, 3
                expect( view8.$el.querySelectorAll( 'span' ).length ).equal( 3 );
                expect( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( 'b' );
                expect( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
                expect( view8.$el.querySelectorAll( 'span' )[ 2 ].innerHTML ).equal( '3' );
                view8.scope.list.unshift( 3 ); // 3, b, 2, 3
                expect( view8.$el.querySelectorAll( 'span' ).length ).equal( 4 );
                expect( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( '3' );
                expect( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( 'b' );
                expect( view8.$el.querySelectorAll( 'span' )[ 2 ].innerHTML ).equal( '2' );
                expect( view8.$el.querySelectorAll( 'span' )[ 3 ].innerHTML ).equal( '3' );
            } );

            it( 'pop', function() {
                view8.scope.list.pop(); // 3, b, 2
                expect( view8.$el.querySelectorAll( 'span' ).length ).equal( 3 );
                expect( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( '3' );
                expect( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( 'b' );
                expect( view8.$el.querySelectorAll( 'span' )[ 2 ].innerHTML ).equal( '2' );
            } );

            it( 'shift', function() {
                view8.scope.list.shift(); // b, 2
                expect( view8.$el.querySelectorAll( 'span' ).length ).equal( 2 );
                expect( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( 'b' );
                expect( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
            } );

            it( '$set', function() {
                view8.scope.list.$set( 0, 0 ); // 0, 2
                expect( view8.$el.querySelectorAll( 'span' ).length ).equal( 2 );
                expect( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( '0' );
                expect( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
                view8.scope.list.$set( 3, 3 ); // 0, 2, undefined, 3
                expect( view8.$el.querySelectorAll( 'span' ).length ).equal( 4 );
                expect( view8.$el.querySelectorAll( 'span' )[ 0 ].innerHTML ).equal( '0' );
                expect( view8.$el.querySelectorAll( 'span' )[ 1 ].innerHTML ).equal( '2' );
                expect( view8.$el.querySelectorAll( 'span' )[ 2 ].innerHTML ).equal( 'undefined' );
                expect( view8.$el.querySelectorAll( 'span' )[ 3 ].innerHTML ).equal( '3' );
            } );


        } );

        describe( ':for...of complex', function() {
            var list = genData( 100 );
            var view = window.view9 = new View( {
                template : [
                    '<ul>',
                        '<li :for="x, i of list" $data-i="i">',
                            '{{i + 1}}. {{x.name}}',
                        '</li>',
                    '</ul>'
                ].join( '' ),
                scope : {
                    list : list
                }
            } );

            it( 'render', function() {
                var lis = view.$el.querySelectorAll( 'li' );
                expect( view.$el.querySelectorAll( 'li' ).length ).to.equal( 100 );
                expect( lis[ 0 ].innerHTML ).to.equal( '1. ' + list[ 0 ].name );
                expect( lis[ 1 ].innerHTML ).to.equal( '2. ' + list[ 1 ].name );
            } );

            it( 'change', function() {
                var list = view.scope.list = genData( 99 );
                var lis = view.$el.querySelectorAll( 'li' );
                expect( view.$el.querySelectorAll( 'li' ).length ).to.equal( 99 );
                expect( lis[ 0 ].innerHTML ).to.equal( '1. ' + list[ 0 ].name );
                expect( lis[ 1 ].innerHTML ).to.equal( '2. ' + list[ 1 ].name );
                view.scope.list[ 0 ].name = 'JJ';
                expect( lis[ 0 ].innerHTML ).to.equal( '1. JJ' );
                view.scope.list.$set( 0, { a : 1, b : 2, name : 'xxx' } );
                expect( lis[ 0 ].innerHTML ).to.equal( '1. xxx' );
            } );

            it( 'splice', function() {
                view.scope.list.splice( 10, 10 );
                var lis = view.$el.querySelectorAll( 'li' );
                expect( lis[ 50 ].innerHTML ).to.equal( '51. ' + list[ 50 ].name );
            } );

            it( 'push & unshift', function() {
                view.scope.list = genData( 10 );
                view.scope.list.push( genData( 1 )[ 0 ] );
                view.scope.list[ 10 ].name = 'NEW';
                var lis = view.$el.querySelectorAll( 'li' );
                expect( lis[ 10 ].innerHTML ).to.equal( '11. NEW' );
            } );

            it( 'pop', function() {
                view.scope.list = genData( 10 );
                view.scope.list.pop();
                expect( view.$el.querySelectorAll( 'li' ).length ).to.equal( 9 );
            } );

            it( 'shift', function() {
                view.scope.list = genData( 10 );
                view.scope.list.shift();
                var lis = view.$el.querySelectorAll( 'li' );
                expect( lis.length ).to.equal( 9 );
                expect( lis[ 0 ].innerHTML ).to.equal( '1. ' + view.scope.list[ 0 ].name );
            } );

            it( '$set', function() {
                view.scope.list = genData( 10 );
                view.scope.list.$set( 0, { name : 'haha', a : 1, b : 2, c : 3, d : 5, e : 5 } );
                expect( view.$el.querySelector( 'li' ).innerHTML ).to.equal( '1. haha' );
            } );
        } );

        describe( ':for...in in :for...of', function() {
            var list = genData( 100 );
            var view = window.view10 = new View( {
                url : '/ns/jolin/test/extra/html/table.html',
                scope : {
                    list : list
                }
            } );

            it( 'render', function() {
                var tds = view.$el.querySelectorAll( 'td' );
                expect( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 100 );
                expect( tds.length ).to.equal( 500 );
                var key = Object.keys( list[ 0 ] );
                expect( tds[ 0 ].innerHTML ).to.equal( list[ 0 ].name.toString() );
                expect( tds[ 1 ].innerHTML ).to.equal( key[ 0 ] + ' : ' + list[ 0 ][ key[ 0 ] ] );
            } );

            it( 'change', function() {
                view.scope.list = genData( 99 );
                var tds = view.$el.querySelectorAll( 'td' );
                expect( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 99 );
                expect( tds.length ).to.equal( 495 );
                var key = Object.keys( list[ 0 ] );
                expect( tds[ 0 ].innerHTML ).to.equal( list[ 0 ].name.toString() );
                expect( tds[ 1 ].innerHTML ).to.equal( key[ 0 ] + ' : ' + list[ 0 ][ key[ 0 ] ] );
                view.scope.list[ 0 ].name = 'JJ';
                expect( tds[ 0 ].innerHTML ).to.equal( 'JJ' );
                view.$assign( view.scope.list[ 0 ], {
                    additional : 'added'
                } );
                expect( view.$el.querySelector( 'tr' ).querySelectorAll( 'td' ).length ).to.equal( 6 );

                view.scope.list.$set( 0, { a : 1, b : 2, c : 3, d : 4 } );
            } );

            it( 'splice', function() {
                view.scope.list.splice( 10, 10 );
                var tds = view.$el.querySelectorAll( 'td' );
                expect( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 89 );
                expect( tds[ 50 ].innerHTML ).to.equal( list[ 10 ].name.toString() );
            } );

            it( 'push & unshift', function() {
                view.scope.list = genData( 10 );
                view.scope.list.push( genData( 1 )[ 0 ] );
                var trs = view.$el.querySelectorAll( 'tr' );
                expect( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 11 );
                expect( trs[ 10 ].querySelectorAll( 'td' ).length ).to.equal( 5 ); 
                var keys = Object.keys( view.scope.list[ 10 ] );
                expect( trs[ 10 ].querySelectorAll( 'td' )[1].innerHTML ).to.equal( keys[ 0 ] + ' : ' + view.scope.list[ 10 ][ keys[ 0 ] ]);
                view.scope.list[ 10 ][ keys[ 0 ] ] = 'NEW';
                expect( trs[ 10 ].querySelectorAll( 'td' )[1].innerHTML ).to.equal( keys[ 0 ] + ' : NEW' );
            } );

            it( 'pop', function() {
                view.scope.list = genData( 10 );
                view.scope.list.pop();
                expect( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 9 );
            } );

            it( 'shift', function() {
                view.scope.list = genData( 10 );
                view.scope.list.shift();
                var trs = view.$el.querySelectorAll( 'tr' );
                expect( view.$el.querySelectorAll( 'tr' ).length ).to.equal( 9 );
                expect( trs[ 0 ].getAttribute( 'data-i' ) ).to.equal( '0' );
            } );

            it( '$set', function() {
                view.scope.list = genData( 10 );
                view.scope.list.$set( 0, { name : 'haha', a : 1, b : 2, c : 3, d : 5, e : 5 } );
                var trs = view.$el.querySelectorAll( 'tr' );
                expect( trs[ 0 ].querySelectorAll( 'td' ).length ).to.equal( 7 );
            } );
        } );

    } );

    var isShow = function( node ) {
        expect( node.$isAnchor ).to.be.not.ok;
    };

    var isNotShow = function( node ) {
        expect( node.$isAnchor ).to.be.ok;
    };

    describe( ':if in for', function() {
        describe( ':if in :for...of', function() {

            var view = window.view11 = new View( {
                template : '<p :for="item, i of list" :if="item%2">{{i}}. {{item}}</p>',
                scope : {
                    list : [ 0, 1, 2, 3, 4, 5, 6 ] 
                }
            } );
            it( 'show even', function( done ) {
                var el = view.$el;
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                var childNodes = el.childNodes;
                for( var i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    i % 2 ? isNotShow( childNodes[ i ] ) : isShow( childNodes[ i ] );
                }
                done();
            } );

            it( 'modify list', function( done ) {
                view.scope.list.shift(); // 1,2,3,4,5,6
                var el = view.$el;
                var i, l;
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                var childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                var items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                view.scope.list.$set( 0, 99 ); // 99, 2, 3, 4, 5 6

                childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                expect( el.childNodes[ 1 ].innerHTML ).to.equal( '0. 99' );

                view.scope.list.$set( 1, 77 ); // 99, 77, 3, 4, 5
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 4 );

                childNodes = el.childNodes;
                isNotShow( childNodes[ 4 ] );

                view.scope.list = [ 1, 2, 3, 4, 5, 6 ];

                el = view.$el;
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                view.scope.list.$set( 1, 99 ); // 1,99,3,4,5,6
                el = view.$el;
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 4 );
                childNodes = el.childNodes;

                isShow( childNodes[ 2 ] );
                expect( childNodes[ 2 ].innerHTML ).to.equal( '1. 99' );

                done();
            } );

        } );

        describe( ':if in for...of complex', function() {
            var view = window.view12 = new View( {
                template : '<p :for="item, i of list" :if="item.val%2">{{i}}. {{item.val}}</p>',
                scope : {
                    list : [ 
                        { val : 0 }, 
                        { val : 1 },
                        { val : 2 },
                        { val : 3 },
                        { val : 4 },
                        { val : 5 },
                        { val : 6 }
                    ] 
                }
            } );

            it( 'show even', function( done ) {
                var el = view.$el;
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                var childNodes = el.childNodes;
                for( var i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    i % 2 ? isNotShow( childNodes[ i ] ) : isShow( childNodes[ i ] );
                }
                done();
            } );

            it( 'modify list', function( done ) {
                view.scope.list.shift(); // 1,2,3,4,5,6
                var el = view.$el;
                var i, l;
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                var childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                var items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                view.scope.list.$set( 0, { val : 99 } ); // 99, 2, 3, 4, 5 6

                childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                expect( el.childNodes[ 1 ].innerHTML ).to.equal( '0. 99' );

                view.scope.list.$set( 1, { val : 77 } ); // 99, 77, 3, 4, 5
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 4 );

                childNodes = el.childNodes;
                isNotShow( childNodes[ 4 ] );

                view.scope.list = [ 
                    { val : 1 },
                    { val : 2 },
                    { val : 3 },
                    { val : 4 },
                    { val : 5 },
                    { val : 6 }
                ];

                el = view.$el;
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                childNodes = el.childNodes;
                for( i = 1, l = childNodes.length - 1; i < l; i += 1 ) {
                    if( childNodes[ i ].$forEnd ) break;
                    i % 2 ? isShow( childNodes[ i ] ) : isNotShow( childNodes[ i ] );
                }
                items = el.firstChild.$items;

                for( i = 0, l = items.length; i < l; i += 1 ) {
                    i % 2 ? isNotShow( items[ i ] ) : isShow( items[ i ] );
                }

                view.scope.list.$set( 1, { val : 99 } ); // 1,99,3,4,5,6
                el = view.$el;
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 4 );
                childNodes = el.childNodes;

                isShow( childNodes[ 2 ] );
                expect( childNodes[ 2 ].innerHTML ).to.equal( '1. 99' );


                done();
            } );
        } );

        describe( ':if in :for...in', function() {
            var view = window.view13 = new View( {
                template : '<p :for="key, val in data" :if="!(val.id%2)">{{key}}. {{val.id}}</p>',
                scope : {
                    data : {
                        x0 : { id : 0 },
                        x1 : { id : 1 },
                        x2 : { id : 2 }
                    }
                }
            } );

            it( 'Should show correct', function( done ) {
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 2 );
                done();
            } );

            it( 'modify data', function( done ) {
                view.scope.data.x1.id = 4;
                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 3 );
                expect( view.$el.querySelectorAll( 'p' )[ 1 ].innerHTML ).to.equal( 'x1. 4' );

                view.$assign( view.scope.data, { 
                    x3 : { id : 3 },
                    x4 : { id : 4 } 
                } );

                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 4 );
                expect( view.$el.querySelectorAll( 'p' )[ 3 ].innerHTML ).to.equal( 'x4. 4' );

                view.scope.data = {
                    x10 : { id : 10 },
                    x11 : { id : 11 },
                    x12 : { id : 12 }
                };

                expect( view.$el.querySelectorAll( 'p' ).length ).to.equal( 2 );
                expect( view.$el.querySelectorAll( 'p' )[ 1 ].innerHTML ).to.equal( 'x12. 12' );

                done();
            } );
        } );
    } );
} );
