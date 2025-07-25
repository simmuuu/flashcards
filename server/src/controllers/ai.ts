import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Folder from '../models/Folder';
import Card from '../models/Card';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const generateFromPdf = async (req: Request, res: Response) => {
  const { text, fileName } = req.body;
  const userId = (req.user as any).id;

  if (!text) {
    return res.status(400).json({ error: 'Text content is required' });
  }

  // Create a temporary folder first
  const folder = await Folder.create({
    name: 'Generating...',
    user: userId,
    status: 'processing',
  });

  res.status(202).json(folder); // Immediately respond with the processing folder

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Generate title from LLM
    const titlePrompt = `Based on the following text content, generate a concise and descriptive title for a flashcard set. The title should be 3-8 words and capture the main topic. Only return the title, nothing else. Text: ${text.substring(
      0,
      1000
    )}...`;
    const titleResult = await model.generateContent(titlePrompt);
    const titleResponse = await titleResult.response;
    const generatedTitle = titleResponse.text().trim().replace(/"/g, '');

    // Generate flashcards
    const flashcardsPrompt = `Create flashcards from the following text. Each flashcard should have a question and an answer. Format the output as a JSON array of objects, where each object has a "question" and "answer" key. Make sure the JSON is valid and properly formatted. Text: ${text}`;
    const flashcardsResult = await model.generateContent(flashcardsPrompt);
    const flashcardsResponse = await flashcardsResult.response;

    let flashcards;
    try {
      const responseText = flashcardsResponse.text();
      // Clean up the response to extract JSON
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON array found in response');
      }
    } catch (parseError) {
      console.error('Error parsing flashcards JSON:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // Update folder with generated title
    await Folder.findByIdAndUpdate(folder._id, { name: generatedTitle });

    await Card.insertMany(
      flashcards.map((card: { question: string; answer: string }) => ({
        front: card.question, // Map question to front
        back: card.answer, // Map answer to back
        folder: folder._id,
        user: userId, // Add required user field
      }))
    );

    await Folder.findByIdAndUpdate(folder._id, { status: 'completed' });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    await Folder.findByIdAndUpdate(folder._id, { status: 'failed' });
  }
};
