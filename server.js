'use strict';

const fs 			= require('fs');
const koa           = require('koa');
const app           = new koa();
const serve         = require('koa-static');
const Router        = require('koa-router');
const router 		= new Router();
const bodyParser 	= require('koa-bodyparser'); // application/json , application/x-www-form-urlencoded ONLY
const asyncBusboy   = require('async-busboy');
const PORT			= 3000;

app.use(serve(__dirname + '/public', {
	maxage : 0,
    gzip: true,
    usePrecompiledGzip: true
}));

app.use(bodyParser({
    formLimit: '1mb',
    jsonLimit: '1mb'
}));

try {
	JSON.parse(fs.readFileSync('./public/user.json'));
} catch (err) {
	console.error(err);
	fs.writeFileSync(__dirname + '/public/user.json', JSON.stringify([]));
}

app.use(async function (ctx, next) {
	let contentType = ctx.get('content-type') || '';

	if (!~['DELETE', 'POST', 'PUT', 'PATCH'].indexOf(ctx.method) || !contentType.startsWith('multipart/form-data')) {
		return await next();
	}

	const { files, fields } = await asyncBusboy(ctx.req, {
			autoFields: true,
			limits: {
			fields: 200,
			files: 30,
			fieldSize: 1000000*200,
			parts: this.fields + this.files,
		}
	});

	for (let key in fields) ctx.request.body[key] = fields[key];

  	await next();
});

router.get('/users', async ctx => {
	// return ctx.throw(403, 'ДОСТУП ЗАПРЕЩЁН');
	
	await new Promise((resolve, reject) => {
		setTimeout(resolve, 3000);
	});
	
	ctx.body = JSON.parse(fs.readFileSync('./public/user.json'));
});

router.post('/users', async ctx => {
	let newUser = ctx.request.body;

	if (!newUser || !newUser.id) return ctx.throw(400);

	let users = JSON.parse(fs.readFileSync('./public/user.json'));

	if (users.some(user => user.id == newUser.id)) {
		ctx.throw(400);
	} else {
		users.push(newUser);
		fs.writeFileSync(__dirname + '/public/user.json', JSON.stringify(users));
		//ctx.status = 204;
		 ctx.redirect('/');
	}
});

router.get('/users/:id', async ctx => {
	let users = JSON.parse(fs.readFileSync('./public/user.json'));
	let user;
	
	for (let i = 0, l = users.length; i < l; i++) {
		if (users[i].id == ctx.params.id) {
			user = users[i];
			break;
		}
	}

	if (!user) return ctx.throw(404);

	await new Promise((resolve, reject) => {
		setTimeout(resolve, 3000);
	});

	ctx.body = user;
});

router.get('/wait/:time', async ctx => {
	setTimeout(ctx => {
		ctx.body = 'OK';
	}, isNaN(ctx.params.time) ? 0 : parseInt(ctx.params.time), ctx);
});

app.use(router.routes());


app.listen(PORT);
console.log('SERVER LISTENING ON PORT: ', PORT);
