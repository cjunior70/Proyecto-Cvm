import { supabase } from "./cliente";

export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/Home`,
    },
  });

  if (error) {
    console.error("Error login Google:", error.message);
    throw error;
  }
};