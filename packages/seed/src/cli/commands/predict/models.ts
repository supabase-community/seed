import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { bold, brightGreen } from "#cli/lib/output.js";

export const getCurrentModel = () => {
  const name = process.env["AI_MODEL_NAME"];
  if (name) {
    console.log(`${bold("Model Override:")} Using ${brightGreen(name)}`);
  }
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
  modelName = "llama3-70b-8192",
  apiKey = process.env["GROQ_API_KEY"],
) => {
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required to use Groq models");
  }
  return new ChatGroq({
    apiKey,
    model: modelName,
    maxConcurrency: 10,
  });
};

interface TokenUsage {
  completionTokens?: string;
  promptTokens?: string;
}

export interface ResponseMetadata {
  tokenUsage?: TokenUsage;
}
