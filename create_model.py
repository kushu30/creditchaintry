import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
from sklearn.model_selection import train_test_split

def create_and_save_model():
    print("Generating synthetic data...")
    np.random.seed(42)
    num_samples = 1000

    data = {
        'wallet_age_days': np.random.randint(1, 3650, size=num_samples),
        'transaction_volume_usd': np.random.uniform(100, 100000, size=num_samples),
        'defi_participation': np.random.choice([True, False], size=num_samples),
        'repayment_streaks': np.random.randint(0, 50, size=num_samples)
    }
    df = pd.DataFrame(data)
    
    weights = {
        'wallet_age_days': 0.2,
        'transaction_volume_usd': 0.4,
        'defi_participation': 0.1,
        'repayment_streaks': 0.3
    }
    
    df['trust_score_raw'] = (
        df['wallet_age_days'] * weights['wallet_age_days'] / 3650 +
        df['transaction_volume_usd'] * weights['transaction_volume_usd'] / 100000 +
        df['defi_participation'] * weights['defi_participation'] +
        df['repayment_streaks'] * weights['repayment_streaks'] / 50
    )
    
    min_raw_score = df['trust_score_raw'].min()
    max_raw_score = df['trust_score_raw'].max()
    
    df['trust_score'] = 1 + ((df['trust_score_raw'] - min_raw_score) * 99) / (max_raw_score - min_raw_score)
    df['trust_score'] = df['trust_score'].astype(int)

    print("Training XGBoost model...")
    X = df[['wallet_age_days', 'transaction_volume_usd', 'defi_participation', 'repayment_streaks']]
    y = df['trust_score']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )
    model.fit(X_train, y_train)

    print(f"Model trained. Test score (R^2): {model.score(X_test, y_test):.4f}")

    model_filename = 'risk_model.pkl'
    with open(model_filename, 'wb') as file:
        pickle.dump(model, file)
    print(f"Model saved successfully to '{model_filename}'")

if __name__ == "__main__":
    create_and_save_model()
