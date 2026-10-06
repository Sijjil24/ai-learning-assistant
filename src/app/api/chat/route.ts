import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Groq uses the same request format as OpenAI — we just point the
// client at Groq's servers instead, using the OpenAI SDK.
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
  try {
    const { messages, moduleContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    let systemContent =
      "You are a patient, friendly AI tutor helping an intern learn programming and tech skills. Explain concepts simply, use short examples, and guide the student toward understanding rather than just giving final answers. Keep responses concise and easy to read.";

    if (moduleContext) {
      systemContent += ` The student is currently studying "${moduleContext.title}": ${moduleContext.description}. Key topics in this module: ${moduleContext.topics?.join(", ")}. Keep your answers focused on this module when relevant, but still answer other questions helpfully if asked.`;
    }

    const systemPrompt = {
      role: "system" as const,
      content: systemContent,
    };

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [systemPrompt, ...messages],
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}