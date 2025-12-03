'use client';

import { FormEvent, useState } from "react";

const GENRES = [
  "Action",
  "Drama",
  "Comedy",
  "Thriller",
  "Romance",
  "Horror",
  "Sci-Fi",
  "Fantasy",
  "Documentary",
  "Kids",
  "Anime",
  "Reality",
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        preferredGenres: selectedGenres,
        birthYear: birthYear ? Number(birthYear) : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? "Registration failed");
      return;
    }
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("deviceId", data.deviceId);
    setSuccess("Account created. You are logged in.");
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Create your Wanzami account
      </h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Birth Year (optional)</span>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </label>
        <div style={{ display: "grid", gap: 8 }}>
          <span>Pick a few favorite genres (optional)</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GENRES.map((g) => {
              const selected = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    setSelectedGenres((prev) =>
                      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
                    )
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: 20,
                    border: selected ? "2px solid #111" : "1px solid #ccc",
                    background: selected ? "#111" : "#f5f5f5",
                    color: selected ? "white" : "#111",
                    cursor: "pointer",
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="submit"
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            border: "none",
            background: "#111",
            color: "white",
            fontWeight: 600,
          }}
        >
          Register
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      {success && <p style={{ color: "green", marginTop: 12 }}>{success}</p>}
    </div>
  );
}
