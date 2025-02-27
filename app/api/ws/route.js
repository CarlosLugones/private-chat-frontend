import { WebSocketServer } from 'ws';

export function GET(request) {
  // This is needed for the initial HTTP upgrade
  return new Response("WebSocket server", {
    status: 101, // Switching Protocols
  });
}

// Map clients and rooms
const clients = new Map();
const rooms = new Map();

// Create WebSocket server once
if (!global.wss) {
  global.wss = new WebSocketServer({ noServer: true });
  
  global.wss.on('connection', (ws, request, client) => {
    console.log("Client connected");
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case "join":
            const { username, roomname } = data;
            
            // Store client info
            clients.set(ws, { username, roomname });
            
            // Add client to room
            if (!rooms.has(roomname)) {
              rooms.set(roomname, new Set());
            }
            rooms.get(roomname).add(ws);
            
            // Notify room about new user
            broadcastToRoom(roomname, {
              type: "system",
              content: `${username} has joined the room`,
              timestamp: new Date().toISOString()
            });
            break;
            
          case "message":
            const clientInfo = clients.get(ws);
            if (clientInfo) {
              broadcastToRoom(clientInfo.roomname, {
                type: "message",
                username: clientInfo.username,
                content: data.content,
                timestamp: new Date().toISOString()
              });
            }
            break;
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });
    
    ws.on('close', () => {
      const clientInfo = clients.get(ws);
      if (clientInfo) {
        const { username, roomname } = clientInfo;
        
        // Remove client from room
        if (rooms.has(roomname)) {
          rooms.get(roomname).delete(ws);
          
          // If room is empty, delete it
          if (rooms.get(roomname).size === 0) {
            rooms.delete(roomname);
          } else {
            // Notify others that user has left
            broadcastToRoom(roomname, {
              type: "system",
              content: `${username} has left the room`,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Remove client from clients map
        clients.delete(ws);
      }
      console.log("Client disconnected");
    });
  });
}

// Helper function to broadcast messages to a room
function broadcastToRoom(roomname, message) {
  if (!rooms.has(roomname)) return;
  
  const messageStr = JSON.stringify(message);
  rooms.get(roomname).forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(messageStr);
    }
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
