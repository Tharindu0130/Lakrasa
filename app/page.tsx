"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log("SESSION:", data, error);
    };

    test();
  }, []);

  return <div>Supabase Connected - Check Console</div>;
}