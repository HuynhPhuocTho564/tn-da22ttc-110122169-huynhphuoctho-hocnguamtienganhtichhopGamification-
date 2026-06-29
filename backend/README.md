# Web_HoTroPhatAmEN Backend

Minimal FastAPI service for the pronunciation learning project.

Current role:

- Provide a running backend service for the project architecture.
- Expose `/health` for demo/deployment checks.
- Keep a place for future pronunciation scoring, analytics, or ASR integration.

## Run Locally

```powershell
cd D:\01_Company_Work\Projects\Web_HoTroPhatAmEN\english_pronunciation_app\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If the existing `venv` points to a missing Python executable, recreate it:

```powershell
cd D:\01_Company_Work\Projects\Web_HoTroPhatAmEN\english_pronunciation_app\backend
Remove-Item -Recurse -Force .\venv
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```text
http://127.0.0.1:8000/health
```

## Environment

Copy `.env.example` to `.env` and update values if needed.

Important variables:

- `DATABASE_URL`: optional for now. If present, `/health` checks DB connectivity.
- `CORS_ORIGINS`: comma-separated frontend origins allowed by CORS.

## Current Endpoints

- `GET /`: basic service metadata.
- `GET /health`: app status, environment, version, and database status.

## Next Backend Work

- Add scoring/analytics endpoints only after frontend submit flow is stable.
- If backend becomes responsible for pronunciation scoring, keep audio files in object storage and store only metadata/URLs in PostgreSQL.
