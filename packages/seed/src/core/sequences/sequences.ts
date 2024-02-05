import { type DataModel, type DataModelSequence } from "../dataModel/types.js";
import { type UserModels } from "../userModels/types.js";

export function sequenceGeneratorFactory(sequence: DataModelSequence) {
  return function* () {
    let current = sequence.current;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      yield current;
      current += sequence.increment;
    }
  };
}

/**
 * Utility function to generate the sequences for field in each model where the
 * field is a sequence and and an id
 */
export function generateUserModelsSequences(
  initialUserModels: UserModels,
  userModels: UserModels,
  dataModel: DataModel,
) {
  const sequences: Record<string, Generator<number, never>> = {};
  // For all the fields that are ids and have a sequence, we generate a sequence generator
  // or we use the one provided by the ctx if it exists
  for (const modelName of Object.keys(initialUserModels)) {
    const data = initialUserModels[modelName].data;
    for (const fieldName of Object.keys(data ?? {})) {
      const field = dataModel.models[modelName].fields.find(
        (f) => f.name === fieldName,
      );
      const fieldData = data[fieldName];
      if (field.isId && field.sequence && fieldData === null) {
        const sequenceGenerator = sequenceGeneratorFactory(field.sequence)();
        sequences[`${modelName}.${fieldName}`] = sequenceGenerator;
        userModels[modelName].data[fieldName] = () =>
          sequenceGenerator.next().value;
      }
    }
  }
  return sequences;
}
