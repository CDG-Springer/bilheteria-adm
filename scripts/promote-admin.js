import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho da service account
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

  const promoteAdmin = async () => {
    const args = process.argv.slice(2);
    const email = args[0];

    if (!email) {
      console.error("Uso: node scripts/promote-admin.js <email>");
      console.error("Exemplo: node scripts/promote-admin.js admin@bilheteria.com");
      process.exit(1);
    }

    try {
      console.log(`\n🔧 Promovendo usuário a admin: ${email}\n`);

      // 1. Buscar usuário no Auth
      const userRecord = await auth.getUserByEmail(email);
      console.log(`✅ Usuário encontrado: ${userRecord.uid}`);

      // 2. Atualizar documento no Firestore
      await db.collection("users").doc(userRecord.uid).set(
        {
          email: userRecord.email,
          isAdmin: true,
          role: "admin",
          updatedAt: new Date(),
        },
        { merge: true }
      );

      console.log("✅ Usuário promovido a administrador com sucesso!");
      console.log("\n📋 Próximos passos:");
      console.log("   1. Faça logout e login novamente no painel");
      console.log("   2. Verifique se as regras do Firestore foram publicadas");
      console.log("   3. Tente criar uma categoria novamente");
      console.log("\n");

    } catch (error) {
      if (error.code === "auth/user-not-found") {
        console.error("❌ Usuário não encontrado no Firebase Auth");
        console.error("   Crie o usuário primeiro com: node scripts/create-admin.js <email> <password>");
      } else {
        console.error("❌ Erro ao promover admin:", error.message);
      }
      process.exit(1);
    }
  };

  promoteAdmin();
} catch (error) {
  console.error("❌ Erro ao ler credenciais ou inicializar:", error);
  console.error(
    "Verifique se o arquivo de service account existe em:",
    serviceAccountPath,
  );
  process.exit(1);
}
