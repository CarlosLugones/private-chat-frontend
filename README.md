# Private Chat Frontend

A secure, ephemeral chat application with no history, logs, tracking, or authentication.

[![Node.js Version](https://img.shields.io/badge/Node.js-v22.13.1-brightgreen.svg)](https://nodejs.org/)
[![Bun Version](https://img.shields.io/badge/bun-1.1.27-blue.svg)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/PrivateChatProtocol/private-chat-ui/graphs/commit-activity)
[![GitHub issues](https://img.shields.io/github/issues/PrivateChatProtocol/private-chat-ui.svg)](https://github.com/PrivateChatProtocol/private-chat-ui/issues)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com)

This client app requires a running instance of the [server](https://github.com/PrivateChatProtocol/private-chat-server).

You can host your own instance, or use the one hosted by [Diamonds VPN](https://vpn.diamonds) at [chat.vpn.diamonds](https://chat.vpn.diamonds).

## Features

- Private chat rooms
- Real-time messaging using WebSockets
- No message history or logs stored
- User presence notifications
- Simple and intuitive UI

## Getting Started

### Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2FPrivateChatProtocol%2Fprivate-chat-ui)

### Prerequisites

- Node.js v22.13.1
- bun 1.1.27

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PrivateChatProtocol/private-chat-ui.git
   cd private-chat-ui
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Create a `.env.local` file in the root directory:
   ```
   # Your frontend URL (development)
   NEXT_PUBLIC_FRONTEND_URL=localhost:3000
   
   # Backend server URL
   NEXT_PUBLIC_SERVER_URL=localhost:8000
   ```

### Development

Start the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the client application.

## WebSocket Protocol

The server and client uses the following message formats for real-time communication:

### Joining a room:
```json
{
  "system": true,
  "type": "JOIN_ROOM",
  "username": "string",
  "roomId": "string"
}
```

### Leaving a room:
```json
{
  "system": true,
  "type": "LEAVE_ROOM",
  "username": "string",
  "roomId": "string"
}
```

### Sending a chat text message:
```json
{
  "system": false,
  "type": "CHAT_MESSAGE",
  "roomId": "string",
  "content": "string",
  "username": "string"
}
```

### Sending a chat image message:
```json
{
  "system": false,
  "type": "IMAGE_MESSAGE",
  "roomId": "string",
  "username": "string",
  "imageData": "string",
  "caption": "string",
  "timestamp": "string"
}
```

### Broadcasting chat members list:
```json
{
  "system": true,
  "type": "USER_LIST",
  "roomId": "string",
  "members": ["string"]
}
```

### Error
```json
{
  "system": true,
  "type": "ERROR",
  "roomId": "string",
  "username": "string",
  "content": "string",
  "timestamp": "string"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
