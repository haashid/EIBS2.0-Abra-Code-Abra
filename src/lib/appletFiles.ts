/**
 * Local Applet File Mapping
 * Maps applet contract addresses to their local file paths
 * Used when IPFS is not available
 */

export interface AppletFiles {
    wasmPath: string;
    widlPath: string;
    name: string;
}

// Map applet addresses to their local files
export const APPLET_FILES: Record<string, AppletFiles> = {
    // Text Processor
    'aaaaaakwbdx4hkqp5qygs6duqhkvca6pfutr7brba3irymqrkwhaopoi2i': {
        wasmPath: '/applets/text_processor/text_processor.wasm',
        widlPath: '/applets/text_processor/text_processor.widl',
        name: 'Text Processor',
    },
    // Hash Generator
    'aaaaaaocpn7f2iowukc4y5zpqcfsj4cjylzwbj4wzn5c6v2eflzjoejfze': {
        wasmPath: '/applets/hash_generator/hash_generator.wasm',
        widlPath: '/applets/hash_generator/hash_generator.widl',
        name: 'Hash Generator',
    },
    // Data Validator
    'aaaaaaop5vyzot6y7i4vawahnfiecnwfsi6alyyxrnrooxg76dxaxhhm4m': {
        wasmPath: '/applets/data_validator/data_validator.wasm',
        widlPath: '/applets/data_validator/data_validator.widl',
        name: 'Data Validator',
    },
    // Echo Transform
    'aaaaaajfgmlnfr644n62h4gc4fldn74lsr3ndfegmmrsqacfeqvhbkc6me': {
        wasmPath: '/applets/echo_transform/echo_transform.wasm',
        widlPath: '/applets/echo_transform/echo_transform.widl',
        name: 'Echo Transform',
    },
};

/**
 * Get local file paths for an applet by address
 */
export function getAppletFiles(appletAddress: string): AppletFiles | null {
    return APPLET_FILES[appletAddress] || null;
}

/**
 * Check if an applet has local files available
 */
export function hasLocalFiles(appletAddress: string): boolean {
    return appletAddress in APPLET_FILES;
}
