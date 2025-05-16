'use strict';

class JsonRpcError extends Error {
    constructor(code, message, data = null) {
        super(message);
        this.code = code;
        this.data = data;
    }
}

const ErrorCodes = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    SERVER_ERROR_START: -32000,
    SERVER_ERROR_END: -32099,
    TIMEOUT: -32001
};

function createResponse(id, result = null, error = null) {
    return {
        jsonrpc: "2.0",
        id,
        ...(error ? { error } : { result })
    };
}

module.exports = {
    JsonRpcError,
    ErrorCodes,
    createResponse
};