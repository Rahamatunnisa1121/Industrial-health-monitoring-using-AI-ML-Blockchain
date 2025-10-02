# AI-Powered Predictive Maintenance with Blockchain Verification

## Overview

This project combines **AI-driven predictive maintenance** with **blockchain-based record verification**. It predicts machine health conditions using **XGBoost** and a **GPT-based assistant**, and securely stores machine status and recommendations on a **local Ethereum blockchain** (Hardhat). The interface is built in **React** with a clean, interactive UI.

---

## Features

* **Machine Health Prediction**: Uses XGBoost to classify machine conditions into levels from Normal to Critical.
* **AI Recommendations**: GPT-based text generation provides actionable maintenance guidance.
* **Blockchain Storage**: Stores predictions and recommendations on Ethereum for tamper-proof logging.
* **Interactive React UI**: Input parameters, view predictions, and store/fetch records from blockchain.
* **Transaction Status Feedback**: Real-time updates on blockchain operations.

---

## Technologies

* **AI/ML**: Python, XGBoost, PyTorch, GPT2 for fine-tuned text generation.
* **Blockchain**: Hardhat (local Ethereum), Solidity smart contract.
* **Frontend**: React.js, Tailwind CSS, Lucide-react icons.
* **Backend API**: Python FastAPI (serving prediction endpoints).

---

## Installation

### Prerequisites

* Node.js (v18+ recommended)
* Python 3.9+
* MetaMask extension installed in browser
* Hardhat (npm)

---

### Backend Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Run the FastAPI server for prediction:

```bash
uvicorn main:app --reload
```

3. Ensure models and preprocessing files are in place:

* `scaler.pkl`
* `pca.pkl`
* `xgboost_model.pkl`
* Fine-tuned GPT2 model folder `gpt2-machine-health`

---

### Blockchain Setup

1. Start Hardhat local node:

```bash
npx hardhat node
```

2. Deploy smart contract:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Copy deployed contract address to `config.js`:

```javascript
export const CONTRACT_ADDRESS = "0xYourDeployedAddress";
export const CONTRACT_ABI = abi; // ABI JSON file
```

4. Import one of the Hardhat accounts into MetaMask and select network:

* RPC URL: `http://127.0.0.1:8545`
* Chain ID: `1337`

---

### Frontend Setup

1. Install dependencies:

```bash
npm install
npm install ethers@5
```

2. Start React app:

```bash
npm start
```

3. Open browser and access `http://localhost:3000`.

---

## Usage

1. **Input machine parameters**: Enter temperature, torque, tool wear, rotational speed, and machine type.
2. **Run AI Prediction**: Click “Run AI Prediction” to get machine status and recommendation.
3. **Store on Blockchain**: Click “Store on Blockchain” to save results to Ethereum. Confirm the MetaMask transaction.
4. **Fetch Records**: Retrieve all stored records from blockchain for verification.

---

## Notes

* Always ensure Hardhat node is running when interacting with blockchain.
* Make sure MetaMask is connected to the same local network (RPC 8545).
* The recommendation text is truncated to 500 characters to avoid gas limit issues.

---

## File Structure

```
/backend
  - main.py
  - models/
    - scaler.pkl
    - pca.pkl
    - xgboost_model.pkl
    - gpt2-machine-health/
  - requirements.txt

/frontend
  - src/
    - App.jsx
    - config.js
  - package.json

/contract
  - MaintenanceRecord.sol
  - scripts/deploy.js
  - contractABI.json
```

---

## Future Enhancements

* Support for real-time IoT machine data streaming.
* Deployment to a public Ethereum testnet.
* Enhanced GPT recommendation system with context-aware explanations.
* User authentication for multi-user management.

---

## License

MIT License
