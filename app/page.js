'use client'
import { TextField, Button } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
    role: 'assistant',
    content: "Hi I'm the Headstarter Support Agent, how can I assist you today?"
    },
  ])

  const [message, setMessage] = useState('')
  //helper function is going to send our current message to the backend and return the response

  const sendMessage = async() => {
    setMessage('') // so textfield is empty once we press send
    setMessages((messages) => [
      ...messages,
      {role : "user", content: message},
      {role : "assitant", content: ''},
    ])

    // fetching the response 
    const response = await fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      // sending the body
      // JSON string of our messages array
      // need to define a new array because the state variables might not update in time
      body: JSON.stringify([...messages, {role: 'user', content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder() // decode the encoded message

      let result = ''
      // return a reader and then process it
      return reader.read().then(function processText({done, value}) {
        if (done) {
          return result
        }
        // else keep updating the state variable
        const text = decoder.decode(value || new Uint8Array(), {stream:true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1) // this gets all of the messages except the last oen
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
            },
          ]
        })
        return reader.read().then(processText)
      }) 
    })
  }
  return (
      <Box 
      width="100vw" 
      height="100vh"
      display = "flex"
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
                      ? 'blue'
                      : 'green'
                  }
                  color="white"
                  borderRadius={16}
                  p={3}
                  >
                    {message.content}
                </Box>
              </Box>
            ))}
          </Stack>
          <Stack direction = "row" spacing = {2}>
            <TextField
              label = "message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button variant= "contained" onClick={sendMessage}>Send</Button>

          </Stack>
          </Stack>
      </Box>
  )}
 
