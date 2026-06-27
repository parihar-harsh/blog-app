import { Hono } from 'hono'
import { userRouter } from './routes/user';
import { blogRouter } from './routes/blog';
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import type { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.use('*', requestId())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: (origin) => {
    if (
      origin === 'http://localhost:5173' ||
      origin === 'https://medium-blogapp-web.pages.dev' ||
      /^https:\/\/[a-f0-9]+\.medium-blogapp-web\.pages\.dev$/.test(origin)
    ) {
      return origin
    }
    return ''
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Request-Id'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
}))
app.use('/api/*', bodyLimit({
  maxSize: 128 * 1024,
  onError: (c) => c.json({ message: 'Request body is too large' }, 413),
}))

app.get('/health', (c) => c.json({ status: 'ok', requestId: c.get('requestId') }))
app.route("/api/v1/user", userRouter);
app.route("/api/v1/blog", blogRouter);

app.notFound((c) => c.json({ message: 'Not found' }, 404))
app.onError((error, c) => {
  const requestIdValue = c.get('requestId')
  console.error({ requestId: requestIdValue, error })
  const code = typeof error === 'object' && error && 'code' in error
    ? String(error.code)
    : ''
  if (['P1001', 'P1002', 'P6002', 'P6004'].includes(code)) {
    return c.json({ message: 'Database temporarily unavailable', requestId: requestIdValue }, 503)
  }
  return c.json({ message: 'Internal server error', requestId: requestIdValue }, 500)
})

export default app
