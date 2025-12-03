"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    tenantName: "",
    tenantAddress: "",
    tenantPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Kata sandi tidak cocok.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {

        // check for error message from response
        const data = await response.json();
        if (data && data.error) {
          throw new Error(data.error);
        }
        throw new Error("Gagal mendaftar. Silakan coba lagi.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-white flex items-center justify-center py-20 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h2 className="text-[40px] font-semibold text-black tracking-tight leading-[1.1] mb-3">
            Mulai gratis
          </h2>
          <p className="text-[17px] text-black/70">
            Buat akun dan rasakan kemudahan mengelola bisnis Anda
          </p>
        </div>

        {success ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-[21px] font-semibold mb-2">Pendaftaran berhasil!</h3>
            <p className="text-[15px] text-black/70 mb-6">Silakan masuk menggunakan Aplikasi Puni POS</p>
            <Link href="/" className="text-[15px] text-[#06c] hover:underline">
              Kembali ke beranda
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-[14px] font-medium mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#06c] focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-[14px] font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#06c] focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[14px] font-medium mb-2">
                Kata Sandi
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#06c] focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-[14px] font-medium mb-2">
                Konfirmasi Kata Sandi
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#06c] focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="pt-4">
              <p className="text-[14px] font-medium mb-4 text-black/80">Informasi Toko</p>
            </div>

            <div>
              <label htmlFor="tenantName" className="block text-[14px] font-medium mb-2">
                Nama Toko
              </label>
              <input
                type="text"
                id="tenantName"
                name="tenantName"
                value={formData.tenantName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#06c] focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="tenantAddress" className="block text-[14px] font-medium mb-2">
                Alamat Toko
              </label>
              <input
                type="text"
                id="tenantAddress"
                name="tenantAddress"
                value={formData.tenantAddress}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#06c] focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="tenantPhone" className="block text-[14px] font-medium mb-2">
                Nomor Telepon Toko
              </label>
              <input
                type="text"
                id="tenantPhone"
                name="tenantPhone"
                value={formData.tenantPhone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#06c] focus:border-transparent transition-all"
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-[15px] text-red-600">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[17px] font-medium rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              disabled={loading}
            >
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </button>
            <p className="text-center text-[14px] text-black/60 mt-6">
              Sudah punya akun?{" "}
              <Link href="/" className="text-[#06c] hover:underline">
                Kembali ke beranda
              </Link>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}