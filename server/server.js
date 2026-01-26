import express from 'express'
import cors from "cors";
import dotenv from "dotenv";
import connectDB from './config/db.js';
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "./config/passport.js";
import Authrouter from './routes/authroutes.js';
import ThumbnailRouter from './routes/ThumbnailRoutes.js';
import UserRouter from './routes/userroutes.js';
import PaymentRouter from './routes/paymentRoutes.js';
import ChatRouter from './routes/chatRoutes.js';
import YoutubeRouter from './routes/youtubeRoutes.js';
import WhatsappRouter from './routes/whatsappRoutes.js';
dotenv.config();

console.log('Routes loaded successfully');

await connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

// Log all requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin:[process.env.FRONTEND_URL,'http://localhost:3000'],
  credentials:true
}));

app.use(express.json({ limit: '50mb' })); // For JSON payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Session configuration (MUST be before passport)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB,
    collectionName: "sessions",
  }),
}));

// ✅ Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("server is running");
});

// TEST ROUTE DIRECTLY IN SERVER.JS
app.get("/api/thumbnail/test-direct", (req, res) => {
  console.log("✅ DIRECT ROUTE IN SERVER.JS WORKED!");
  res.json({ message: "Direct route works!" });
});

// Routes
app.use("/api/auth", Authrouter);
app.use("/api/thumbnail", ThumbnailRouter);
app.use("/api/user", UserRouter);
app.use("/api/payment", PaymentRouter);
app.use("/api/chat", ChatRouter);
app.use("/api/youtube", YoutubeRouter);
app.use("/api/whatsapp", WhatsappRouter);
// Catch-all for 404s - MUST BE LAST
app.use((req, res) => {
  console.log("❌ 404 - Route not found");
  res.status(404).json({ 
    error: "Route not found",
    method: req.method,
    path: req.path 
  });
});

if (process.env.VERCEL !== '1') {
  // This runs ONLY on your local computer
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;