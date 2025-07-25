import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Folder from '../models/Folder';
import Card from '../models/Card';
import multer from 'multer';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Configure multer for memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

export const generateFromPdf = async (req: Request, res: Response) => {
  const userId = (req.user as any).id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'PDF file is required' });
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

    // Convert file buffer to base64
    const pdfData = file.buffer.toString('base64');

    // Create file part for Gemini
    const filePart = {
      inlineData: {
        data: pdfData,
        mimeType: 'application/pdf',
      },
    };

    // Generate title from PDF
    const titlePrompt =
      'Based on the content of this PDF, generate a concise and descriptive title for a flashcard set. The title should be 3-8 words and capture the main topic. Only return the title, nothing else.';
    const titleResult = await model.generateContent([titlePrompt, filePart]);
    const titleResponse = await titleResult.response;
    const generatedTitle = titleResponse.text().trim().replace(/"/g, '');

    // Generate flashcards from PDF
    const flashcardsPrompt =
      'Create flashcards from the content of this PDF. Each flashcard should have a question and an answer. Format the output as a JSON array of objects, where each object has a "question" and "answer" key. Make sure the JSON is valid and properly formatted.';
    const flashcardsResult = await model.generateContent([flashcardsPrompt, filePart]);
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
    // Delete the folder if generation fails to avoid leaving "Generating..." folders
    await Folder.findByIdAndDelete(folder._id);
    // Note: We don't update the response here since it was already sent with status 202
  }
};
