"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FormData {
  name: string;
  description: string;
  image: File | null;
  isActive: boolean;
  publishAt: string;
  publishUntil: string;
}

export default function EditBannerPage() {
  const router = useRouter();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditBannerContent router={router} />
    </Suspense>
  );
}

function EditBannerContent({ router }: { router: ReturnType<typeof useRouter> }) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    image: null,
    isActive: false,
    publishAt: "",
    publishUntil: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const bannerId = searchParams.get("id");

  useEffect(() => {
    if (bannerId) {
      fetch(`/api/admin/banner-campaign/${bannerId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch banner data");
          }
          return res.json();
        })
        .then((data) => {
          setFormData({
            name: data.data.name,
            description: data.data.description || "",
            image: null, // Image is not pre-filled
            isActive: data.data.isActive,
            publishAt: data.data.publishAt,
            publishUntil: data.data.publishUntil,
          });
        })
        .catch((err) => {
          console.error("Error fetching banner data:", err);
          setError("Gagal memuat data banner");
        });
    }
  }, [bannerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData();
    form.append("name", formData.name);
    form.append("description", formData.description);
    if (formData.image) form.append("image", formData.image);
    form.append("isActive", String(formData.isActive));
    form.append("publishAt", formData.publishAt);
    form.append("publishUntil", formData.publishUntil);

    try {
      const response = await fetch(`/api/admin/banner-campaign/${bannerId}`, {
        method: "PUT",
        body: form,
      });

      if (response.ok) {
        alert("Banner berhasil diperbarui");
        router.push("/dashboard/banner");
      } else {
        const errorData = await response.json();
        setError(errorData.meta.message);
      }
    } catch (err) {
      console.error("Error updating banner:", err);
      setError("Terjadi kesalahan saat memperbarui banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Banner</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nama Banner
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Deskripsi
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Gambar Banner
          </label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="publishAt" className="block text-sm font-medium text-gray-700">
            Tanggal Publikasi
          </label>
          <input
            type="datetime-local"
            id="publishAt"
            name="publishAt"
            value={formData.publishAt}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="publishUntil" className="block text-sm font-medium text-gray-700">
            Tanggal Akhir Publikasi
          </label>
          <input
            type="datetime-local"
            id="publishUntil"
            name="publishUntil"
            value={formData.publishUntil}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
            }
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Aktifkan Banner
          </label>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? "Memperbarui..." : "Perbarui Banner"}
          </button>
        </div>
      </form>
    </div>
  );
}