from collections import defaultdict, deque
import time

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import uuid
import re
from datetime import datetime, timedelta
from pathlib import Path

# Import your existing functions
from test import (
    load_model_and_metadata,
    prepare_X,
    predict,
    compute_contributions,
    export_pdf,
    export_excel,
    REGISTRY
)
from interpretation_rules import (
    generate_summary,
    generate_clinical_recommendations,
    generate_medication_recommendations,
    generate_related_disease_predictions,
    interpret_feature
)

MODEL_VERSION = os.getenv("ML_MODEL_VERSION", "1.0.0")

app = FastAPI(
    title="Readmission Risk Analysis API",
    description="Comprehensive hospital readmission risk prediction with clinical insights",
    version="2.0.0"
)

# Configure browser origins for local development and deployment.
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

ANALYZE_RATE_LIMIT = 30
ANALYZE_RATE_WINDOW_SECONDS = 60
analysis_request_times: dict[str, deque[float]] = defaultdict(deque)


@app.middleware("http")
async def limit_analysis_requests(request: Request, call_next):
    if request.method == "POST" and request.url.path in {"/analyze", "/upload"}:
        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        request_times = analysis_request_times[client_ip]
        window_start = now - ANALYZE_RATE_WINDOW_SECONDS

        while request_times and request_times[0] <= window_start:
            request_times.popleft()

        if len(request_times) >= ANALYZE_RATE_LIMIT:
            retry_after = max(1, int(request_times[0] + ANALYZE_RATE_WINDOW_SECONDS - now))
            return JSONResponse(
                {"error": "Too many analysis requests. Please try again shortly."},
                status_code=429,
                headers={"Retry-After": str(retry_after)}
            )

        request_times.append(now)

    return await call_next(request)

# Temporary storage for generated files
TEMP_FILES = {}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
async def root():
    """API information and available endpoints"""
    return {
        "status": "healthy",
        "api_name": "Readmission Risk Analysis API",
        "version": "2.0.0",
        "model_version": MODEL_VERSION,
        "available_diseases": list(REGISTRY.keys()),
        "endpoints": {
            "root": "/ (GET) - This page",
            "analyze": "/analyze (POST) - Main analysis endpoint with comprehensive reports",
            "upload": "/upload (POST) - Simplified upload endpoint (backward compatibility)",
            "health": "/health (GET) - Health check",
            "diseases": "/diseases (GET) - List supported diseases",
            "download_pdf": "/download/pdf/{session_id} (GET) - Download PDF report",
            "download_excel": "/download/excel/{session_id} (GET) - Download Excel report"
        },
        "features": [
            "Risk prediction with SHAP analysis",
            "Clinical recommendations",
            "Medication protocols",
            "Related disease predictions",
            "Professional PDF/Excel reports"
        ],
        "timestamp": datetime.now().isoformat()
    }

