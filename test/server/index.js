const Koa = require( 'koa' );
const Router = require( '@lvchengbin/koa-router' );
const logger = require( 'koa-logger' );
const parser = require( 'koa-body' );
const send = require( 'koa-send' );

const app = new Koa();
const router = new Router( app );

app.use( logger() );

app.use( async ( ctx, next ) => {
    if( ctx.method === 'OPTIONS' ) {
        const origin = ctx.request.get( 'origin' );
        ctx.set( 'Access-Control-Allow-Origin', origin );
        ctx.body = {};
    } else {
        await next();
    }
} );

router.get( /^\/static/, async ctx => {
    const origin = ctx.request.get( 'origin' );
    ctx.set( 'Access-Control-Allow-Origin', origin );
    await send( ctx, ctx.path, { root : __dirname } );
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
    ctx.body = ctx.query.t;
} );

app.listen( 50002 );

console.log( 'Listening to the port: 50002' );
