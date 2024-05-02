import { input, select } from "@inquirer/prompts";
import { telemetry } from "#cli/lib/telemetry.js";
import { updateProjectConfig } from "#config/project/projectConfig.js";
import { trpc } from "#trpc/client.js";

const createOrganization = async () => {
  const organizationName = await input({
    message: "Enter an organization name",
  });

  const organization = await trpc.organization.create.mutate({
    organizationName,
  });

  await telemetry.captureEvent("$action:organization:create");

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

  if (organizations.length === 1) {
    return organizations[0].id;
  }

  const createOption = {
    name: "Create a new organization",
    value: "create",
  };

  const organizationItems = organizations.map((organization) => ({
    name: organization.name,
    value: organization.id,
  }));

  const choice = await select({
    message: "Select which organization to create your project under",
    choices: [createOption, ...organizationItems],
    default: organizationItems[0].value,
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

  await telemetry.captureEvent("$action:project:create");

  return project.id;
};

const selectProject = async () => {
  const projects = await trpc.project.list.query();

  if (projects.length === 0) {
    console.log("You do not yet have any projects, creating one");
    console.log("");
    return createProject();
  }

  if (projects.length === 1 && projects[0].SeedDataSet.length === 0) {
    return projects[0].id;
  }

  const createOption = {
    name: "Create a new project",
    value: "create",
  };

  const projectItems = projects.map((project) => ({
    name: project.name,
    value: project.id,
  }));

  const choice = await select({
    message: "Select which project to link @snaplet/seed to",
    choices: [createOption, ...projectItems],
    default: projectItems[0].value,
  });

  if (choice === "create") {
    return createProject();
  } else {
    return choice;
  }
};

export const linkHandler = async () => {
  const projectId = await selectProject();
  await updateProjectConfig({ projectId });
  return projectId;
};
