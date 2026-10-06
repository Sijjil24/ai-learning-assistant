import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const validLevels = ["Beginner", "Intermediate", "Advanced"] as const;
const validUnderstanding = ["shaky", "getting-there", "confident"] as const;

export async function POST(request: NextRequest) {
  try {
    const { topic, level, understanding } = await request.json();

    if (
      typeof topic !== "string" ||
      !topic.trim() ||
      topic.trim().length > 80 ||
      !validLevels.includes(level) ||
      !validUnderstanding.includes(understanding)
    ) {
      return NextResponse.json({ error: "Choose a topic, level, and confidence." }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const apiKey = openAiKey || groqKey;

    if (!apiKey) {
      return NextResponse.json({ error: "Configure OPENAI_API_KEY or GROQ_API_KEY to generate lessons." }, { status: 503 });
    }

    const client = new OpenAI({
      apiKey,
      ...(openAiKey ? {} : { baseURL: "https://api.groq.com/openai/v1" }),
    });
    const confidenceDescription = {
      shaky: "new to the material and needing extra scaffolding",
      "getting-there": "familiar with some fundamentals but needing practice",
      confident: "comfortable with the fundamentals and ready for deeper challenges",
    }[understanding as (typeof validUnderstanding)[number]];

    const completion = await client.chat.completions.create({
      model: openAiKey ? "gpt-4o-mini" : "openai/gpt-oss-20b",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Create a practical, progressive learning path with exactly four lessons. Return only a JSON object with a lessons array. Each lesson must have title, summary, content, example, and practiceQuestion string fields. Keep each lesson focused, accessible, and appropriate to the requested level. Include clear explanations and a small runnable example where relevant. Do not use markdown fences.",
        },
        {
          role: "user",
          content: `Create a learning path for the topic "${topic.trim()}" at ${level} level. The learner is ${confidenceDescription}. Start with the most useful prerequisite and build toward an applied concept.`,
        },
      ],
    });

    const response = completion.choices[0]?.message.content;
    if (!response) {
      return NextResponse.json({ error: "The AI returned an empty learning path. Please try again." }, { status: 502 });
    }

    const parsed = JSON.parse(response) as { lessons?: unknown };
    if (!Array.isArray(parsed.lessons) || parsed.lessons.length !== 4) {
      return NextResponse.json({ error: "The AI returned an invalid learning path. Please try again." }, { status: 502 });
    }

    const lessons = parsed.lessons.map((lesson, index) => {
      if (!lesson || typeof lesson !== "object") {
        throw new Error("Invalid lesson content");
      }
      const fields = lesson as Record<string, unknown>;
      const requiredFields = ["title", "summary", "content", "example", "practiceQuestion"];
      if (requiredFields.some((field) => typeof fields[field] !== "string" || !fields[field])) {
        throw new Error("Invalid lesson content");
      }
      return {
        id: `lesson-${index + 1}`,
        title: fields.title as string,
        summary: fields.summary as string,
        content: fields.content as string,
        example: fields.example as string,
        practiceQuestion: fields.practiceQuestion as string,
      };
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Lesson generation error:", error);
    return NextResponse.json({ error: "Unable to generate lessons right now. Please try again." }, { status: 500 });
  }
}