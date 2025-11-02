### 1. Clone Repository
```bash
git clone https://github.com/joshsoco/ReduceReadmission.git
cd ReduceReadmission
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Create `backend/.env`:**
```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/hospital-readmissions

JWT_SECRET=your_super_secret_jwt_key_here_256_bit_minimum
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:5173

# Python ML API
PYTHON_ML_API=http://localhost:8000

# Redis (Optional)
UPSTASH_REDIS_REST_URL=https://your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

**Create Admin Account:**
```bash
node create-admin.js
```
Default credentials: `admin1@gmail.com` / `admin123!`

**Start Server:**
```bash
npm run dev
```
Runs on `http://localhost:5000`

```bash
### 3. Python ML Service (FastAPI)

cd backend/src/python

# Create venv (Optional)
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt


uvicorn api:app --reload --port 8000

```
Runs on `http://localhost:8000`

### 4. Frontend Setup

```bash
cd frontend
npm install
```

**Create `frontend/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_PYTHON_ML_API=http://localhost:8000
```

**Start Development Server:**
```bash
npm run dev

Runs on `http://localhost:5173`

### 5. Access Application

Navigate to `http://localhost:5173` and login with:
- **Email:** admin1@gmail.com
- **Password:** admin123!
```