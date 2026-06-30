// Standalone Express app for the Chrome extension API. On Vercel this is its OWN
// serverless function (api/extension), completely separate from the core API in
// server.ts — so firebase-admin (heavy gRPC) never enters the core function's
// bundle and can't crash the Gemini routes.
import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { registerExtensionRoutes } from "./extension.js";

dotenv.config();

export const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

registerExtensionRoutes(app, ai);
