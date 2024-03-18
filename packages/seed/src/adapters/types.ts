export interface Adapter {
  id: string;
  packageName: string;
  template: (parameters?: string) => string;
}
