async function main() {
  const PredictiveMaintenance = await ethers.getContractFactory(
    "PredictiveMaintenance"
  );
  const pm = await PredictiveMaintenance.deploy();

  // Wait until the contract is mined
  await pm.waitForDeployment();

  console.log("PredictiveMaintenance deployed to:", await pm.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
