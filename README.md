# Clinical Risk Prediction Tool

This project is a generic clinical risk prediction platform. It accepts patient data, runs a risk analysis through the ML service, and returns a prediction summary with key contributing factors and recommendations.

## Quick start

### 1. Install dependencies

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd frontend
npm install
```

Python ML service:
```bash
cd backend/src/python
python -m venv venv
```

Windows:
```bash
venv\Scripts\activate
```

macOS/Linux:
```bash
source venv/bin/activate
```

Then install Python requirements:
```bash
pip install -r requirements.txt
```

### 2. Configure environment variables

Create a backend `.env` file using the example values in `backend/.env.example` and replace placeholders with your own values.

Typical values:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/clinical-risk-db
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
PYTHON_ML_API=http://localhost:8000
```

### 3. Start services

Run the ML service:
```bash
cd backend/src/python
uvicorn api:app --host 0.0.0.0 --port 8000
```

Run the backend:
```bash
cd backend
npm run dev
```

Run the frontend:
```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

### 4. Open the app

Visit:
- Frontend: http://localhost:5173
- Public tool: http://localhost:5173/
- File upload: http://localhost:5173/upload

## How to use the tool

1. Open the home page.
2. Upload a CSV or Excel file, or use the sample file included in the project.
3. Review the prediction result and key drivers.
4. Download the generated PDF or Excel report if needed.

## Example file

Use the sample dataset at:
- `frontend/public/sample-patient-data.csv`

This gives you a working file even if you do not have your own patient data yet.

## Public deployment (Oracle Cloud Always Free)

The production Compose stack uses one public HTTPS entry point. Caddy serves the built frontend and routes `/api` to Node and `/ml` to FastAPI. MongoDB, Node, and FastAPI are not published directly to the internet. The cloud account, DNS, and VM must be created separately.

Oracle's Always Free allowance is subject to region and compute capacity. Use only Always Free resources and do not upgrade the account or provision paid resources if the requirement is a $0 bill. Oracle currently lists 1,500 Ampere A1 OCPU-hours and 9,000 GB-hours per month. A hostname is needed for automatic HTTPS; a free dynamic DNS hostname is an option if you do not own a domain.

1. Create an Always Free Ampere A1 VM and install Docker Engine with the Compose plugin.
2. Point a hostname's DNS A record to the VM's public IP. In the VM firewall/security list, allow inbound TCP 80 and 443, and restrict SSH (port 22) to your own IP. Do not open ports 27017, 5000, or 8000.
3. Clone this repository on the VM and create the deployment environment file:

```bash
cp .env.example .env
openssl rand -hex 32
```

Use separate generated hex values for `MONGO_ROOT_PASSWORD` and `JWT_SECRET`. Set `SITE_DOMAIN` to the hostname without `https://`. Hex values avoid special-character escaping in the Mongo connection URI. Keep `.env` private.

4. Validate and start the stack:

```bash
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

After DNS has propagated and Caddy has obtained a certificate, open `https://<your-hostname>`. The health endpoint at `https://<your-hostname>/ml/health` reports the active model version. Update `ML_MODEL_VERSION` in `.env` when replacing model artifacts, then rebuild/restart the ML service.

5. Update the deployment after code changes:

```bash
git pull
docker compose up --build -d
```

MongoDB data and Caddy certificates use named Docker volumes. Generated reports are temporary: their lookup is held in ML process memory, so download each report promptly; restarting the ML service invalidates existing report links.

The ML analysis endpoints are limited to 30 requests per client IP per minute in process memory. This is a basic single-instance abuse guard, not a distributed limiter; replace it with shared rate-limit storage before scaling to multiple ML instances.

This free VM is self-managed and has no production uptime guarantee. Free-tier availability and limits can change. Do not upload identifiable patient information unless the hosting and data-handling setup has been separately approved for that use.

## Notes

- The shared prediction tool does not require a login or account setup.
- Admin endpoints are separate legacy management features and are not needed to use the public tool.
- The ML service should be kept running alongside the backend in deployment.
- Set `ML_MODEL_VERSION` in the deployment environment (or Compose `.env`) to label the active model bundle. Bump it whenever you replace or improve the model artifacts; the upload page reads and displays this value from the ML health endpoint.
