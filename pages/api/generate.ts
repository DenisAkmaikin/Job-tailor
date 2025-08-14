// pages/api/generate.ts
import type { NextApiRequest, NextApiResponse } from "next";
import pdfParse from "pdf-parse";
import fs from "fs";

// Disable Next.js JSON body parser so we can handle multipart/form-data (files)
export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  // ✅ ESM-safe dynamic import for formidable (works in Next.js API routes)
  const { formidable } = await import("formidable");
  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err: any, fields: any, files: any) => {
    if (err) return res.status(500).json({ error: "Failed to parse form data" });

    // ---- Text fields (present whether or not PDFs are uploaded) ----
    const name = (fields.name as string) || "";
    const email = (fields.email as string) || "";
    const reasonForApplying = (fields.reasonForApplying as string) || "";
    const toneDescription = (fields.toneDescription as string) || "";

    // Start with textarea values; PDFs (if uploaded) will override below
    let jobDescription = (fields.jobDescription as string) || "";
    let resume = (fields.resume as string) || "";

    // ---- Helper to read + parse a single PDF file ----
    async function extractPdfText(fileField: any): Promise<string | null> {
      if (!fileField) return null;
      const fileObj = Array.isArray(fileField) ? fileField[0] : fileField;
      if (!fileObj?.filepath) return null;
      const data = fs.readFileSync(fileObj.filepath);
      const pdf = await pdfParse(data);
      return pdf.text?.trim() || null;
    }

    // ---- Prefer PDF text if files were uploaded ----
    try {
      const resumeFromPdf = await extractPdfText(files?.resumeFile);
      if (resumeFromPdf) resume = resumeFromPdf;

      const jobFromPdf = await extractPdfText(files?.jobFile);
      if (jobFromPdf) jobDescription = jobFromPdf;
    } catch {
      return res.status(400).json({ error: "Failed to read one of the PDFs" });
    }

    // ---- Validations ----
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }
    if (!name || !email || !toneDescription || !jobDescription || !resume) {
      return res.status(400).json({ error: "Missing input fields" });
    }

    // ---- Prompt ----
    const prompt = `
You are an expert career coach and resume writer.

Given the following details, generate:
1. A bullet list of key qualifications tailored to the job (using action verbs, avoid generic phrasing, focus on what truly matches the job requirements).
2. A unique, authentic, and highly personalized 3-paragraph cover letter for this specific job and person, using the candidate’s name and email.

Guidelines:
- Do NOT simply restate the resume. Instead, synthesize and highlight the most relevant experiences, skills, and motivations that make the candidate a great fit for the specific role and company.
- Weave in concrete achievements or moments from the resume, but do it in a narrative way.
- Use details from the candidate's background, education, or story, not just lists of skills.
- In the cover letter, include a sentence showing genuine interest in the company or its mission, and why the candidate would be excited to join this specific team.
${reasonForApplying ? `- Use this reason for applying to strengthen the connection: "${reasonForApplying}"` : ""}
- Write in the tone specified below.
- Make the letter sound real, warm, and written by a human.

Job Description:
${jobDescription}

Resume:
${resume}

Candidate Details:
Name: ${name}
Email: ${email}
Tone: ${toneDescription} (0–3 = friendly/casual; 5 = professional/neutral; 10 = very formal/businesslike)

Output:
`;

    // ---- OpenAI call ----
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // or "gpt-4" if your account allows
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const output = data.choices?.[0]?.message?.content;
      if (!output) throw new Error(data.error?.message || "No response from OpenAI");

      return res.status(200).json({ result: output });
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
      return res.status(500).json({ error: error.message || "Something went wrong" });
    }
  });
}






