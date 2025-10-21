"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BannerPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/banner-campaign");
      const data = await response.json();
      setBanners(data.data);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus banner ini?")) return;

    try {
      const response = await fetch("/api/admin/banner-campaign", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        alert("Banner berhasil dihapus");
        fetchBanners();
      } else {
        const errorData = await response.json();
        alert(errorData.meta.message);
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Banner</h1>
        <button
          onClick={() => router.push("/dashboard/banner/add")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Tambah Banner
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300 shadow-md rounded-lg">
            <thead>
              <tr className="bg-indigo-100 text-indigo-900">
                <th className="border border-gray-300 px-4 py-2">Nama</th>
                <th className="border border-gray-300 px-4 py-2">Deskripsi</th>
                <th className="border border-gray-300 px-4 py-2">Status</th>
                <th className="border border-gray-300 px-4 py-2">Dipublikasikan</th>
                <th className="border border-gray-300 px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner: any) => (
                <tr key={banner.id} className="hover:bg-gray-100">
                  <td className="border border-gray-300 px-4 py-2">{banner.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{banner.description || "-"}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {banner.isActive ? "Aktif" : "Tidak Aktif"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(banner.publishAt).toLocaleDateString()} - {new Date(banner.publishUntil).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 space-x-2">
                    <button
                      onClick={() => router.push(`/dashboard/banner/edit?id=${banner.id}`)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}