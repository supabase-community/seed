import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { type ChatGroq } from "@langchain/groq";
import { type ChatOpenAI } from "@langchain/openai";
import { type ResponseMetadata, getCurrentModel } from "./models.js";

const systemPrompt = `Predict the data in a database column.
  Respond in the following JSON format:
  {
    "examples": ["example 1", "example 2", "example 3"]
  }
  Examples should strings.`;

const buildUserPrompt = (
  fullyQualifiedColumnName: string,
  sampleSize: number,
  description: string,
  firstBatch: boolean,
  examples?: Array<string>,
) => {
  let userPrompt = `Provide ${sampleSize} more examples of the data in the column.`;
  if (firstBatch) {
    const exampleText =
      examples && examples.length > 0
        ? `Here are some examples of the data in the column: ${examples.join(", ")}`
        : "";
    userPrompt = `
  A database have a column "${fullyQualifiedColumnName} and I want to generate examples rows entries for it.
  Here is a short description of the data in the column:
  ${description}
  ${exampleText}
  Please provide ${sampleSize} ${examples?.length ? "more" : ""} examples of the data in the column.
  Make the examples as realistic and diverse as possible.
  Respond in the following JSON format:
  {
    "examples": ["A", "B", "C"]
  }`;
  }
  return userPrompt;
};

export const generateExamples = async (
  fullyQualifiedColumnName: string,
  sampleSize: number,
  description: string,
  retries = 2,
  examples?: Array<string>,
): Promise<{
  newExamples: Array<string>;
  rawResponse: string;
  requestTokens: number;
  responseTokens: number;
}> => {
  // LLM's (more so llama) sometimes get the json formatting wrong
  // reducing the sample size usually fixes this
  try {
    const userPrompt = buildUserPrompt(
      fullyQualifiedColumnName,
      sampleSize,
      description,
      true,
      examples,
    );
    return await generateExamplesFromPrompts(systemPrompt, userPrompt, []);
  } catch (error) {
    if (retries > 0) {
      console.log(
        `Error generating examples for column: ${fullyQualifiedColumnName}. \n Retrying in 1 second...`,
      );
      // Wait 1 second to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await generateExamples(
        fullyQualifiedColumnName,
        sampleSize - 5,
        description,
        retries - 1,
        examples,
      );
    }
    console.log(
      `Error generating examples for column: ${fullyQualifiedColumnName}.\n Full error:`,
      error,
    );
    // We swallow the error and return an empty array so the process can continue
    return {
      newExamples: [],
      rawResponse: "",
      requestTokens: 0,
      responseTokens: 0,
    };
  }
};

const generateExamplesFromPrompts = async (
  systemPrompt: string,
  userPrompt: string,
  promptHistory: Array<BaseMessage>,
  model: ChatGroq | ChatOpenAI = getCurrentModel(),
) => {
  const sysMsg = new SystemMessage(systemPrompt);
  const humanMsg = new HumanMessage(userPrompt);

  const messages = [sysMsg, ...promptHistory, humanMsg];
  const response = await model
    .bind({
      response_format: {
        type: "json_object",
      },
    })
    .invoke(messages);
  let newExamples: Array<string> = [];
  // We expect response.content to be a JSON string
  if (typeof response.content === "string") {
    const content = JSON.parse(response.content) as {
      examples: Array<unknown>;
    };

    const examples = content.examples;
    for (const example of examples) {
      // The LLM can return examples as objects, numbers, or strings
      // We need to convert them all to strings
      if (typeof example === "object") {
        newExamples.push(JSON.stringify(example));
      } else if (typeof example === "number") {
        newExamples.push(example.toString());
      } else if (typeof example === "string") {
        newExamples.push(example);
      } else {
        console.error("Unknown example type", example);
      }
    }
  } else {
    newExamples = [];
  }

  const meta = response.response_metadata as ResponseMetadata;
  const requestTokens = Number(meta.tokenUsage?.promptTokens ?? 0);
  const responseTokens = Number(meta.tokenUsage?.completionTokens ?? 0);

  return {
    rawResponse: response.content.toString(),
    newExamples,
    requestTokens,
    responseTokens,
  };
};
