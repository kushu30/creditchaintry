import pickle
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BorrowerData(BaseModel):
    wallet_age_days: int
    transaction_volume_usd: float
    defi_participation: bool
    repayment_streaks: int

try:
    with open('risk_model.pkl', 'rb') as file:
        model = pickle.load(file)
except FileNotFoundError:
    print("Model file 'risk_model.pkl' not found. Please run 'create_model.py' first.")
    model = None
except Exception as e:
    print(f"An error occurred while loading the model: {e}")
    model = None

@app.get("/")
def read_root():
    return {"message": "CrediChain Trust Score API"}

@app.post("/score")
def get_trust_score(data: BorrowerData):
    if model is None:
        return {"error": "Model not loaded. Cannot process request."}

    input_data = pd.DataFrame([data.dict()])
    
    prediction = model.predict(input_data)[0]
    
    score = max(1, min(100, int(prediction)))
    
    return {"trust_score": score}
