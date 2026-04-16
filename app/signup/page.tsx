"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

 const handleSignup = async () => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  const user = data.user;

  if (user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          email: email,
        },
      ]);

    if (profileError) {
      console.error(profileError);
    }
  }

  alert("Signup successful!");
};

  return (
    <div style={{ padding: 20 }}>
      <h1>Signup</h1>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleSignup}>Sign Up</button>
    </div>
  );
}