'use client'
import { TextField, Button } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useEffect, useState, useRef } from "react";


export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm an AI chatbot here to offer support and encouragement to help you overcome imposter syndrome and stay motivated. How can I assist you today?"
    },
  ]);

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false); // Track sending state

  const sendMessage = async () => {
    if (isSending) return; // Prevent multiple simultaneous sends

    setIsSending(true); // Set sending state
    const newMessages = [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' },
    ];
    
    setMessages(newMessages); // Update messages state
    setMessage(''); // Clear input field

    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessages), // Send the updated messages array
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      const processText = async ({ done, value }) => {
        if (done) return result;

        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const otherMessages = prevMessages.slice(0, prevMessages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
            },
          ];
        });
        return reader.read().then(processText);
      };

      await reader.read().then(processText);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false); // Reset sending state
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' & !event.shiftKey) {
      sendMessage()
    }
  }

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <Box 
      width="100vw" 
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack 
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack 
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? '#147efb'
                    : '#53d769'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref = {messagesEndRef} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
