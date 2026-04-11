const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const inventoryRoutes = require("./routes/inventoryRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const systemSettingsRoutes = require("./routes/systemSettingsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/inventorydb";

app.use(cors());
app.use(express.json());

const getDisplayMongoUri = () => {
  if (!MONGO_URI) return "Not available";

  if (MONGO_URI.includes("@")) {
    return MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
  }

  return MONGO_URI;
};

const getDatabaseStatus = () => {
  const readyState = mongoose.connection.readyState;

  return {
    connected: readyState === 1,
    readyState,
    stateLabel:
      readyState === 1
        ? "connected"
        : readyState === 2
        ? "connecting"
        : readyState === 3
        ? "disconnecting"
        : "disconnected",
    displayUri: getDisplayMongoUri()
  };
};

const requireDatabaseConnection = (req, res, next) => {
  const databaseStatus = getDatabaseStatus();

  if (!databaseStatus.connected) {
    return res.status(503).json({
      message: "MongoDB is not connected. Start MongoDB or update MONGO_URI, then try again.",
      database: databaseStatus
    });
  }

  next();
};

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 3000
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB runtime error:", error.message);
});

app.get("/api/health", (req, res) => {
  const database = getDatabaseStatus();

  res.json({
    status: "OK",
    message: "Server is running",
    database
  });
});

app.use("/api/inventory", requireDatabaseConnection, inventoryRoutes);
app.use("/api/users", requireDatabaseConnection, userRoutes);
app.use("/api/reports", requireDatabaseConnection, reportRoutes);
app.use("/api/system-settings", requireDatabaseConnection, systemSettingsRoutes);

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: err.message || "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});