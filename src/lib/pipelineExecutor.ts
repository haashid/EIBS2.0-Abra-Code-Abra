/**
 * Pipeline Executor - Orchestrates multi-applet pipeline execution on WeilChain
 * Handles real contract calls, payment distribution, and on-chain logging
 */

// Using any for wallet type since WeilWallet isn't exported from WeilProvider
type WeilWallet = any;

export interface PipelineApplet {
    id: number;
    name: string;
    address: string; // Contract address on WeilChain
    price: bigint;
    owner: string;
    methodName?: string; // Method to call on the applet contract (default: "process")
}

export interface PipelineExecutionResult {
    success: boolean;
    results: AppletResult[];
    finalOutput: any;
    totalCost: bigint;
    txHash: string;
    executionTime: number;
    error?: string;
}

export interface AppletResult {
    appletId: number;
    appletName: string;
    success: boolean;
    output: any;
    error?: string;
    executionTime: number;
    txHash?: string;
}

/**
 * Execute a single applet on-chain
 */
async function executeAppletOnChain(
    wallet: WeilWallet,
    applet: PipelineApplet,
    input: string
): Promise<AppletResult> {
    const startTime = Date.now();

    try {
        console.log(`Executing applet ${applet.name} (${applet.address}) with input:`, input);

        // Call the applet's execute function on-chain
        // Default to "execute" which is the standard entry point for all applets
        const method = applet.methodName || "execute";

        // Adapt input for logger contract structure if needed, or pass string for generic applets
        let args: any;

        if (method === "log_execution") {
            args = {
                applet_ids_json: JSON.stringify([applet.id || 0]),
                total_price: Number(applet.price || 0),
                result_hash: input || "process_execution"
            };
        } else {
            // Standard execute(input: string) -> string
            args = {
                input: input
            };
        }

        const result = await (wallet as any).contracts.execute(
            applet.address,
            method,
            args
        );

        console.log(`Applet ${applet.name} result:`, result);

        // Extract output from various response formats
        let output: any;
        if (result?.Ok) {
            output = result.Ok;
        } else if (result?.data) {
            output = result.data;
        } else if (result?.output) {
            output = result.output;
        } else {
            output = result;
        }

        // Check for execution errors
        if (result?.Err || result?.error) {
            throw new Error(result.Err || result.error);
        }

        const executionTime = Date.now() - startTime;
        const txHash = result?.transaction_id || result?.txId || `0x${Math.random().toString(16).substring(2, 66)}`;

        return {
            appletId: applet.id,
            appletName: applet.name,
            success: true,
            output,
            executionTime,
            txHash
        };

    } catch (error: any) {
        console.error(`Failed to execute applet ${applet.name}:`, error);

        return {
            appletId: applet.id,
            appletName: applet.name,
            success: false,
            output: null,
            error: error.message || 'Execution failed',
            executionTime: Date.now() - startTime
        };
    }
}

async function processPayment(
    wallet: WeilWallet,
    tokenAddress: string,
    applet: PipelineApplet
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        // Calculate fee distribution (90% developer / 10% platform)
        const totalPrice = applet.price;
        const platformFee = (totalPrice * BigInt(10)) / BigInt(100); // 10%
        const developerAmount = totalPrice - platformFee; // 90%

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💳 [PAYMENT] Processing token transfer');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📦 Applet:', applet.name);
        console.log('👤 Owner:', applet.owner);
        console.log('💰 Total Cost:', totalPrice.toString(), 'wei');
        console.log('💵 Developer Gets (90%):', developerAmount.toString(), 'wei');
        console.log('🏦 Platform Fee (10%):', platformFee.toString(), 'wei');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔐 Requesting WAuth approval for transfer...');

        // Transfer to applet owner
        const transferResult = await (wallet as any).contracts.execute(
            tokenAddress,
            "transfer",
            {
                to_addr: applet.owner,
                amount: Number(developerAmount)
            }
        );

        console.log('✅ [PAYMENT] WAuth transaction completed!');
        console.log('📝 Transfer result:', transferResult);

        const txHash = transferResult?.transaction_id || transferResult?.txId;
        console.log('🔗 Transaction Hash:', txHash);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // TODO: Also transfer platform fee (10%) to platform treasury
        // For now, just transferring to developer (90%)

        return {
            success: true,
            txHash
        };

    } catch (error: any) {
        console.error('❌ [PAYMENT] Transaction failed:', error);
        return {
            success: false,
            error: error.message || 'Payment failed'
        };
    }
}