# -----------------------------
# Main Analysis Endpoint
# -----------------------------
@app.post("/analyze")
async def analyze_file(
    disease: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Analyze patient data and return comprehensive risk analysis including:
    - Risk probability and decision
    - Patient name
    - Top contributing factors with interpretations
    - Clinical recommendations
    - Download links for PDF/Excel reports
    """
    try:
        print(f"\n{'='*60}")
        print("ANALYZE REQUEST RECEIVED")
        print(f"{'='*60}")
        print(f"Disease requested: {disease}")
        print(f"File: {file.filename}")
        print(f"Available diseases: {list(REGISTRY.keys())}")
        
        # Validate disease
        if disease not in REGISTRY:
            available_diseases = list(REGISTRY.keys())
            print(f"Invalid disease: {disease}")
            print(f"Available: {available_diseases}")
            return JSONResponse(
                {"error": f"Disease must be one of: {available_diseases}"},
                status_code=400
            )
        
        print(f"Disease validated: {disease}")
        
        file_extension = Path(file.filename or "").suffix.lower()
        if file_extension not in {".csv", ".xlsx"}:
            return JSONResponse(
                {"error": "Only CSV and .xlsx files are supported."},
                status_code=400
            )

        uploaded_content = await file.read(MAX_UPLOAD_BYTES + 1)
        if len(uploaded_content) > MAX_UPLOAD_BYTES:
            return JSONResponse(
                {"error": "File exceeds the 10 MB upload limit."},
                status_code=413
            )
        await file.seek(0)

        # Read uploaded file into DataFrame
        if file_extension == ".csv":
            df = pd.read_csv(file.file)
        else:
            df = pd.read_excel(file.file)
        
        print(f"File read successfully: {len(df)} rows, {len(df.columns)} columns")
        
        if df.shape[0] == 0:
            return JSONResponse(
                {"error": "No data found in the file."},
                status_code=400
            )
        
        # Load model and predict
        model, train_cols, cat_levels = load_model_and_metadata(disease)
        threshold = REGISTRY[disease]["threshold"]
        
        X = prepare_X(df, train_cols, cat_levels)
        proba, decision = predict(model, X, threshold)
        
        print(f"Prediction: probability={proba:.3f}, decision={decision}, threshold={threshold}")
        
        # Compute feature contributions
        contrib_df = compute_contributions(model, X, train_cols)
        
        # Generate unique patient ID and session ID
        patient_id = f"{datetime.now().strftime('%Y%m%d')}-{disease.replace(' ', '')[:3]}-{uuid.uuid4().hex[:6]}"
        session_id = uuid.uuid4().hex
        
        print(f"Generated patient_id: {patient_id}")
        print(f"Generated session_id: {session_id}")
        
        # Extract patient name from DataFrame
        patient_name = "Unknown"
        name_columns = ['patient_name', 'name', 'full_name', 'patientname', 'Patient_Name']
        for col in name_columns:
            if col in df.columns or col.lower() in [c.lower() for c in df.columns]:
                matching_col = next((c for c in df.columns if c.lower() == col.lower()), None)
                if matching_col and not pd.isna(df[matching_col].iloc[0]):
                    patient_name = str(df[matching_col].iloc[0])
                    print(f"Patient name found: {patient_name}")
                    break
        
        # Generate PDF and Excel reports
        pdf_path = export_pdf(patient_id, disease, df, proba, decision, threshold, contrib_df)
        excel_path = export_excel(patient_id, disease, df, proba, decision, threshold, contrib_df)
        
        print(f"PDF generated: {pdf_path}")
        print(f"Excel generated: {excel_path}")
        
        # Store file paths with session ID
        TEMP_FILES[session_id] = {
            "pdf": pdf_path,
            "excel": excel_path,
            "timestamp": datetime.now(),
            "patient_id": patient_id
        }
        
        # Generate textual summaries
        feature_values = contrib_df.set_index("Feature")["Value"].to_dict()
        summary_text = generate_summary(contrib_df, disease, proba, decision)
        clinical_text = generate_clinical_recommendations(contrib_df, disease, feature_values)
        medication_text = generate_medication_recommendations(disease, contrib_df, feature_values)
        related_diseases_text = generate_related_disease_predictions(disease, contrib_df, feature_values)
        
        # Prepare top features with interpretations
        top_features = contrib_df.head(10).copy()
        top_features["Interpretation"] = top_features.apply(
            lambda row: interpret_feature(disease, row["Feature"], row["Contribution"], row["Value"]),
            axis=1
        )
        
        # Generate comprehensive interpretation for display
        top_factor = contrib_df.iloc[0]
        main_interpretation = interpret_feature(
            disease, 
            top_factor["Feature"], 
            top_factor["Contribution"], 
            top_factor["Value"]
        )
        
        # Clean HTML tags from interpretation
        clean_interpretation = re.sub('<[^<]+?>', '', main_interpretation)
        
        # ✅ FIX: Replace NaN values with None before converting to dict
        top_features_dict = top_features.replace({np.nan: None, np.inf: None, -np.inf: None}).to_dict(orient="records")
        
        # ✅ FIX: Ensure all numeric values are JSON-safe
        for feature in top_features_dict:
            for key, value in feature.items():
                if isinstance(value, float):
                    if np.isnan(value) or np.isinf(value):
                        feature[key] = None
                    else:
                        feature[key] = round(float(value), 6)
        
        # Prepare JSON response
        result = {
            "session_id": session_id,
            "patient_id": patient_id,
            "patient_name": patient_name,
            "disease": disease,
            "probability": round(float(proba), 3),
            "decision": "High Risk" if decision == 1 else "Low Risk",
            "threshold": threshold,
            "interpretation": clean_interpretation,
            "summary": summary_text,
            "clinical_recommendations": clinical_text,
            "medication_recommendations": medication_text,
            "related_disease_predictions": related_diseases_text,
            "top_features": top_features_dict,
            "download_links": {
                "pdf": f"/download/pdf/{session_id}",
                "excel": f"/download/excel/{session_id}"
            },
            "timestamp": datetime.now().isoformat()
        }
        
        print("\nSUCCESS - Returning response")
        print(f"Disease in response: {result['disease']}")
        print(f"{'='*60}\n")
        
        return JSONResponse(result)
    
    except Exception as e:
        import traceback
        print("\nERROR in /analyze endpoint")
        print(f"Error: {str(e)}")
        print(f"Traceback:\n{traceback.format_exc()}")
        print(f"{'='*60}\n")
        return JSONResponse(
            {
                "error": f"Analysis failed: {str(e)}",
                "details": traceback.format_exc()
            },
            status_code=500
        )

# -----------------------------
# Simplified Upload Endpoint (Backward Compatibility)
# -----------------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Simplified endpoint for backward compatibility with main.py format.
    Auto-detects disease from filename and returns basic prediction results.
    
    For full features, use /analyze endpoint instead.
    """
    try:
        # Auto-detect disease from filename
        disease = None
        filename_lower = file.filename.lower().replace(" ", "_")
        
        for disease_name, config in REGISTRY.items():
            aliases = config.get("aliases", [])
            if any(alias in filename_lower for alias in aliases):
                disease = disease_name
                break
        
        if not disease:
            disease_keywords = {
                "Type 2 Diabetes": ["diabetes", "type2", "t2d"],
                "Pneumonia": ["pneumonia", "respiratory"],
                "Chronic Kidney Disease": ["kidney", "ckd", "renal"],
                "COPD": ["copd", "obstructive"],
                "Hypertension": ["hypertension", "blood_pressure", "bp"]
            }
            
            for disease_name, keywords in disease_keywords.items():
                if any(kw in filename_lower for kw in keywords):
                    disease = disease_name
                    break
        
        if not disease:
            available = ", ".join(REGISTRY.keys())
            return JSONResponse(
                {
                    "error": f"Could not detect disease type from filename '{file.filename}'. "
                             f"Please include disease name in filename or use /analyze endpoint. "
                             f"Available: {available}"
                },
                status_code=400
            )
        
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file.file)
        elif file.filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(file.file)
        else:
            return JSONResponse(
                {"error": "Only CSV or Excel files are supported."},
                status_code=400
            )
        
        if df.empty:
            return JSONResponse(
                {"error": "The uploaded file is empty."},
                status_code=400
            )
        
        model, train_cols, cat_levels = load_model_and_metadata(disease)
        threshold = REGISTRY[disease]["threshold"]
        X = prepare_X(df, train_cols, cat_levels)
        proba, decision = predict(model, X, threshold)
        
        def risk_band(p):
            if p < 0.33:
                return "Low"
            elif p < 0.66:
                return "Medium"
            else:
                return "High"
        
        df["Predicted_Prob"] = round(float(proba), 3)
        df["Predicted_Class"] = int(decision)
        df["Risk_Band"] = risk_band(proba)
        
        risk = df["Risk_Band"].iloc[0]
        risk_counts = {
            "high_risk_count": 1 if risk == "High" else 0,
            "medium_risk_count": 1 if risk == "Medium" else 0,
            "low_risk_count": 1 if risk == "Low" else 0
        }
        
        return {
            "disease": disease,
            "records": df.to_dict(orient="records"),
            "total_records": len(df),
            **risk_counts,
            "threshold": threshold,
            "note": "Using simplified /upload endpoint. Use /analyze for comprehensive reports."
        }
    
    except Exception as e:
        import traceback
        return JSONResponse(
            {
                "error": f"Upload failed: {str(e)}",
                "details": traceback.format_exc()
            },
            status_code=500
        )

