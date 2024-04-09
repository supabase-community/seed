import { input, select } from "@inquirer/prompts";
import { trpc } from "#trpc/client.js";

const createProject = async () => {
  const projectName = await input({
    message: "Enter a project name",
  });

  projectName;

  // todo
  return "";
};

export const setProjectHandler = async () => {
  const projects = await trpc.project.list.query();

  if (projects.length === 0) {
    return createProject();
  }

  if (projects.length === 1) {
    return projects[0].id;
  }

  const createOption = {
    title: "Create a new project",
    value: "create",
  };

  const choice = await select({
    message: "Select project",
    choices: [
      createOption,
      ...projects.map((project) => ({
        title: project.name,
        value: project.id,
      })),
    ],
  });

  if (choice === "create") {
    return createProject();
  } else {
    return choice;
  }
};
