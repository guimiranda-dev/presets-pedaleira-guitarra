import "server-only";
import { Firestore } from "@google-cloud/firestore";
import { GoogleAuth, JWT } from "google-auth-library";
import { createPrivateKey } from "node:crypto";
import { HttpError } from "./errors";

let database: Firestore | undefined;

export function getRepertoireDatabase() {
  if (database) return database;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new HttpError(503, "A conexão com o banco ainda não foi configurada.");
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
  if (Boolean(clientEmail) !== Boolean(privateKey)) {
    throw new HttpError(503, "As credenciais do servidor estão incompletas.");
  }
  const key = privateKey?.replace(/\\n/g, "\n");
  if (key) {
    try { createPrivateKey(key); }
    catch { throw new HttpError(503, "A chave privada da GCP está em formato inválido."); }
  }
  const auth = new GoogleAuth({
    projectId,
    ...(clientEmail && key ? { authClient: new JWT({
      email: clientEmail, key,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    }) } : {}),
  });
  database = new Firestore({
    projectId,
    databaseId: process.env.FIRESTORE_DATABASE_ID || "(default)",
    preferRest: true,
    auth,
  });
  return database;
}
