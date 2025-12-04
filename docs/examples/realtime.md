# Real-time Subscriptions Example

This example demonstrates how to build a real-time chat application using SecureStack's subscription system.

## Features

- **WebSocket Support**: Real-time bidirectional communication.
- **Channels**: Subscribe to specific chat rooms.
- **Broadcasting**: Send messages to all subscribers of a room.

## 1. Server Implementation

We'll use Node.js `EventEmitter` for simple pub/sub, but in production, you should use Redis.

```typescript
// server.ts
import { SecureStackServer, router } from '@lemur-bookstores/server';
import { z } from 'zod';
import { EventEmitter } from 'events';

const app = new SecureStackServer({ name: 'chat-app', port: 3000 });
const ee = new EventEmitter();

const chatRouter = router()
  // 1. Send a message
  .mutation('sendMessage', {
    input: z.object({
      roomId: z.string(),
      text: z.string(),
      sender: z.string(),
    }),
    handler: async ({ input }) => {
      const message = {
        id: Math.random().toString(),
        ...input,
        timestamp: new Date(),
      };
      
      // Emit event to specific room
      ee.emit(`room:${input.roomId}`, message);
      
      return message;
    },
  })
  
  // 2. Subscribe to a room
  .subscription('onMessage', {
    input: z.object({ roomId: z.string() }),
    handler: async function* ({ input }) {
      // Yield connection established event
      yield { type: 'connected', roomId: input.roomId };
      
      // Create a listener wrapper to bridge EventEmitter to Generator
      let listener: (msg: any) => void;
      
      try {
        while (true) {
          // Wait for next message
          const message = await new Promise((resolve) => {
            listener = resolve;
            ee.once(`room:${input.roomId}`, listener);
          });
          
          yield message;
        }
      } finally {
        // Cleanup when client disconnects
        if (listener) {
          ee.off(`room:${input.roomId}`, listener);
        }
      }
    },
  });

app.router('chat', chatRouter);
await app.start();
```

## 2. Client Implementation (React)

```typescript
// ChatRoom.tsx
import { useSubscription, useMutation } from '@lemur-bookstores/client/react';
import { useState } from 'react';

export function ChatRoom({ roomId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Subscribe to messages
  useSubscription('chat.onMessage', {
    input: { roomId },
    onData: (message) => {
      if (message.type !== 'connected') {
        setMessages((prev) => [...prev, message]);
      }
    },
    onError: (err) => console.error('Chat error:', err),
  });

  const sendMessage = useMutation('chat.sendMessage');

  const handleSend = async () => {
    await sendMessage.mutateAsync({
      roomId,
      text: input,
      sender: user,
    });
    setInput('');
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.sender}: </strong>
            {msg.text}
          </div>
        ))}
      </div>
      
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## 3. Scaling with Redis

For multiple server instances, replace `EventEmitter` with Redis Pub/Sub.

```typescript
import Redis from 'ioredis';

const pub = new Redis();
const sub = new Redis();

// Publisher
router().mutation('sendMessage', {
  handler: async ({ input }) => {
    await pub.publish(`room:${input.roomId}`, JSON.stringify(message));
    return message;
  }
});

// Subscriber
router().subscription('onMessage', {
  handler: async function* ({ input }) {
    await sub.subscribe(`room:${input.roomId}`);
    
    sub.on('message', (channel, message) => {
      // Push to generator queue...
    });
    // ... implementation details for bridging Redis to Generator
  }
});
```
