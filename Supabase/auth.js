import { supabase } from "./cliente";
// 🔐 Login con Google
export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });

  if (error) {
    console.error("Error login Google:", error.message);
    throw error;
  }
};
