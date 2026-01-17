export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface SchemaField {
  id: string;
  key: string; // The "Key-as-String" enforcement
  type: DataType;
  value: string | number | boolean | null; // For primitive types
  children?: SchemaField[]; // For type 'object', these are properties (have keys)
  items?: SchemaField[]; // For type 'array', these are items (no keys)
  isOpen?: boolean; // UI state for collapse/expand
}
