# Private Chat Frontend

A secure, ephemeral chat application with no history, logs, tracking, or authentication required.

## Features

- Private chat rooms
- Real-time messaging using WebSockets
- No message history or logs stored
- User presence notifications
- Simple and intuitive UI

## Getting Started

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
