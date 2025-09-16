# Web Temp Fullstack (ESP32 + Backend + Frontend + MongoDB Atlas)

## Backend
cd backend
npm install
cp .env.example .env
# แก้ MONGODB_URI ให้เป็น Atlas ของคุณ
npm run dev

## Frontend
cd frontend
npm install
npm run dev

## Firmware (ESP-IDF)
cd firmware
idf.py set-target esp32
idf.py build
idf.py -p COM3 flash monitor

ESP32 จะ POST ไปที่ SERVER_URL ทุก 15s

## API
- POST /api/data
- GET /api/latest
- GET /api/history?limit=100
