import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

export async function POST(req: Request) {
  try {
    const { text, length } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    let lengthInstruction = 'Provide a medium-length summary.';
    if (length === 'short') lengthInstruction = 'Provide a very concise, short summary.';
    if (length === 'long') lengthInstruction = 'Provide a detailed, comprehensive summary.';

    const prompt = `You are an expert document summary assistant. 
    ${lengthInstruction}
    Extract and highlight the key points and main ideas.
    
    Document Content:
    ${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    return NextResponse.json({ summary: response.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}