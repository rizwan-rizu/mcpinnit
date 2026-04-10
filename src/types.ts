export interface ScaffoldOptions {
  serverName: string;
  serverDescription: string;
  transport: 'stdio' | 'http';
  language: 'typescript' | 'python';
  auth: 'none' | 'api-key' | 'oauth2';
  tools: string[];
  apiBaseUrl?: string;
  defaultHttpMethod?: string;
  envVars?: string[];
}

export interface MCPManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  tags: string[];
  transport: 'stdio' | 'http';
  language: 'typescript' | 'python';
  auth: {
    type: 'none' | 'api_key' | 'oauth2';
    scopes?: string[];
  };
  tools: {
    name: string;
    description: string;
    inputs: string[];
    outputs: string[];
  }[];
  install: string;
  repository?: string;
  homepage?: string;
  engines?: { node?: string; python?: string };
  env?: {
    key: string;
    description: string;
    required: boolean;
    url?: string;
  }[];
}

export interface ToolCallResult {
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  latencyMs: number;
  schemaValid: boolean;
  sizeBytes: number;
  passed: boolean;
}
