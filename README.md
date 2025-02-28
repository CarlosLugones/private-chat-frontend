# Private Chat Frontend

A secure, ephemeral chat application with no history, logs, tracking, or authentication.

[![Node.js Version](https://img.shields.io/badge/Node.js-v22.13.1-brightgreen.svg)](https://nodejs.org/)
[![Bun Version](https://img.shields.io/badge/bun-1.1.27-blue.svg)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/CarlosLugones/private-chat-frontend/graphs/commit-activity)
[![GitHub issues](https://img.shields.io/github/issues/CarlosLugones/private-chat-frontend.svg)](https://github.com/CarlosLugones/private-chat-frontend/issues)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com)

This frontend requires a running instance of the [backend server](https://github.com/CarlosLugones/private-chat-backend).

You can host your own instance, or use the one hosted by [Diamonds VPN](https://vpn.diamonds) at [chat.vpn.diamonds](https://chat.vpn.diamonds).

## Features

- Private chat rooms
- Real-time messaging using WebSockets
- No message history or logs stored
- User presence notifications
- Simple and intuitive UI

## Getting Started

### Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2FCarlosLugones%2Fprivate-chat-frontend)

### Prerequisites

- Node.js v22.13.1
- bun 1.1.27

### Installation

1. Clone the repository.

2. Install dependencies:
```bash
bun install
```

3. Create a `.env.local` file in the root directory and add:
```
NEXT_PUBLIC_BACKEND_URL=localhost:8000
```

### Development

Start the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── page.js             # Home page
│   └── chat/[room]/        # Dynamic chat room route
│       └── page.js         # Chat room page
├── components/             # React components
│   └── chat/               # Chat-related components
│       ├── ChatInput.js    # Message input component
│       └── ChatMessage.js  # Individual message component
├── hooks/                  # Custom React hooks
│   └── useWebSocket.js     # WebSocket connection hook
└── public/                 # Static assets
```

## WebSocket Protocol

The application uses the following message formats:

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

### Sending a message:
```json
{
  "system": false,
  "type": "CHAT_MESSAGE",
  "roomId": "string",
  "content": "string",
  "username": "string"
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
