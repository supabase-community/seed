import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { type ChatGroq } from "@langchain/groq";
import { type ChatOpenAI } from "@langchain/openai";
import { type ResponseMetadata, getCurrentModel } from "./models.js";

export const determineProjectDescription = async (
  tableNames: Array<string>,
) => {
  try {
    return await _determineDescription(
      projectSystemPrompt,
      projectUserPrompt(tableNames),
    );
  } catch (error) {
    console.log(
      `\nFailed to determine project description! \nPlease use a different AI model or update the 'projectDescription' field manually in '.snaplet/config.json'\n\n`,
    );
    throw error;
  }
};

const projectSystemPrompt = `Determine what a project does by looking at the table names of the database.
  Respond in the following JSON format:
  {
    "description": "This project is about..."
  }`;

const projectUserPrompt = (tableNames: Array<string>) => {
  return ` The project has tables named ${tableNames.join(", ")}. What do you think this project is about?`;
};

export const determineColumnDescription = async (
  columnNames: Array<string>,
  column: string,
  projectDescription?: string,
) => {
  return _determineDescription(
    columnSystemPrompt,
    columnUserPrompt(columnNames, column, projectDescription),
  );
};

const columnSystemPrompt = `Describe the contents of a column.
  Respond in the following JSON format:
  {
    "description": "This column is about..."
  }`;

const columnUserPrompt = (
  columnNames: Array<string>,
  column: string,
  projectDescription?: string,
) => {
  let prompt = ` A database table has the following columns: ${columnNames.join(", ")}.`;
  if (projectDescription) {
    prompt += ` The project is about ${projectDescription}.`;
  }
  prompt += `Describe the contents of the column: "${column}"`;
  return prompt;
};

const _determineDescription = async (
  systemPrompt: string,
  userPrompt: string,
  model: ChatGroq | ChatOpenAI = getCurrentModel(),
  retries = 3,
): Promise<{
  description: string;
  requestTokens: number;
  responseTokens: number;
}> => {
  try {
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ];
    const response = await model
      .bind({
        response_format: {
          type: "json_object",
        },
      })
      .invoke(messages);

    if (typeof response.content === "string") {
      const content = JSON.parse(response.content) as {
        description: string;
      };
      const meta = response.response_metadata as ResponseMetadata;
      const requestTokens = Number(meta.tokenUsage?.promptTokens ?? 0);
      const responseTokens = Number(meta.tokenUsage?.completionTokens ?? 0);
      return {
        description: content.description,
        requestTokens,
        responseTokens,
      };
    } else {
      throw new Error("Invalid response from model");
    }
  } catch (error) {
    if (retries > 0) {
      return _determineDescription(
        systemPrompt,
        userPrompt,
        model,
        retries - 1,
      );
    }
    throw error;
  }
};
