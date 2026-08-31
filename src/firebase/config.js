import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Substitua com as SUAS chaves que estão no seu projeto antigo
const firebaseConfig = {
  apiKey:            "AIzaSyATbDsUFfSXR6c-t15Kuub0rwtsTirklqM",
  authDomain:        "sorteador-de-filmes.firebaseapp.com",
  projectId:         "sorteador-de-filmes",
  storageBucket:     "sorteador-de-filmes.firebasestorage.app",
  messagingSenderId: "844495701284",
  appId:             "1:844495701284:web:3d9a74b53d78da11119fb1",
  measurementId:     "G-YP31FSNBZY",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta a Autenticação, o Provedor do Google e o Banco de Dados
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);