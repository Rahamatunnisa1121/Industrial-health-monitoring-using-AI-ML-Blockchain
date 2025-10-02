// src/App.jsx
import React, { useState } from "react";
import {
  Activity,
  Database,
  Link,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./config"; // <-- make sure you create config.js

function App() {
  const [machineId, setMachineId] = useState("MACH-001");
  const [airTemp, setAirTemp] = useState(300.0);
  const [processTemp, setProcessTemp] = useState(310.0);
  const [torque, setTorque] = useState(40.0);
  const [toolWear, setToolWear] = useState(100.0);
  const [rotSpeed, setRotSpeed] = useState(1500);
  const [machineType, setMachineType] = useState("High Performance");

  const [predictionResult, setPredictionResult] = useState(null);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [records, setRecords] = useState([]);

  //formatting
  // ------------------ Format Recommendation ------------------
  // ------------------ Format Recommendation ------------------
  const formatRecommendation = (text) => {
    if (!text) return [];

    // Split by newlines and filter out empty lines
    const lines = text.split("\n").filter((line) => line.trim());

    // Process each line to remove "Remedy:" prefix and clean up
    const formatted = lines
      .map((line) => {
        // Remove "Remedy:" prefix (case insensitive)
        let cleaned = line.replace(/^Remedy:\s*/i, "").trim();
        // Remove "Problem:" prefix as well
        cleaned = cleaned.replace(/^Problem:\s*/i, "").trim();
        return cleaned;
      })
      .filter((line) => line.length > 0); // Remove any empty results

    // Remove duplicates using Set
    const unique = [...new Set(formatted)];

    return unique;
  };
  //formatting

  // ------------------ Prediction ------------------
  const predict = async () => {
    setLoadingPredict(true);
    try {
      const payload = {
        machine_id: machineId,
        air_temp: airTemp,
        process_temp: processTemp,
        torque: torque,
        tool_wear: toolWear,
        rotational_speed: rotSpeed,
        machine_type: machineType,
      };
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Prediction failed");
      }
      const data = await res.json();
      setPredictionResult(data);
    } catch (err) {
      alert("Prediction error: " + err.message);
    } finally {
      setLoadingPredict(false);
    }
  };

  // ------------------ Wallet Connect ------------------
  const connectWallet = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    return provider.getSigner();
  };

  // ------------------ Store on Blockchain ------------------
  const storeOnChain = async () => {
    if (!predictionResult) {
      alert("Run prediction first");
      return;
    }
    try {
      setTxStatus("Requesting wallet connection...");
      const signer = await connectWallet();
      setTxStatus("Connected. Preparing contract...");

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const shortRec = predictionResult.recommendation.slice(0, 500);
      setTxStatus("Sending transaction...");
      const tx = await contract.addRecord(
        predictionResult.machine_id,
        predictionResult.prediction,
        shortRec
      );
      setTxStatus(`Transaction sent: ${tx.hash}. Waiting for confirmation...`);
      await tx.wait();
      setTxStatus(`✅ Confirmed: ${tx.hash}`);
    } catch (err) {
      setTxStatus("Tx error: " + (err.message || err));
    }
  };

  // ------------------ Fetch Records ------------------
  const fetchRecords = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not available. Use provider to read.");
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const total = await contract.getTotalRecords();
      const t = total.toNumber ? total.toNumber() : Number(total);
      const arr = [];
      for (let i = 0; i < t; i++) {
        const r = await contract.getRecord(i);
        arr.push({
          index: i,
          machineId: r[0],
          condition: r[1],
          recommendation: r[2],
          timestamp: new Date(Number(r[3]) * 1000).toLocaleString(),
        });
      }
      setRecords(arr);
    } catch (err) {
      alert("Error fetching records: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">
              Predictive Maintenance
            </h1>
          </div>
          <p className="text-blue-200 text-lg">
            AI-Powered Analysis with Blockchain Verification
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Machine Parameters
              </h2>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Machine ID
                </label>
                <input
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Air Temp (K)
                  </label>
                  <input
                    type="number"
                    value={airTemp}
                    onChange={(e) => setAirTemp(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Process Temp (K)
                  </label>
                  <input
                    type="number"
                    value={processTemp}
                    onChange={(e) => setProcessTemp(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Torque (Nm)
                  </label>
                  <input
                    type="number"
                    value={torque}
                    onChange={(e) => setTorque(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Tool Wear (min)
                  </label>
                  <input
                    type="number"
                    value={toolWear}
                    onChange={(e) => setToolWear(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Rotation Speed (RPM)
                </label>
                <input
                  type="number"
                  value={rotSpeed}
                  onChange={(e) => setRotSpeed(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Machine Type
                </label>
                <select
                  value={machineType}
                  onChange={(e) => setMachineType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option>High Performance</option>
                  <option>Low Power</option>
                  <option>Medium Duty</option>
                </select>
              </div>

              <button
                onClick={predict}
                disabled={loadingPredict}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2"
              >
                <Activity className="w-5 h-5" />
                {loadingPredict ? "Analyzing..." : "Run AI Prediction"}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">
                Prediction Results
              </h2>
            </div>

            {predictionResult ? (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-blue-200 mb-1">Machine ID</p>
                  <p className="text-lg font-semibold text-white">
                    {predictionResult.machine_id}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-blue-200 mb-1">Condition Status</p>
                  <div className="flex items-center gap-2">
                    {predictionResult.prediction === "Normal" ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )}
                    <p className="text-lg font-semibold text-white">
                      {predictionResult.prediction} - {predictionResult.status}
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-blue-200 mb-3">
                    AI Recommendations
                  </p>
                  <div className="space-y-2">
                    {formatRecommendation(predictionResult.recommendation).map(
                      (rec, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <p className="text-white leading-relaxed flex-1">
                            {rec}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-blue-200 mb-2">
                    Confidence Levels
                  </p>
                  <pre className="text-xs text-green-300 bg-black/30 p-3 rounded overflow-x-auto">
                    {JSON.stringify(predictionResult.probabilities, null, 2)}
                  </pre>
                </div>

                <button
                  onClick={storeOnChain}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2"
                >
                  <Link className="w-5 h-5" />
                  Store on Blockchain
                </button>

                {txStatus && (
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-200 mb-1">
                      Transaction Status
                    </p>
                    <p className="text-white text-sm break-all">{txStatus}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Activity className="w-16 h-16 text-blue-400/30 mb-4" />
                <p className="text-blue-200/60 text-lg">No prediction yet</p>
                <p className="text-blue-200/40 text-sm mt-2">
                  Enter machine parameters and run prediction
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Records */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">
                Blockchain Records
              </h2>
            </div>
            <button
              onClick={fetchRecords}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold py-2 px-4 rounded-lg border border-purple-400/30"
            >
              Fetch Records
            </button>
          </div>

          {records.length > 0 ? (
            <div className="space-y-3">
              {records.map((r) => (
                <div
                  key={r.index}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full">
                        #{r.index}
                      </span>
                      <span className="text-white font-semibold">
                        {r.machineId}
                      </span>
                    </div>
                    <span className="text-blue-200 text-xs">{r.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {r.condition === "Normal" ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="text-sm text-blue-200">
                      Status: {r.condition}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mt-2">
                    {r.recommendation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="w-16 h-16 text-purple-400/30 mb-4" />
              <p className="text-blue-200/60 text-lg">No records found</p>
              <p className="text-blue-200/40 text-sm mt-2">
                Click "Fetch Records" to load blockchain data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;