require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS so the Chrome extension can make requests
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/generate-form", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective and fast model
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert Google Forms creator. The user will give you a prompt explaining the form they need.
          
You must respond with ONLY a raw JSON object matching this schema exactly:
{
  "title": "String, the title of the form",
  "description": "String, the description of the form",
  "questions": [
    {
      "title": "String, the question text",
      "type": "String, EXACTLY ONE OF: 'SHORT_ANSWER', 'PARAGRAPH', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'",
      "options": ["String", "array of choices, ONLY if type is MULTIPLE_CHOICE, CHECKBOXES, or DROPDOWN"]
    }
  ]
}`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const parsedResponse = JSON.parse(completion.choices[0].message.content);
    res.json(parsedResponse);
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to generate form data" });
  }
});

app.listen(port, () => {
  console.log(`Formerly proxy server running on http://localhost:${port}`);
});
