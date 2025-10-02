# backend/app.py
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import xgboost as xgb
import numpy as np
from transformers import GPT2Tokenizer, GPT2LMHeadModel, pipeline
import torch

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# load preprocessor + model (files placed in backend/)

xgb_model = joblib.load("xgboost_model.json")
scaler = joblib.load("scaler.pkl")
pca = joblib.load("pca.pkl")
# xgb_model = joblib.load("xgboost_model.pkl")

# Load local fine-tuned GPT model directory (placed in backend/gpt2-machine-health)
tokenizer = GPT2Tokenizer.from_pretrained("gpt2-machine-health")
gpt_model = GPT2LMHeadModel.from_pretrained("gpt2-machine-health")
gpt_model.eval()
gen_pipeline = pipeline("text-generation", model=gpt_model, tokenizer=tokenizer,
                        device=0 if torch.cuda.is_available() else -1)

status_map = {
    0: "🟢 Normal Operation",
    1: "🟡 Light Stress (Heat Dissipation Issue)",
    2: "🟠 Medium Stress (Power Fluctuation)",
    3: "🔴 High Stress (Overstrain)",
    4: "⚙️ Tool Wear",
    5: "🔥 Critical Condition (Major Failure)"
}

remedy = {
    0: ["- No issues detected.", "- Continue regular maintenance schedules.", "- Monitor for anomalies periodically."],
    1: ["- Check and clean ventilation systems and cooling fans.", "- Inspect temperature sensors for drift.", "- Ensure proper airflow around the machine."],
    2: ["- Check power supply voltage and grounding.", "- Inspect motor load and inverter settings.", "- Look for inconsistent current draw or transient spikes."],
    3: ["- Reduce machine load or runtime if possible.", "- Inspect mechanical connections and shafts.", "- Lubricate moving parts and verify torque settings."],
    4: ["- Inspect tool edges for dullness or breakage.", "- Replace or sharpen tools as needed.", "- Recalibrate tool alignment after replacement.", "- Log tool usage data to track wear trends."],
    5: ["- Immediately stop machine operation.", "- Run full diagnostics on all subsystems.", "- Check for major electrical or mechanical faults.", "- Escalate to technical support or maintenance team.", "- Review logs for root cause before restarting."]
}

class InputData(BaseModel):
    machine_id: str
    air_temp: float
    process_temp: float
    torque: float
    tool_wear: float
    rotational_speed: int
    machine_type: str  # "High Performance" | "Low Power" | "Medium Duty"

@app.post("/predict")
def predict(data: InputData):
    type_H = 1 if data.machine_type == "High Performance" else 0
    type_L = 1 if data.machine_type == "Low Power" else 0
    type_M = 1 if data.machine_type == "Medium Duty" else 0

    input_arr = np.array([[data.air_temp, data.process_temp, data.torque, data.tool_wear,
                           data.rotational_speed, type_H, type_L, type_M]])
    try:
        scaled = scaler.transform(input_arr)
        reduced = pca.transform(scaled)
        dmatrix = xgb.DMatrix(reduced)
        preds = xgb_model.predict(dmatrix)

        # normalize to probabilities if necessary and extract class
        if isinstance(preds[0], (list, np.ndarray)):
            probs = preds[0].tolist()
            pred_class = int(np.argmax(preds[0]))
        else:
            probs = preds.tolist()
            pred_class = int(np.argmax(preds))

        status = status_map.get(pred_class, "Unknown")
        suggestion_text = "\n".join(remedy.get(pred_class, ["No suggestions available."]))

        prompt = f"""Condition: {status}
Maintenance Suggestions:
{suggestion_text}

Machine ID: {data.machine_id}
Assistant:"""

        generated = gen_pipeline(prompt, max_length=150, num_return_sequences=1, do_sample=True)[0]["generated_text"]
        assistant_reply = generated.split("Assistant:")[-1].strip()

        return {
            "machine_id": data.machine_id,
            "prediction": pred_class,
            "status": status,
            "probabilities": probs,
            "recommendation": assistant_reply
        }
    except Exception as e:
        return {"error": str(e)}
