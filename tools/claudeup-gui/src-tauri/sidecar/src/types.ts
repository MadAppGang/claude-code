/**
 * JSON-RPC 2.0 Type Definitions
 * Based on specification: https://www.jsonrpc.org/specification
 */

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: object | any[];
  id: number | string;
}

export interface JsonRpcSuccessResponse {
  jsonrpc: '2.0';
  result: any;
  id: number | string;
}

export interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  error: JsonRpcError;
  id: number | string | null;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: object | any[];
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

/**
 * Standard JSON-RPC error codes
 */
export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,

  // Application-specific errors (use -32000 to -32099)
  FILE_NOT_FOUND: -32001,
  PERMISSION_DENIED: -32002,
  NETWORK_ERROR: -32003,
  VALIDATION_ERROR: -32004,
  OPERATION_CANCELLED: -32005,
  MARKETPLACE_EXISTS: -32010,
  MARKETPLACE_NOT_FOUND: -32011,
  DEFAULT_MARKETPLACE_REMOVAL: -32012,
  INVALID_GIT_URL: -32013,
} as const;

/**
 * Progress event parameters
 */
export interface ProgressParams {
  operation: string;
  percent: number;
  status: string;
  cancellable?: boolean;
}

/**
 * RPC method handler type
 */
export type RpcMethodHandler = (params: any) => Promise<any>;
