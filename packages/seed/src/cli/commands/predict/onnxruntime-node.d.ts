declare module 'onnxruntime-node' {
    export class Tensor {
      constructor(type: string, data: BigInt64Array | Float32Array | Int32Array | Uint8Array, dims?: number[]);
      data: BigInt64Array | Float32Array | Int32Array | Uint8Array;
      type: string;
      dims: number[];
    }
  
    export interface InferenceSession {
      static create(path: string): Promise<InferenceSession>;
      run(feeds: { [name: string]: Tensor }): Promise<{ [name: string]: { data: Float32Array | BigInt64Array } }>;
      release(): Promise<void>;
    }
  
    export interface SessionOptions {
      // Add relevant options if needed
    }
  }
  