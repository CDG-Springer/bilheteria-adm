import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho da service account: variável GOOGLE_APPLICATION_CREDENTIALS ou arquivo na raiz do projeto
const defaultFileName = "teste-9ed53-firebase-adminsdk-fbsvc-269158e9d6.json";
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  join(__dirname, "..", defaultFileName);

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  initializeApp({
    credential: cert(serviceAccount),
  });

  const auth = getAuth();
  const db = getFirestore();

  const createAdmin = async () => {
    const args = process.argv.slice(2);
    const [email, password] = args;

    if (!email || !password) {
      console.error("Uso: node scripts/create-admin.js <email> <password>");
      console.error("Exemplo: node scripts/create-admin.js admin@bilheteria.com MinhaSenha123");
      process.exit(1);
    }

    // Firebase exige email com domínio válido (ex.: algo@dominio.com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Erro: o email deve ter formato válido, com domínio (ex.: .com, .br)");
      console.error("Exemplo correto: admin@bilheteria.com (não use apenas admin@bilheteria)");
      process.exit(1);
    }

    try {
      console.log(`Criando admin para: ${email}...`);

      // 1. Create user in Auth
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: true,
      });

      console.log("Usuário criado no Firebase Auth:", userRecord.uid);

      // 2. Create user doc in Firestore
      await db.collection("users").doc(userRecord.uid).set({
        email: userRecord.email,
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "admin",
      });

      console.log(
        "Documento de administrador criado no Firestore com sucesso!",
      );
      console.log("ID do usuário:", userRecord.uid);
      console.log("");
      console.log(">>> Use este EMAIL e esta SENHA na tela de login do painel. <<<");
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        console.log("Usuário já existe. Tentando promover a admin...");
        try {
          const userRecord = await auth.getUserByEmail(email);
          await db.collection("users").doc(userRecord.uid).set(
            {
              email: userRecord.email,
              isAdmin: true,
              updatedAt: new Date(),
              role: "admin",
            },
            { merge: true },
          );
          console.log("Usuário existente promovido a admin com sucesso!");
          console.log("");
          console.log(">>> Use este EMAIL e esta SENHA na tela de login do painel. <<<");
        } catch (innerError) {
          console.error("Erro ao promover usuário:", innerError);
        }
      } else if (error.code === "auth/invalid-email") {
        console.error("Erro: email em formato inválido. Use um email com domínio, ex.: admin@bilheteria.com");
      } else {
        console.error("Erro ao criar admin:", error);
      }
    }
  };

  createAdmin();
} catch (error) {
  console.error("Erro ao ler credenciais ou inicializar:", error);
  console.error(
    "Verifique se o arquivo de service account existe em:",
    serviceAccountPath,
  );
}