async function logExecution(
    wallet: WeilWallet,
    loggerAddress: string,
    pipelineData: {
        appletIds: number[];
        inputHash: string;
        outputHash: string;
        totalCost: bigint;
        executionTime: number;
    }
): Promise<string | null> {
    try {
        console.log('[Pipeline Logger] Logging execution:', {
            logger: loggerAddress,
            appletIds: pipelineData.appletIds,
            totalCost: pipelineData.totalCost.toString()
        });

        const result = await (wallet as any).contracts.execute(
            loggerAddress,
            "log_execution",
            {
                applet_ids_json: JSON.stringify(pipelineData.appletIds),
                total_price: Number(pipelineData.totalCost),
                result_hash: pipelineData.outputHash // Using output hash as result
            }
        );

        console.log('[Pipeline Logger] Log result:', result);
        const txHash = result?.transaction_id || result?.txId || null;

        if (txHash) {
            console.log('[Pipeline Logger] ✅ Execution logged successfully with tx:', txHash);
        } else {
            console.warn('[Pipeline Logger] ⚠️ Logging may have failed - no transaction hash returned');
        }

        return txHash;

    } catch (error) {
        console.error('[Pipeline Logger] ❌ Failed to log execution:', error);
        return null;
    }
}

/**
 * Execute a pipeline of applets sequentially with payment and logging
 */
export async function executePipeline(
    wallet: WeilWallet,
    applets: PipelineApplet[],
    initialInput: string,
    tokenAddress: string,
    loggerAddress?: string
): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    const results: AppletResult[] = [];
    let currentInput = initialInput;
    let totalCost = BigInt(0);

    // Calculate total cost
    for (const applet of applets) {
        totalCost += applet.price;
    }

    console.log('Starting pipeline execution:', {
        numApplets: applets.length,
        totalCost: totalCost.toString(),
        initialInput
    });

    try {
        // Execute each applet in sequence
        for (const applet of applets) {
            // Process payment first
            const paymentResult = await processPayment(wallet, tokenAddress, applet);

            if (!paymentResult.success) {
                throw new Error(`Payment failed for ${applet.name}: ${paymentResult.error}`);
            }

            // Execute applet
            const appletResult = await executeAppletOnChain(wallet, applet, currentInput);
            results.push(appletResult);

            if (!appletResult.success) {
                // Pipeline fails if any applet fails
                throw new Error(`Applet ${applet.name} failed: ${appletResult.error}`);
            }

            // Use output as input for next applet
            currentInput = typeof appletResult.output === 'string'
                ? appletResult.output
                : JSON.stringify(appletResult.output);
        }

        const executionTime = Date.now() - startTime;
        const finalOutput = results[results.length - 1]?.output;

        // Generate pipeline transaction hash (use last applet's tx hash)
        const txHash = results[results.length - 1]?.txHash || `0x${Math.random().toString(16).substring(2, 66)}`;

        // Log execution on-chain if logger available
        if (loggerAddress) {
            const inputHash = hashString(initialInput);
            const outputHash = hashString(JSON.stringify(finalOutput));

            const logTxHash = await logExecution(wallet, loggerAddress, {
                appletIds: applets.map(a => a.id),
                inputHash,
                outputHash,
                totalCost,
                executionTime
            });

            console.log('Execution logged on-chain:', logTxHash);
        }

        return {
            success: true,
            results,
            finalOutput,
            totalCost,
            txHash,
            executionTime
        };

    } catch (error: any) {
        console.error('Pipeline execution failed:', error);

        return {
            success: false,
            results,
            finalOutput: null,
            totalCost,
            txHash: '',
            executionTime: Date.now() - startTime,
            error: error.message || 'Pipeline execution failed'
        };
    }
}

/**
 * Simple hash function for strings (for demonstration)
 * In production, use a proper cryptographic hash
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16).padStart(8, '0');
}

/**
 * Approve token spending before pipeline execution
 */
export async function approveTokenSpending(
    wallet: WeilWallet,
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        console.log('Approving token spending:', {
            token: tokenAddress,
            spender: spenderAddress,
            amount: amount.toString()
        });

        const result = await (wallet as any).contracts.execute(
            tokenAddress,
            "approve",
            {
                spender: spenderAddress,
                amount: Number(amount)
            }
        );

        const txHash = result?.transaction_id || result?.txId;

        return {
            success: true,
            txHash
        };

    } catch (error: any) {
        console.error('Token approval failed:', error);
        return {
            success: false,
            error: error.message || 'Approval failed'
        };
    }
}
