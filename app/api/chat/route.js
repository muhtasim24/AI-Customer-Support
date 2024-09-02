import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Readable } from "openai/_shims/auto/types";

// system Prompt is how the AI is supposed to behave
const systemPrompt = 'You are a customer support bot for HeadStarter AI, a platform for AI-powered software engineering interviews. Assist users by providing platform guidance, troubleshooting technical issues, managing account and billing inquiries, and offering tips for interview preparation. Respond with clear, friendly, and concise information, and escalate complex issues to human support when necessary.'

export async function POST(req) {
    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
    }) // 
    const data = await req.json() // gets the json data from your request
    console.log("Request data:", data);

    //await function doesnt block code when waiting
    const completion = await openai.chat.completions.create({
        messages: [{
            role: 'system', 
            content: systemPrompt
        },
        ...data, // spread operator to get the rest of the messages
    ],
    model: 'gpt-4o-mini', // specify the model
    stream: true, 
    }) // chat completion from request

    // outputting to our frontend, below is a stream response
    const stream = new ReadableStream({
        async start(controller) { // how the stream starts
            const encoder = new TextEncoder() // encodes the text
            try {
                for await (const chunk of completion) { // waits for every chunk that completion sends
                                                        // openai sends completion as chunks
                    // we extract the content from each chunk
                    const content = chunk.choices[0]?.delta?.content
                    // if the content exists, get the text, encode it, send to controller
                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch(err) {
                controller.error(err)
            } finally {
                controller.close() // close the controller when its finished
            }
        },
    })

    return new NextResponse(stream)
}