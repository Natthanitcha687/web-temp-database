import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

const readingSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  deviceId: String,
  ts: { type: Date, default: Date.now }
});
const Reading = mongoose.model('Reading', readingSchema);

app.post('/api/data', async (req, res) => {
  try {
    const { temperature, humidity, deviceId } = req.body;
    const reading = new Reading({ temperature, humidity, deviceId });
    await reading.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/latest', async (req, res) => {
  const last = await Reading.findOne().sort({ ts: -1 });
  res.json(last || {});
});

app.get('/api/history', async (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  const data = await Reading.find().sort({ ts: -1 }).limit(limit);
  res.json(data.reverse());
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
