import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/api' })
    // .ws('/ws', {
    //     open(ws) {
    //         const msg = `${ws.data.username} has entered the chat`;
    //         ws.subscribe("the-group-chat");
    //         server.publish("the-group-chat", msg);
    //     },
    //     message(ws, message) {
    //         // this is a group chat
    //         // so the server re-broadcasts incoming message to everyone
    //         server.publish("the-group-chat", `${ws.data.username}: ${message}`);
    //     },
    //     close(ws) {
    //         const msg = `${ws.data.username} has left the chat`;
    //         ws.unsubscribe("the-group-chat");
    //         server.publish("the-group-chat", msg);
    //     },
    // })
    .get('/', () => 'hello Next')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

export const GET = app.handle 
export const POST = app.handle