# -----------------------------
# Download Endpoints
# -----------------------------
@app.get("/download/pdf/{session_id}")
async def download_pdf(session_id: str):
    """Download generated PDF report using session ID."""
    if session_id not in TEMP_FILES:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    file_info = TEMP_FILES[session_id]
    pdf_path = file_info["pdf"]
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(pdf_path)
    )

@app.get("/download/excel/{session_id}")
async def download_excel(session_id: str):
    """Download generated Excel report using session ID."""
    if session_id not in TEMP_FILES:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    file_info = TEMP_FILES[session_id]
    excel_path = file_info["excel"]
    
    if not os.path.exists(excel_path):
        raise HTTPException(status_code=404, detail="Excel file not found")
    
    return FileResponse(
        excel_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=os.path.basename(excel_path)
    )

# -----------------------------
# Health Check
# -----------------------------
@app.get("/health")
async def health_check():
    """Check if API is running and models are loaded."""
    return {
        "status": "healthy",
        "api_version": "2.0.0",
        "model_version": MODEL_VERSION,
        "available_diseases": list(REGISTRY.keys()),
        "total_models": len(REGISTRY),
        "features": [
            "Risk prediction with ML models",
            "SHAP-based feature importance",
            "Clinical recommendations",
            "Medication protocols",
            "Related disease predictions",
            "Professional PDF/Excel reports"
        ],
        "temp_files_count": len(TEMP_FILES),
        "timestamp": datetime.now().isoformat()
    }

# -----------------------------
# Get Available Diseases
# -----------------------------
@app.get("/diseases")
async def get_diseases():
    """Get list of supported diseases and their thresholds."""
    return {
        "total": len(REGISTRY),
        "diseases": [
            {
                "name": disease,
                "threshold": info["threshold"],
                "aliases": info.get("aliases", []),
                "description": f"30-day readmission prediction for {disease}"
            }
            for disease, info in REGISTRY.items()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
