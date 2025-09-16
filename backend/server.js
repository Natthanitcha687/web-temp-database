import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Schema + Model
const readingSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  deviceId: String,
  ts: { type: Date, default: Date.now }
});
const Reading = mongoose.model('Reading', readingSchema);

// 🌐 Default route (เช็คว่า Backend รันอยู่)
app.get('/', (req, res) => {
  res.send('🌐 Web Temp Backend is running!');
});

// 📌 ESP32 ส่งข้อมูลมาเก็บ
app.post('/api/data', async (req, res) => {
  try {
    const { temperature, humidity, deviceId } = req.body;
    if (temperature === undefined || humidity === undefined) {
      return res.status(400).json({ error: 'temperature & humidity required' });
    }
    const reading = new Reading({ temperature, humidity, deviceId });
    await reading.save();
    res.json({ ok: true, reading });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 ดึงค่าล่าสุด
app.get('/api/latest', async (req, res) => {
  try {
    const last = await Reading.findOne().sort({ ts: -1 });
    res.json(last || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 ดึง history ย้อนหลัง
app.get('/api/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const data = await Reading.find().sort({ ts: -1 }).limit(limit);
    res.json(data.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
