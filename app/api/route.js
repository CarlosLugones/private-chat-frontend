import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/api' })
    .ws('/ws', {
        message(ws, message) {
            ws.send(message)
        }
    })
    .get('/', () => 'hello Next')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

export const GET = app.handle 
export const POST = app.handle
