import { input, select } from "@inquirer/prompts";
import { saveProjectConfig } from "#config/project/projectConfig.js";
import { trpc } from "#trpc/client.js";

const createOrganization = async () => {
  const organizationName = await input({
    message: "Enter an organization name",
  });

  const organization = await trpc.organization.create.mutate({
    organizationName,
  });

  return organization.id;
};

const selectOrganization = async () => {
  const organizations = await trpc.organization.list.query();

  if (organizations.length === 0) {
    console.log(
      "You do not yet have any organizations to put the project under, creating one",
    );
    return createOrganization();
  }

  const createOption = {
    name: "Create a new organization",
    value: "create",
  };

  const choice = await select({
    message: "Select which organization to create your project under",
    choices: [
      createOption,
      ...organizations.map((organization) => ({
        name: organization.name,
        value: organization.id,
      })),
    ],
  });

  if (choice === "create") {
    return createOrganization();
  } else {
    return choice;
  }
};

const createProject = async () => {
  const organizationId = await selectOrganization();

  const name = await input({
    message: "Enter a project name",
  });

  const project = await trpc.project.create.mutate({
    name,
    regionId: "aws-eu-central-1",
    organizationId,
  });

  return project.id;
};

const selectProject = async () => {
  const projects = await trpc.project.list.query();

  if (projects.length === 0) {
    console.log("You do not yet have any projects, creating one");
    console.log("");
    return createProject();
  }

  const createOption = {
    name: "Create a new project",
    value: "create",
  };

  const choice = await select({
    message: "Select which project to link @snaplet/seed to",
    choices: [
      createOption,
      ...projects.map((project) => ({
        name: project.name,
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

export const setProjectHandler = async () => {
  const projectId = await selectProject();
  await saveProjectConfig({ config: { projectId } });
};
