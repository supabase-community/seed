export interface Adapter {
  id: string;
  name: string;
  packageName: string;
  template: (parameters?: string) => string;
}
