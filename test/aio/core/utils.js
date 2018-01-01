/* global J:false, expect:false */

( function() {
var script = J.Utils.currentScript();

describe( 'utils', function() {
    describe( 'uniqueId', function() {
        it( 'Should return an auto increment id', function( done ) {
            var i = J.Utils.uniqueId();
            expect( J.Utils.uniqueId() ).to.equal( i + 1 );
            done();
        } );
    } );

    describe( 'J.Utils.checks', function() {
        it( 'Should be an object', function( done ) {
            expect( J.Utils.checks.object( {} ) ).to.be.true;
            done();
        } );

        it( 'Should be an arrow function ', function() {
            // not working in IE
            /*
            expect( J.Utils.checks.arrowFunction( () => {} ) ).to.be.true;
            expect( J.Utils.checks.arrowFunction( ( x, y ) => { [ x, y ] } ) ).to.be.true;
            expect( J.Utils.checks.arrowFunction( ( x ) => x ) ).to.be.true;
            expect( J.Utils.checks.arrowFunction( x => x ) ).to.be.true;
            expect( J.Utils.checks.arrowFunction( ( function() { return () => {} } )() ) ).to.be.true;
            */
        } );

        it( 'Should not be an arrow function', function( done ) {
            expect( J.Utils.checks.arrowFunction( function() {} ) ).to.be.false;
            done();
        } );
    } );

    describe( 'J.Utils.currentScript', function() {
        it( 'Should get the <script> tag which loaded current script', function( done ) {
            expect( script ).to.equal( document.getElementById( 'script-utils' ) );
            done();
        } );
    } );

    describe( 'J.Utils.realPath', function() {
        it( 'url', function( done ) {
            expect( J.Utils.realPath( 'http://www.nextseason.cc' ) ).to.equal( 'http://www.nextseason.cc' );
            done();
        } );

        it( 'url + absolute path', function( done ) {
            expect( J.Utils.realPath( 'http://www.nextseason.cc', '/path' ) ).to.equal( 'http://www.nextseason.cc/path' );
            done();
        } );

        it( 'base + absolute path', function( done ) {
            expect( J.Utils.realPath( 'http://www.nextseason.cc/a/b/c', '/path' ) ).to.equal( 'http://www.nextseason.cc/a/b/c/path' );
            done();
        } );

        it( 'base + relative path', function( done ) {
            expect( J.Utils.realPath( 'http://www.nextseason.cc/a/b/c', '../path' ) ).to.equal( 'http://www.nextseason.cc/a/b/path' );
            expect( J.Utils.realPath( 'http://www.nextseason.cc/a/b/c', '../../path' ) ).to.equal( 'http://www.nextseason.cc/a/path' );
            done();
        } );
    } );

    describe( 'J.Utils.encodeHTML', function() {
        it( 'shoult be ok', function( done ) {
            expect( J.Utils.encodeHTML ).to.be.a( 'function' );
            done();
        } );
    } );

    describe( 'J.Utils.escapeCSS', function() {
        it( 'shoult be ok', function( done ) {
            expect( J.Utils.escapeCSS ).to.be.a( 'function' );
            done();
        } );
    } );

    describe( 'J.Utils.escapeReg', function() {
        it( 'shoult be ok', function( done ) {
            expect( J.Utils.escapeReg ).to.be.a( 'function' );
            done();
        } );
    } );

    describe( 'J.Utils.stringf', function() {
        it( 'Should support simple variable', function( done ) {
            expect( J.Utils.stringf( '{#name#}', { name : 'J' } ) ).to.equal( 'J' );
            done();
        } );

        it( 'Should support costumize delimiter', function( done ) {
            expect( J.Utils.stringf( '-name-', { name : 'J' }, '-', '-' ) ).to.equal( 'J' );
            done();
        } );

        it( 'Should support simple operation', function( done ) {
            expect( J.Utils.stringf( '{#3+1#}' ) ).to.equal( '4' );
            done();
        } );

        it( 'Should support ternary operator', function( done ) {
            expect( J.Utils.stringf( '{# false ? "Y" : "N" #}' ) ).to.equal( 'N' );
            done();
        } );

        it( 'Should support complex javascript expression', function() {
            // not working in IE
            //expect( J.Utils.stringf( '{# ( () => 1 )() #}' ) ).to.equal( '1' );
        } );

        it( 'Should support call a native function', function( done ) {
            expect( J.Utils.stringf( '{#str.trim() #}', { str : '    a    ' } ) ).to.equal( 'a' );
            done();
        } );

        it( 'Should support parse a variable in multiple level chain', function( done ) {
            expect( J.Utils.stringf( '{# str.sub #}', { str : { sub : 'a' } } ) ).to.equal( 'a' );
            done();
        } );

        it( 'Should support costumize delimiter', function( done ) {
            expect( J.Utils.stringf( '-name-"name"', { name : 'J' }, '-', '-' ) ).to.equal( 'J"name"' );
            done();
        } );

        it( 'Should get empty string if cannot find value in data', function( done ) {
            expect( J.Utils.stringf( '{#name#}name', {} ) ).to.equal( 'name' );
            done();
        } );

        it( 'Should support && operator', function( done ) {
            expect( J.Utils.stringf( '{# show && "YES" #}', { show : true } ) ).to.equal( 'YES' );
            done();
        } );

        it( 'Should support && operator', function( done ) {
            expect( J.Utils.stringf( '{# show || "NO" #}', { show : false } ) ).to.equal( 'NO' );
            done();
        } );
    } );

    describe( 'J.Utils.extract', function() {
        it( 'Should enable to get data with a property chain', function( done ) {
            expect( J.Utils.extract( 'a.b.c', {
                a : { b : { c : 'str' } }
            } ) ).to.equal( 'str' );
            done();
        } );

        it( 'Should get an undefined if cannot fill the chain completely', function( done ) {
            expect( J.Utils.extract( 'a.b.c', {
            } ) ).to.be.an( 'undefined' );
            done();
        } );
    } );

    describe( 'J.Utils.param', function() {
        it( 'Should return correct params string from a simple object', function( done ) {
            expect( J.Utils.param( { x : 1, y : 2, z : '3' } ) ).to.equal( 'x=1&y=2&z=3' );
            done();
        } );

        it( 'Should return correct params string from an object with Array', function( done ) {
            expect( J.Utils.param( { arr : [1,2] } ) ).to.equal( 'arr%5B%5D=1&arr%5B%5D=2' );
            done();
        } );

        it( 'Should return correct params string from an object with Object', function( done ) {
            expect( J.Utils.param( { obj: { x : 1, y : 2 } } ) ).to.equal( 'obj%5Bx%5D=1&obj%5By%5D=2' );
            done();
        } );

        it( 'Should return correct params string from an object with Function', function( done ) {
            expect( J.Utils.param( { obj: function() { return 1; } } ) ).to.equal( 'obj=1' );
            done();
        } );
    } );

    describe( 'J.Utils.md5', function() {
        it( 'Should return the correct md5 value from an empty string ', function( done ) {
            expect( J.Utils.md5( '' ) ).to.equal( 'd41d8cd98f00b204e9800998ecf8427e' );
            done();
        } );

        it( 'Should return the correct md5 value frome a short sting', function( done ) {
            expect( J.Utils.md5( 'd41d8cd98f00b204e9800998ecf8427e' ) ).to.equal( '74be16979710d4c4e7c6647856088456' );
            done();
        } );

        it( 'Should return the corrent md5 value from a string with Chinsese characters', function( done ) {
            expect( J.Utils.md5( '你好' ) ).to.equal( '7eca689f0d3389d9dea66ae112e5cfd7' );
            done();
        } );

        it( 'Should return the correct md5 value from a big string with Chinese characters init', function( done ) {
            expect( J.Utils.md5( '该事件被严肃问责人员共计10人。其中，对常州市高新区管委会原副主任、新北区原副区长陆平和常州黑牡丹建设投资有限公司总经理高国伟分别给予撤销党内职务、降级处分，对常州高新区管委会副主任陆建华给予党内严重警告处分、引咎辞职，对市教育局局长丁伟明、市教育局原副局长王定新、新北区环保局原局长蒋新耀分别给予党内警告处分，对新北区环保局监察大队大队长吴荣炳给予记大过处分，对新北区环保局副局长黄震给予记过处分，对常州黑牡丹建设投资有限公司副总经理李飞、项目现场负责人蒋跃栋分别给予免职。对新北区人民政府给予通报批评，并责成其向市政府作出深刻检查。新北区有关部门已依法对相关单位作出行政处罚。' ) ).to.equal( '867d6adbc4cb96eb04ba9084ec2641fc' );
            done();
        } );
    } );
} );
})();
