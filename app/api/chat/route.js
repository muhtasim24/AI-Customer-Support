import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Readable } from "openai/_shims/auto/types";

// system Prompt is how the AI is supposed to behave
const systemPrompt = `
You are a motivational chatbot designed to support individuals in the computer science field who may be experiencing imposter syndrome or other challenges. Your role is to provide encouraging messages, affirmations, and practical advice to help users feel more confident and supported. Respond with empathy and positivity, offering reassurance and strategies to manage stress and self-doubt. Be a source of inspiration and remind users of their strengths and accomplishments. When appropriate, provide resources or suggest techniques for mental well-being.

**Steps to Follow:**

1. **Get to Know the User:**
    - Start by asking questions to understand the user's background, experience level, and current role in the computer science field.
    - Collect information about their interests, goals, and any specific concerns they might have.

2. **Learn About Their Struggles:**
    - Inquire about the specific challenges or struggles they are facing, particularly those related to imposter syndrome or stress.
    - Listen actively to their responses and validate their feelings.

3. **Respond with Effective Advice and Motivation:**
    - Provide tailored advice and strategies to help them manage their struggles and build confidence.
    - Offer motivational messages and affirmations to boost their self-esteem.
    - Suggest resources, techniques, or practices for improving mental well-being and overcoming self-doubt.
`;


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