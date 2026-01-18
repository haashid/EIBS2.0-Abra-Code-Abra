/**
 * WIDL Parser - Extract interface definitions from WIDL files
 * Used for applet registration to parse schemas and function signatures
 */

export interface WIDLFunction {
    name: string;
    type: 'query' | 'mutate' | 'constructor';
    params: Array<{ name: string; type: string }>;
    returnType: string;
}

export interface WIDLStruct {
    name: string;
    fields: Array<{ name: string; type: string }>;
}

export interface WIDLInterface {
    name: string;
    functions: WIDLFunction[];
    structs: WIDLStruct[];
}

export interface ParsedWIDL {
    interfaces: WIDLInterface[];
    structs: WIDLStruct[];
    inputSchema?: string;
    outputSchema?: string;
}

/**
 * Parse WIDL file content to extract interface definitions
 */
export function parseWIDL(widlContent: string): ParsedWIDL {
    const lines = widlContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));

    const interfaces: WIDLInterface[] = [];
    const structs: WIDLStruct[] = [];

    let currentInterface: WIDLInterface | null = null;
    let currentStruct: WIDLStruct | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Parse interface declaration
        if (line.startsWith('interface ')) {
            const interfaceName = line.match(/interface\s+(\w+)/)?.[1] || 'Unknown';
            currentInterface = {
                name: interfaceName,
                functions: [],
                structs: []
            };
            continue;
        }

        // Parse struct/record declaration
        if (line.startsWith('record ') || line.startsWith('struct ')) {
            const structName = line.match(/(?:record|struct)\s+(\w+)/)?.[1] || 'Unknown';
            currentStruct = {
                name: structName,
                fields: []
            };
            continue;
        }

        // End of interface or struct
        if (line === '}') {
            if (currentInterface) {
                interfaces.push(currentInterface);
                currentInterface = null;
            }
            if (currentStruct) {
                structs.push(currentStruct);
                currentStruct = null;
            }
            continue;
        }

        // Parse function inside interface
        if (currentInterface && (line.includes('query') || line.includes('mutate') || line.includes('constructor'))) {
            const func = parseFunctionSignature(line);
            if (func) {
                currentInterface.functions.push(func);
            }
        }

        // Parse field inside struct
        if (currentStruct && line.includes(':')) {
            const field = parseStructField(line);
            if (field) {
                currentStruct.fields.push(field);
            }
        }
    }

    // Generate input/output schemas from the first interface's functions
    let inputSchema = 'JSON';
    let outputSchema = 'JSON';

    if (interfaces.length > 0) {
        const mainInterface = interfaces[0];
        const executeFn = mainInterface.functions.find(f => f.name === 'execute');

        if (executeFn) {
            inputSchema = executeFn.params.length > 0 ? executeFn.params[0].type : 'String';
            outputSchema = executeFn.returnType;
        }
    }

    return {
        interfaces,
        structs,
        inputSchema,
        outputSchema
    };
}

/**
 * Parse a WIDL function signature
 */
function parseFunctionSignature(line: string): WIDLFunction | null {
    try {
        // Extract function type (query, mutate, constructor)
        const typeMatch = line.match(/(query|mutate|constructor)/);
        if (!typeMatch) return null;

        const type = typeMatch[1] as 'query' | 'mutate' | 'constructor';

        // Extract function name and signature
        const funcMatch = line.match(/func\s+(\w+)\s*\((.*?)\)\s*(?:->\s*(.+?))?[;{]?/);
        if (!funcMatch) {
            // Handle constructor specially
            if (type === 'constructor') {
                const constructorMatch = line.match(/constructor\s+(\w+)\s*\((.*?)\)\s*(?:->\s*(.+?))?[;{]?/);
                if (constructorMatch) {
                    const [, name, paramsStr, returnType] = constructorMatch;
                    return {
                        name,
                        type,
                        params: parseParams(paramsStr || ''),
                        returnType: returnType?.trim() || 'void'
                    };
                }
            }
            return null;
        }

        const [, name, paramsStr, returnType] = funcMatch;

        return {
            name,
            type,
            params: parseParams(paramsStr || ''),
            returnType: returnType?.trim() || 'void'
        };
    } catch (error) {
        console.error('Failed to parse function signature:', line, error);
        return null;
    }
}

/**
 * Parse function parameters
 */
function parseParams(paramsStr: string): Array<{ name: string; type: string }> {
    if (!paramsStr.trim()) return [];

    const params = paramsStr.split(',').map(p => p.trim());
    return params.map(param => {
        const parts = param.split(':').map(p => p.trim());
        if (parts.length === 2) {
            return { name: parts[0], type: parts[1] };
        }
        return { name: param, type: 'unknown' };
    }).filter(p => p.name);
}

/**
 * Parse struct field
 */
function parseStructField(line: string): { name: string; type: string } | null {
    const match = line.match(/(\w+)\s*:\s*([^,]+)/);
    if (match) {
        return {
            name: match[1].trim(),
            type: match[2].trim().replace(/[,;]/g, '')
        };
    }
    return null;
}

/**
 * Generate schema description from WIDL interface
 */
export function generateSchemaDescription(parsedWIDL: ParsedWIDL): string {
    if (parsedWIDL.interfaces.length === 0) {
        return 'No interface found';
    }

    const mainInterface = parsedWIDL.interfaces[0];
    const descriptions: string[] = [];

    mainInterface.functions.forEach(func => {
        if (func.name !== 'new' && func.name !== 'constructor') {
            const paramList = func.params.map(p => `${p.name}: ${p.type}`).join(', ');
            descriptions.push(`${func.name}(${paramList}) → ${func.returnType}`);
        }
    });

    return descriptions.join('\n');
}

/**
 * Validate WIDL has required execute function
 */
export function validateAppletWIDL(parsedWIDL: ParsedWIDL): { valid: boolean; error?: string } {
    if (parsedWIDL.interfaces.length === 0) {
        return { valid: false, error: 'No interface found in WIDL file' };
    }

    const mainInterface = parsedWIDL.interfaces[0];
    const hasExecute = mainInterface.functions.some(f => f.name === 'execute');

    if (!hasExecute) {
        return { valid: false, error: 'Applet must have an "execute" function' };
    }

    return { valid: true };
}
