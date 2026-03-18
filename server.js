import express from 'express';
import { config } from './configs/config.js';
import connectDataBase from './configs/dbConnect.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from "cors";
import authRoutes from './routes/auth.routes.js';
import providerRoutes from './routes/provider.routes.js';
import patientRoutes from './routes/patient.routes.js';
import { swaggerDocs } from './configs/swagger.js';

const app = express();
const port = config.port || 5000;

connectDataBase();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
];

//CORS middleware at the top
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

//Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());

//Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/providers", providerRoutes);
app.use("/api/v1/patient", patientRoutes);

//Global Error Handler (only one)
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate value entered";
  }

  if (err.name === "MongoError") {
    statusCode = 500;
    message = "Database error occurred.";
  }

  if (err.name === "ConnectionTimeout" || err.name === "ConnectionTimeOut") {
    statusCode = 408;
    message = "Connection timeout.";
  }

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})

swaggerDocs(app);