from fastapi import FastAPI, UploadFile, File, HTTPException
import random

app = FastAPI(title="Face Recognition Service")

@app.post("/api/v1/face/register")
async def register_face(employee_id: str, file: UploadFile = File(...)):
    # Mock face embedding generation
    embedding = [random.uniform(-1, 1) for _ in range(128)]
    return {
        "employee_id": employee_id,
        "embedding": embedding,
        "status": "success",
        "message": "Face registered successfully"
    }

@app.post("/api/v1/face/verify")
async def verify_face(employee_id: str, file: UploadFile = File(...)):
    # Mock face verification and liveness detection
    liveness_score = random.uniform(80, 100)
    match_score = random.uniform(85, 100)
    
    if liveness_score < 80:
        raise HTTPException(status_code=400, detail="Liveness check failed")
        
    return {
        "employee_id": employee_id,
        "match_score": match_score,
        "liveness_score": liveness_score,
        "verified": match_score >= 85
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
