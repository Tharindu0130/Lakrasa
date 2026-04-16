"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useStore } from "@/lib/store";

export default function AuthListener() {
  const { setSession } = useStore();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return null; // This component doesn't render anything
}
