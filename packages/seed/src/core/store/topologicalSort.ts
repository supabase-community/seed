import assert from "node:assert";
import { type DataModel, type DataModelModel } from "../dataModel/types.js";
import { isError } from "../utils.js";

interface INodeWithChildren<KeyType extends string, ValueType> {
  children: InternalNodesMap<KeyType, ValueType>;
  node: ValueType;
}

type InternalNodesMap<KeyType extends string, ValueType> = Map<
  KeyType,
  INodeWithChildren<KeyType, ValueType>
>;

/**
 * From https://github.com/1999/topological-sort/blob/f01290bbd34579d121f4a07c4f89357a41326916/src/index.ts
 */
class TopologicalSort<KeyType extends string, ValueType> {
  private nodes: InternalNodesMap<KeyType, ValueType>;
  private sortedKeysStack: Array<KeyType> = [];
  private visitedNodes = new Set<INodeWithChildren<KeyType, ValueType>>();

  constructor(nodes: Map<KeyType, ValueType>) {
    this.nodes = new Map();
    this.addMultipleInternalNodes(nodes);
  }

  private addInternalNode(key: KeyType, node: ValueType) {
    assert.strictEqual(
      this.nodes.has(key),
      false,
      `Node ${key} already exists`,
    );

    this.nodes.set(key, {
      children: new Map(),
      node,
    });

    return this;
  }

  private addMultipleInternalNodes(nodes: Map<KeyType, ValueType>) {
    const nodesFlat = [...nodes];

    for (let i = nodes.size - 1; i >= 0; i--) {
      const [key, node] = nodesFlat[i];
      this.addInternalNode(key, node);
    }
  }

  private exploreNode(nodeKey: KeyType, explorePath: Array<KeyType>) {
    const newExplorePath = [...explorePath, nodeKey];

    // we should check circular dependencies starting from node 2
    if (explorePath.length) {
      assert(
        !explorePath.includes(nodeKey),
        `Node ${nodeKey} forms circular dependency: ${newExplorePath.join(" -> ")}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const node = this.nodes.get(nodeKey)!;
    if (this.visitedNodes.has(node)) {
      return;
    }

    // mark node as visited so that it and its children
    // won't be explored next time
    this.visitedNodes.add(node);

    for (const [childNodeKey] of node.children) {
      this.exploreNode(childNodeKey, newExplorePath);
    }

    this.sortedKeysStack.push(nodeKey);
  }

  addEdge(fromKey: KeyType, toKey: KeyType) {
    assert(
      this.nodes.has(fromKey),
      `Source node with ${fromKey} key should exist`,
    );
    assert(this.nodes.has(toKey), `Target node with ${toKey} key should exist`);

    const sourceNode = this.nodes.get(fromKey);
    const targetNode = this.nodes.get(toKey);

    assert.strictEqual(
      sourceNode !== undefined,
      true,
      `Source node with key ${fromKey} doesn't exist`,
    );
    assert.strictEqual(
      targetNode !== undefined,
      true,
      `Target node with key ${toKey} doesn't exist`,
    );

    assert.strictEqual(
      sourceNode?.children.has(toKey),
      false,
      `Source node ${fromKey} already has an edge to target node ${toKey}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    sourceNode.children.set(toKey, targetNode!);
  }

  addNode(key: KeyType, node: ValueType) {
    return this.addInternalNode(key, node);
  }

  addNodes(nodes: Map<KeyType, ValueType>) {
    this.addMultipleInternalNodes(nodes);
  }

  sort(): Map<KeyType, INodeWithChildren<KeyType, ValueType>> {
    this.visitedNodes = new Set();
    this.sortedKeysStack = [];
    const output = new Map<KeyType, INodeWithChildren<KeyType, ValueType>>();

    for (const [key] of this.nodes) {
      this.exploreNode(key, []);
    }

    for (let i = this.sortedKeysStack.length - 1; i >= 0; i--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const node = this.nodes.get(this.sortedKeysStack[i])!;
      output.set(this.sortedKeysStack[i], node);
    }

    return output;
  }
}

export function sortModels(dataModel: DataModel) {
  const nodes = new Map();
  const models = Object.entries(dataModel.models).map(([modelName, model]) => ({
    ...model,
    modelName,
  }));
  for (const model of models) {
    nodes.set(model.modelName, model);
  }
  const sortOp = new TopologicalSort(nodes);
  for (const model of models) {
    const parents = model.fields.filter(
      (f) => f.kind === "object" && f.relationFromFields.length > 0,
    );
    for (const parent of parents) {
      if (parent.isRequired) {
        try {
          sortOp.addEdge(model.modelName, parent.type);
        } catch (e) {
          const isDoubleEdgeError =
            isError(e) &&
            e.message.includes("already has an edge to target node");
          if (!isDoubleEdgeError) {
            throw e;
          }
        }
      }
    }
  }

  return [...sortOp.sort().values()]
    .reverse()
    .map((m) => m.node as { modelName: string } & DataModelModel);
}
