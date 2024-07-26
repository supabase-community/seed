import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";

export const getCurrentModel = () => {
  const name = process.env["AI_MODEL_NAME"];
  if (process.env["OPENAI_API_KEY"]) {
    return openAIModel(name);
  }
  if (process.env["GROQ_API_KEY"]) {
    return groqModel(name);
  }
  throw new Error("No API key found for Groq or OpenAI");
};

const openAIModel = (
  modelName = "gpt-3.5-turbo-0125",
  apiKey = process.env["OPENAI_API_KEY"],
) => {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to use OpenAI models");
  }
  return new ChatOpenAI({
    modelName,
    temperature: 0.9,
    openAIApiKey: apiKey,
    maxConcurrency: 10,
  });
};

const groqModel = (
  modelName = "llama-3.1-8b-instant",
  apiKey = process.env["GROQ_API_KEY"],
  concurrency = process.env["AI_CONCURRENCY"] ?? "1", // Currently rate limits are quite low on Groq
) => {
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required to use Groq models");
  }
  return new ChatGroq({
    apiKey,
    model: modelName,
    maxConcurrency: parseInt(concurrency),
  });
};

interface TokenUsage {
  completionTokens?: string;
  promptTokens?: string;
}

export interface ResponseMetadata {
  tokenUsage?: TokenUsage;
}
