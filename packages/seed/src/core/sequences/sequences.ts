import { type DataModel, type DataModelSequence } from "../dataModel/types.js";
import { type UserModels } from "../userModels/types.js";

function sequenceGeneratorFactory(
  sequence: { current: number } & DataModelSequence,
) {
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
export function patchUserModelsSequences(props: {
  dataModel: DataModel;
  initialUserModels: UserModels;
  sequencesCurrent: Record<string, number>;
  userModels: UserModels;
}) {
  const sequences = computeSequences(props);
  for (const sequence of sequences) {
    if (props.userModels[sequence.modelName].data === undefined) {
      props.userModels[sequence.modelName].data = {};
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    props.userModels[sequence.modelName].data![sequence.fieldName] = () =>
      sequence.generator.next().value;
  }
}

function computeSequences(props: {
  dataModel: DataModel;
  initialUserModels: UserModels;
  sequencesCurrent: Record<string, number>;
  userModels: UserModels;
}) {
  const sequences: Array<{
    fieldName: string;
    generator: Generator<number, never>;
    modelName: string;
  }> = [];
  // For all the fields that are ids and have a sequence, we generate a sequence generator
  // or we use the one provided by the ctx if it exists
  for (const modelName of Object.keys(props.initialUserModels)) {
    const data = props.initialUserModels[modelName].data ?? {};
    for (const fieldName of Object.keys(data)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const field = props.dataModel.models[modelName].fields.find(
        (f) => f.name === fieldName,
      )!;
      const fieldData = data[fieldName];
      if (
        field.isId &&
        field.sequence &&
        field.sequence.identifier !== null &&
        fieldData === null
      ) {
        const sequenceGenerator = sequenceGeneratorFactory({
          ...field.sequence,
          current: props.sequencesCurrent[field.sequence.identifier],
        })();

        sequences.push({
          fieldName,
          generator: sequenceGenerator,
          modelName,
        });
      }
    }
  }
  return sequences;
}
