#!/usr/bin/env python3
"""
SMOTE preprocessing script for Amazon Neighborhood seller chatbot training data.
Run this before fine-tuning to balance minority classes.

Install: pip install pandas scikit-learn imbalanced-learn
"""

import pandas as pd
import json
from sklearn.preprocessing import LabelEncoder
from imblearn.over_sampling import SMOTE
import numpy as np

# ── 1. Load data ──────────────────────────────────────────────────
df = pd.read_csv("seller_chatbot_training_data.csv")
print(f"Original dataset: {len(df)} rows")
print(f"\nClass distribution (condition_grade):\n{df['condition_grade'].value_counts()}")
print(f"\nClass distribution (category):\n{df['category'].value_counts()}")

# ── 2. Encode categorical features for SMOTE ──────────────────────
# SMOTE works on numeric features only — encode everything
le_category     = LabelEncoder()
le_grade        = LabelEncoder()
le_reason       = LabelEncoder()
le_question     = LabelEncoder()

df_encoded = df.copy()
df_encoded["category_enc"]   = le_category.fit_transform(df["category"])
df_encoded["grade_enc"]      = le_grade.fit_transform(df["condition_grade"])
df_encoded["reason_enc"]     = le_reason.fit_transform(df["reason_code"])
df_encoded["question_enc"]   = le_question.fit_transform(df["question_type"])

# ── 3. Define features and target ─────────────────────────────────
# Target: condition_grade (most imbalanced: Good=128, Like New=28, Fair=4)
X = df_encoded[["category_enc", "grade_enc", "reason_enc", "question_enc", "age_years"]]
y = df_encoded["grade_enc"]

print(f"\nBefore SMOTE: {dict(zip(*np.unique(y, return_counts=True)))}")

# ── 4. Apply SMOTE ────────────────────────────────────────────────
smote = SMOTE(
    sampling_strategy="not majority",  # oversample all minority classes
    k_neighbors=2,                      # low k because Fair class has only 4 samples
    random_state=42
)
X_resampled, y_resampled = smote.fit_resample(X, y)
print(f"After SMOTE:  {dict(zip(*np.unique(y_resampled, return_counts=True)))}")

# ── 5. Decode back to readable labels ─────────────────────────────
df_resampled = pd.DataFrame(X_resampled, columns=X.columns)
df_resampled["condition_grade"] = le_grade.inverse_transform(y_resampled.astype(int))
df_resampled["category"]        = le_category.inverse_transform(
    df_resampled["category_enc"].round().astype(int).clip(0, len(le_category.classes_)-1)
)
df_resampled["reason_code"]     = le_reason.inverse_transform(
    df_resampled["reason_enc"].round().astype(int).clip(0, len(le_reason.classes_)-1)
)
df_resampled["question_type"]   = le_question.inverse_transform(
    df_resampled["question_enc"].round().astype(int).clip(0, len(le_question.classes_)-1)
)

# ── 6. Map synthetic rows back to answers ─────────────────────────
# For SMOTE-generated rows, find closest real answer by matching
# category + condition_grade + question_type + reason_code
real_answers = df[["category", "condition_grade", "reason_code", "question_type", "answer"]].copy()

def find_best_answer(row, real_df):
    """Match synthetic row to real answer by priority: all 4 match → 3 → 2 → 1"""
    for cols in [
        ["category", "condition_grade", "question_type", "reason_code"],
        ["category", "condition_grade", "question_type"],
        ["condition_grade", "question_type"],
        ["question_type"]
    ]:
        mask = pd.Series([True] * len(real_df))
        for col in cols:
            if col in row.index and col in real_df.columns:
                mask &= (real_df[col] == row[col])
        matches = real_df[mask]
        if len(matches) > 0:
            return matches.sample(1)["answer"].values[0]
    return "I am selling this product as it is no longer needed by me and it is in good condition."

df_resampled["answer"] = df_resampled.apply(
    lambda row: find_best_answer(row, real_answers), axis=1
)

# ── 7. Format for Groq fine-tune / HuggingFace training ──────────
# Format 1: CSV (for sklearn pipelines)
df_final = df_resampled[["category", "condition_grade", "reason_code", "question_type", "age_years", "answer"]]
df_final.to_csv("seller_chatbot_smote_balanced.csv", index=False)
print(f"\nSaved balanced CSV: {len(df_final)} rows → seller_chatbot_smote_balanced.csv")

# Format 2: JSONL (for HuggingFace fine-tuning with transformers)
with open("seller_chatbot_hf_train.jsonl", "w") as f:
    for _, row in df_final.iterrows():
        entry = {
            "instruction": row["question_type"],
            "input": f"Product category: {row['category']}. Condition: {row['condition_grade']}. Age: {int(row['age_years'])} years. Reason for selling: {row['reason_code']}.",
            "output": row["answer"]
        }
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
print(f"Saved HuggingFace JSONL: seller_chatbot_hf_train.jsonl")

# Format 3: Groq-compatible messages format (for few-shot prompt building)
groq_examples = []
for _, row in df_final.iterrows():
    groq_examples.append({
        "messages": [
            {
                "role": "system",
                "content": "You are a seller on Amazon Neighborhood. Answer buyer questions naturally and honestly about your listed product. Keep answers to 2-3 sentences. Be specific about the product age, condition and reason for selling."
            },
            {
                "role": "user",
                "content": f"[Product: {row['category']}, {row['condition_grade']} condition, {int(row['age_years'])} years old] {row['question_type']}?"
            },
            {
                "role": "assistant",
                "content": row["answer"]
            }
        ]
    })

with open("seller_chatbot_groq_finetune.jsonl", "w") as f:
    for entry in groq_examples:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
print(f"Saved Groq fine-tune JSONL: seller_chatbot_groq_finetune.jsonl")

print("\n✅ All files generated. Use seller_chatbot_hf_train.jsonl for HuggingFace training.")
print("   Use seller_chatbot_groq_finetune.jsonl if Groq fine-tuning becomes available.")
print("   Use seller_chatbot_smote_balanced.csv for sklearn-based classifiers.")
