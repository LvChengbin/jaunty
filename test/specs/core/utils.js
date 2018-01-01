import {
    uniqueId,
    checks,
    currentScript,
    realPath,
    encodeHTML,
    escapeCSS,
    escapeReg,
    stringf,
    extract,
    param,
    md5
} from '../../../src/core/utils.js';

var expect = chai.expect;
var script = currentScript();

describe( 'utils', function() {
    describe( 'uniqueId', function() {
        it( 'Should return an auto increment id', function() {
            var i = uniqueId();
            expect( uniqueId() ).to.equal( i + 1 );
        } );
    } );

    describe( 'checks', function() {
        it( 'Should be an object', function() {
            expect( checks.object( {} ) ).to.be.true;
        } );

        it( 'Should be an arrow function ', function() {
            expect( checks.arrowFunction( () => {} ) ).to.be.true;
            expect( checks.arrowFunction( ( x, y ) => { [ x, y ] } ) ).to.be.true;
            expect( checks.arrowFunction( ( x ) => x ) ).to.be.true;
            expect( checks.arrowFunction( x => x ) ).to.be.true;
            expect( checks.arrowFunction( ( function() { return () => {} } )() ) ).to.be.true;
        } );

        it( 'Should not be an arrow function', function() {
            expect( checks.arrowFunction( function() {} ) ).to.be.false;
        } );
    } );

    describe( 'currentScript', function() {
        it( 'Should get the <script> tag which loaded current script', function() {
            expect( script ).to.equal( document.getElementById( 'specs-js' ) );
        } );
    } );

    describe( 'realPath', function() {
        it( 'url', function() {
            expect( realPath( 'http://www.nextseason.cc' ) ).to.equal( 'http://www.nextseason.cc' );
        } );

        it( 'url + absolute path', function() {
            expect( realPath( 'http://www.nextseason.cc', '/path' ) ).to.equal( 'http://www.nextseason.cc/path' );
        } );

        it( 'base + absolute path', function() {
            expect( realPath( 'http://www.nextseason.cc/a/b/c', '/path' ) ).to.equal( 'http://www.nextseason.cc/a/b/c/path' );
        } );

        it( 'base + relative path', function() {
            expect( realPath( 'http://www.nextseason.cc/a/b/c', '../path' ) ).to.equal( 'http://www.nextseason.cc/a/b/path' );
            expect( realPath( 'http://www.nextseason.cc/a/b/c', '../../path' ) ).to.equal( 'http://www.nextseason.cc/a/path' );
        } );
    } );

    describe( 'encodeHTML', function() {
        it( 'shoult be ok', function() {
            expect( encodeHTML ).to.be.a( 'function' );
        } );
    } );

    describe( 'escapeCSS', function() {
        it( 'shoult be ok', function() {
            expect( escapeCSS ).to.be.a( 'function' );
        } );
    } );

    describe( 'escapeReg', function() {
        it( 'shoult be ok', function() {
            expect( escapeReg ).to.be.a( 'function' );
        } );
    } );

    describe( 'stringf', function() {
        it( 'Should support simple variable', function() {
            expect( stringf( '{#name#}', { name : 'J' } ) ).to.equal( 'J' );
        } );

        it( 'Should support costumize delimiter', function() {
            expect( stringf( '-name-', { name : 'J' }, '-', '-' ) ).to.equal( 'J' );
        } );

        it( 'Should support simple operation', function() {
            expect( stringf( '{#3+1#}' ) ).to.equal( '4' );
        } );

        it( 'Should support ternary operator', function() {
            expect( stringf( '{# false ? "Y" : "N" #}' ) ).to.equal( 'N' );
        } );

        it( 'Should support complex javascript expression', function() {
            expect( stringf( '{# ( () => 1 )() #}' ) ).to.equal( '1' );
        } );

        it( 'Should support call a native function', function() {
            expect( stringf( '{#str.trim() #}', { str : '    a    ' } ) ).to.equal( 'a' );
        } );

        it( 'Should support parse a variable in multiple level chain', function() {
            expect( stringf( '{# str.sub #}', { str : { sub : 'a' } } ) ).to.equal( 'a' );
        } );

        it( 'Should support costumize delimiter', function() {
            expect( stringf( '-name-"name"', { name : 'J' }, '-', '-' ) ).to.equal( 'J"name"' );
        } );

        it( 'Should get empty string if cannot find value in data', function() {
            expect( stringf( '{#name#}name', {} ) ).to.equal( 'name' );
        } );

        it( 'Should support && operator', function() {
            expect( stringf( '{# show && "YES" #}', { show : true } ) ).to.equal( 'YES' );
        } );

        it( 'Should support && operator', function() {
            expect( stringf( '{# show || "NO" #}', { show : false } ) ).to.equal( 'NO' );
        } );
    } );

    describe( 'extract', function() {
        it( 'Should enable to get data with a property chain', function() {
            expect( extract( 'a.b.c', {
                a : { b : { c : 'str' } }
            } ) ).to.equal( 'str' );
        } );

        it( 'Should get an undefined if cannot fill the chain completely', function() {
            expect( extract( 'a.b.c', {
            } ) ).to.be.an( 'undefined' );
        } );
    } );

    describe( 'param', function() {
        it( 'Should return correct params string from a simple object', function() {
            expect( param( { x : 1, y : 2, z : '3' } ) ).to.equal( 'x=1&y=2&z=3' );
        } );

        it( 'Should return correct params string from an object with Array', function() {
            expect( param( { arr : [1,2] } ) ).to.equal( 'arr%5B%5D=1&arr%5B%5D=2' );
        } );

        it( 'Should return correct params string from an object with Object', function() {
            expect( param( { obj: { x : 1, y : 2 } } ) ).to.equal( 'obj%5Bx%5D=1&obj%5By%5D=2' );
        } );

        it( 'Should return correct params string from an object with Function', function() {
            expect( param( { obj: function() { return 1; } } ) ).to.equal( 'obj=1' );
        } );
    } );

    describe( 'md5', function() {
        it( 'Should return the correct md5 value from an empty string ', function() {
            expect( md5( '' ) ).to.equal( 'd41d8cd98f00b204e9800998ecf8427e' );
        } );

        it( 'Should return the correct md5 value frome a short sting', function() {
            expect( md5( 'd41d8cd98f00b204e9800998ecf8427e' ) ).to.equal( '74be16979710d4c4e7c6647856088456' );
        } );

        it( 'Should return the corrent md5 value from a string with Chinsese characters', function() {
            expect( md5( '你好' ) ).to.equal( '7eca689f0d3389d9dea66ae112e5cfd7' );
        } );

        it( 'Should return the correct md5 value from a big string with Chinese characters init', function() {
            expect( md5( '该事件被严肃问责人员共计10人。其中，对常州市高新区管委会原副主任、新北区原副区长陆平和常州黑牡丹建设投资有限公司总经理高国伟分别给予撤销党内职务、降级处分，对常州高新区管委会副主任陆建华给予党内严重警告处分、引咎辞职，对市教育局局长丁伟明、市教育局原副局长王定新、新北区环保局原局长蒋新耀分别给予党内警告处分，对新北区环保局监察大队大队长吴荣炳给予记大过处分，对新北区环保局副局长黄震给予记过处分，对常州黑牡丹建设投资有限公司副总经理李飞、项目现场负责人蒋跃栋分别给予免职。对新北区人民政府给予通报批评，并责成其向市政府作出深刻检查。新北区有关部门已依法对相关单位作出行政处罚。' ) ).to.equal( '867d6adbc4cb96eb04ba9084ec2641fc' );
        } );
    } );
} );
