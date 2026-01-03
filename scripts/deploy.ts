import hre from "hardhat";

async function main() {
    console.log("Deploying WeilChain Nexus contracts to", hre.network.name);

    // Deploy AppletRegistry
    const AppletRegistry = await hre.ethers.getContractFactory("AppletRegistry");
    const appletRegistry = await AppletRegistry.deploy();
    await appletRegistry.waitForDeployment();
    const registryAddress = await appletRegistry.getAddress();
    console.log("AppletRegistry deployed to:", registryAddress);

    // Deploy ExecutionLogger
    const ExecutionLogger = await hre.ethers.getContractFactory("ExecutionLogger");
    const executionLogger = await ExecutionLogger.deploy();
    await executionLogger.waitForDeployment();
    const loggerAddress = await executionLogger.getAddress();
    console.log("ExecutionLogger deployed to:", loggerAddress);

    console.log("\n=== Deployment Complete ===");
    console.log("Add these to your .env.local file:");
    console.log(`NEXT_PUBLIC_REGISTRY_ADDRESS=${registryAddress}`);
    console.log(`NEXT_PUBLIC_EXECUTION_ADDRESS=${loggerAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
