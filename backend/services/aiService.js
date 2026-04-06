import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5000',
    'X-Title': process.env.OPENROUTER_SITE_NAME || 'SupportAI',
  },
});

const MODELS = {
  FAST_FILTER: 'stepfun-ai/step-1-flash', // Place holder for Step 3.5 Flash (Free)
  DEEP_REASONING: 'meta-llama/llama-3-120b-instruct', // Placeholder for GPT-OSS 120B
};

/**
 * Stage 1: High-Speed Noise Filtering using a faster, free model.
 * Determines if the message is actionable or just noise.
 */
export async function filterMessageNoise(messageContent) {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.FAST_FILTER,
      messages: [
        {
          role: 'system',
          content: 'You are a fast filtering engine for a customer support application. Return ONLY a JSON object with a single boolean property "isActionable". If the message contains a feature request, bug report, or asks for support, set it to true. If it is casual banter, greeting, or noise, set it to false.'
        },
        {
          role: 'user',
          content: messageContent,
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.isActionable || false;
  } catch (error) {
    console.error('Error in filterMessageNoise:', error);
    // On error, default to letting it through to deeper reasoning to be safe
    return true; 
  }
}

/**
 * Stage 2: Deep reasoning and classification using the heavier model.
 */
export async function classifyAndExtractTask(messageContent) {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.DEEP_REASONING,
      messages: [
        {
          role: 'system',
          content: `You are an advanced Customer Support AI. Analyze the user's message and extract a structured task.
Respond ONLY with a JSON object fulfilling these properties:
{
  "category": "Critical Bug" | "Feature Request" | "Support Request" | "General Inquiry" | "Feedback/Suggestion" | "Uncategorized",
  "confidenceScore": number (0-100),
  "title": "Short descriptive title",
  "summary": "1-2 sentence summary of the issue",
  "priority": "High" | "Medium" | "Low"
}`
        },
        {
          role: 'user',
          content: messageContent,
        }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in classifyAndExtractTask:', error);
    throw new Error('Failed to extract task data');
  }
}

/**
 * Orchestrator combining Stage 1 and Stage 2
 */
export async function processIncomingMessage(messageContent) {
  // Step 1: Filter
  const isActionable = await filterMessageNoise(messageContent);
  
  if (!isActionable) {
    return {
      ignored: true,
      reason: 'Filtered as noise by Stage 1 AI',
    };
  }

  // Step 2: Deep analysis
  const taskData = await classifyAndExtractTask(messageContent);
  return {
    ignored: false,
    task: taskData,
  };
}
