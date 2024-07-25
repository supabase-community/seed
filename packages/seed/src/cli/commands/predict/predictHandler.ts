import {
  getProjectConfig,
  updateProjectConfig,
} from "#config/project/projectConfig.js";
import { computePredictionContext } from "#core/predictions/computePredictionContext.js";
import { getDataExamples } from "#core/predictions/shapeExamples/getDataExamples.js";
import { setDataExamples } from "#core/predictions/shapeExamples/setDataExamples.js";
import { formatInput } from "#core/predictions/utils.js";
import { bold, brightGreen, spinner } from "../../lib/output.js";
import {
  determineColumnDescription,
  determineProjectDescription,
} from "./describeFields.js";
import { generateExamples } from "./generateExamples.js";
import { listenForKeyPress } from "./listenForKeyPress.js";

const displayEnhanceProgress = ({
  percent,
  showSkip,
}: {
  percent?: number;
  showSkip?: boolean;
} = {}) => {
  const skipMessage = `ℹ Hit '${brightGreen("s")}' to skip AI-generated data`;

  if (!percent) {
    return [
      `Starting up tasks to generate sample data 🤖`,
      showSkip ? skipMessage : null,
    ]
      .filter(Boolean)
      .join("\n\n");
  } else {
    return [
      `[ ${percent}% ] Generating sample data... 🤖`,
      showSkip ? skipMessage : null,
    ]
      .filter(Boolean)
      .join("\n\n");
  }
};

export async function predictHandler(defaultExampleCount = 20) {
  try {
    spinner.start(displayEnhanceProgress());
    spinner.text = displayEnhanceProgress({
      showSkip: true,
    });
    const sKeyPress = listenForKeyPress("s");

    const { columns, dataModel } = await computePredictionContext();

    // Get or generate project description
    let projectConfig = await getProjectConfig();
    if (projectConfig.projectDescription === undefined) {
      spinner.text = `Generating project description...`;
      const tableNames = Object.keys(dataModel.models);
      const { description } = await determineProjectDescription(tableNames);

      await updateProjectConfig({
        ...projectConfig,
        projectDescription: description,
      });
      projectConfig = await getProjectConfig();
    }

    const dataExamples = await getDataExamples();

    const totalTasks = columns.length;
    let completedTasks = 0;
    const asyncTasks: Array<
      Promise<{
        columnName: string;
        description: string;
        examples?: Array<string>;
        schemaName: string;
        tableName: string;
      }>
    > = [];

    for (const column of columns) {
      asyncTasks.push(
        (async () => {
          const columnInput = formatInput([
            column.schemaName,
            column.tableName,
            column.columnName,
          ]);
          const currentDataExample = dataExamples.find(
            // The type for input is correct for newly generated examples (cannot be undefined)
            // But old examples might not have an input field so it can be undefined
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            (de) => de.input?.trim() === columnInput,
          );

          if (currentDataExample && currentDataExample.examples.length > 0) {
            spinner.info(
              `Examples already exists for column input ${columnInput}, skip generating examples...`,
            );
            completedTasks++;
            const percent = Math.round((completedTasks / totalTasks) * 100);
            spinner.text = displayEnhanceProgress({
              percent,
              showSkip: true,
            });
            return {
              ...column,
              description: currentDataExample.description,
              examples: currentDataExample.examples,
            };
          }

          const fullyQualifiedColumnName = [
            column.schemaName,
            column.tableName,
            column.columnName,
          ]
            .filter(Boolean) // Filter: null, undefined, 0, false, NaN, or an empty string
            .join(".");

          let columnDescription = currentDataExample
            ? currentDataExample.description
            : undefined;

          if (columnDescription) {
            spinner.info(
              `Description already exists for column input ${columnInput}, use existing description...`,
            );
          } else {
            // The fields in dataModel can be used in the future to get the adjacent columns
            // Below is super inefficient, but the DataModel make use of an alias
            // which I don't know how to determine consistently
            const adjacentStringColumns: Array<string> = columns
              .filter((c) => {
                if (column.schemaName) {
                  return (
                    c.schemaName === column.schemaName &&
                    c.tableName === column.tableName
                  );
                }
                return c.tableName === column.tableName;
              })
              .map((c) => c.columnName);

            const { description } = await determineColumnDescription(
              adjacentStringColumns,
              fullyQualifiedColumnName,
              projectConfig.projectDescription,
            );
            columnDescription = description;
          }

          const { newExamples } = await generateExamples(
            fullyQualifiedColumnName,
            defaultExampleCount,
            columnDescription,
          );

          completedTasks++;
          const percent = Math.round((completedTasks / totalTasks) * 100);
          spinner.text = displayEnhanceProgress({
            percent,
            showSkip: true,
          });
          return {
            ...column,
            description: columnDescription,
            examples: newExamples,
          };
        })(),
      );
    }

    const generationResult = await Promise.race([
      Promise.all(asyncTasks).then(async (res) => {
        const dataExamples = res.map((r) => ({
          input: formatInput([r.schemaName, r.tableName, r.columnName]),
          examples: r.examples ?? [],
          description: r.description,
        }));
        await setDataExamples(dataExamples);
        return "COMPLETE" as const;
      }),
      sKeyPress.promise.then(() => "CANCELLED_BY_USER" as const),
    ]);

    if (generationResult === "CANCELLED_BY_USER") {
      spinner.succeed(`Sample data generation ${bold("skipped")}`);
      spinner.clear();
      return { ok: true };
    }

    spinner.succeed(`Sample data generation complete! 🤖`);
    spinner.clear();
    return { ok: true };
  } catch (error) {
    spinner.fail(`Failed to generate sample data`);
    throw error;
  }
}
