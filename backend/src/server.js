import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import notesRoutes from "./routes/notesRoutes.js";
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(204).end();
});
app.use((req, res, next) => {
  if (req.path.startsWith("/.well-known/appspecific")) {
    return res.status(204).end();
  }
  next();
});

app.use((req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";
  const connectSrc = isDev
    ? "'self' http://localhost:5173 ws://localhost:5173 http://localhost:5001"
    : "'self'";

  const csp = [
    `default-src 'self'`,
    `connect-src ${connectSrc}`,
    `script-src 'self' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self'`
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  next();
});


if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: "http://localhost:5173",
    })
  );
}


app.use(express.json());
app.use(rateLimiter);
app.use("/api/notes", notesRoutes);


if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT}`);
  });
});
