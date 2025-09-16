import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" })); // frontend เรียกได้แน่นอน
app.use(express.json());
app.use(morgan('dev'));

// ✅ Debug Env
console.log("🔍 MONGODB_URI =", process.env.MONGODB_URI ? "Loaded ✅" : "❌ Undefined");

// ✅ MongoDB Connect
if (!process.env.MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI environment variable");
  process.exit(1); // หยุดถ้าไม่เจอ env
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ✅ Schema
const readingSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  deviceId: String,
  ts: { type: Date, default: Date.now }
});
const Reading = mongoose.model('Reading', readingSchema);

// ✅ Root route
app.get('/', (req, res) => {
  res.send("🌡️ Web Temp Backend is running!");
});

// ✅ Save data from ESP32
app.post('/api/data', async (req, res) => {
  try {
    const { temperature, humidity, deviceId } = req.body;
    const reading = new Reading({ temperature, humidity, deviceId });
    await reading.save();

    // broadcast ผ่าน WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(reading));
      }
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get latest
app.get('/api/latest', async (req, res) => {
  try {
    const last = await Reading.findOne().sort({ ts: -1 });
    res.json(last || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get history
app.get('/api/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const data = await Reading.find().sort({ ts: -1 }).limit(limit);
    res.json(data.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start HTTP server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`);
});

// ✅ Attach WebSocket
const wss = new WebSocketServer({ server });
wss.on("connection", () => {
  console.log("🔌 New WebSocket client connected");
});
