export interface Store {
  _store: Record<string, Array<any>>
  add(model: string, value: any): void
  toSQL(): Array<string>
}