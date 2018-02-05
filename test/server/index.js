const Koa = require( 'koa' );
const Router = require( '@lvchengbin/koa-router' );
const logger = require( 'koa-logger' );
const parser = require( 'koa-body' );
const serve = require( 'koa-static' );
const mount = require( 'koa-mount' );

const app = new Koa();
app.use( logger() );
const router = new Router( app );

app.use( mount( '/static', serve( './test/server/static' ) ) );

app.use( async ( ctx, next ) => {
    if( ctx.method === 'OPTIONS' ) {
        const origin = ctx.request.get( 'origin' );
        ctx.set( 'Access-Control-Allow-Origin', origin );
        ctx.body = {};
    } else {
        next();
    }
} );

app.use( parser() );

router.get( { delay : true }, async ( ctx, next ) => {
    await new Promise( resolve => {
        setTimeout( resolve, +ctx.query.delay || 0 );
    } )
    await next();
} );

router.get( '/javascript', async ctx => {
    const origin = ctx.request.get( 'origin' );
    ctx.set( 'Access-Control-Allow-Origin', origin );
    ctx.set( 'Content-Type', 'application/javascript' );
    console.log( ctx.query.t );
    ctx.body = ctx.query.t;
} );


app.listen( 50002 );
