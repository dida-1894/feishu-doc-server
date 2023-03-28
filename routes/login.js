//api/auth/login/index.ts
const axios = require('axios')
const jose = require('jose')
// import { NextApiRequest, NextApiResponse } from 'next';
const router = require('koa-router')()

const JWT_SECRET = 'xxxxx';
// 用 code 换取 accessToken
const getAccessToken = async (code, redirect_uri) => {
  console.log('=======> getAccessToken')
  const options = {
    method: 'post',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    params: {
      ['client_id']: 'cli_a497a513bce3100d',
      ['client_secret']: 'ycmoZ8XduA96j0B37jT9VbJw5iiVw2Dc',
      ['grant_type']: 'authorization_code',
      code,
      redirect_uri,
    },
    url: `https://passport.feishu.cn/suite/passport/oauth/token`,
  };
 
  return await axios(options).then(({ data }) => data).catch(err => {
    console.log('========> error', err)
  });
};
 
const getUserInfo = async (access_token) => {
  const options = {
    method: 'get',
    headers: { Authorization: `Bearer ${access_token}` },
    url: `https://passport.feishu.cn/suite/passport/oauth/userinfo`,
  };
  return await axios(options).then(({ data }) => data);
};


 
async function login(query, ctx) {

  // const numberParser = z.object({ code: z.string(), redirect_uri: z.string() });
  // numberParser.parse(query);
  console.log('========>', query)
  const redirectUri = `http://43.163.244.2:3121/login`
  const { code, redirect_uri } = query;

  if (code) {
    const { access_token } = await getAccessToken(
      String(code),
      String(redirectUri)
    );

    console.log('======> access_token', access_token)
 
    const userInfo = await getUserInfo(access_token);
    const { open_id, union_id, user_id, mobile } = userInfo;
    console.log('======> userInfo', userInfo)
 
    const jwtToken = await new jose.SignJWT({
      open_id,
      union_id,
      user_id,
      mobile,
    })//获取到用户信息之后通过一些字段生成特定token
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1s')
      .sign(new TextEncoder().encode(JWT_SECRET));
 
    if (userInfo) {
      ctx.redirect('')
      ctx.body = {
        statusCode: 200,
        data: {
          userInfo,
          token: jwtToken,
          expiresTime: new Date().getTime() + 60 * 60 * 24 * 7 * 1000,
        },
      }

      ctx.redirect('/')
    }
  } else {
    ctx.status = 401;
    ctx.body = 'Unauthorized: Access is denied due to invalid credentials';
  }
}


router.get('/login', async (ctx, next) => {
  console.log('======> login')
  login(ctx.query, ctx)
})

router.get('/login/test', async (ctx, next) => {
  ctx.body = {
    title: '/login/test'
  }
})

module.exports = router
