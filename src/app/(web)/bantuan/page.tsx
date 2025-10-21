// app/(web)/bantuan/page.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Hardcoded JSON data
const helpData = [
	{
		categoryId: 1,
		categoryName: 'Umum',
		items: [
			{
				title: 'Dimana Dapat Mengunduh Aplikasi?',
				description: '<p>Anda dapat mengunduh aplikasi kami melalui Google Play Store untuk pengguna Android dan App Store untuk pengguna iOS.</p>',
			},
			{
				title: 'Bagaimana Cara Daftar?',
				description: '<p>Untuk mendaftar, klik tombol <strong>Daftar</strong> di pojok kanan atas, lalu isi formulir pendaftaran dengan data yang valid.</p>',
			},
			{
				title: 'Fitur Apa Saja yang Ada?',
				description: '<p>Aplikasi kami memiliki berbagai fitur seperti manajemen inventaris, laporan penjualan, dan integrasi pembayaran digital.</p>',
			},
			{
				title: 'Jika Terjadi Error, Bagaimana Cara Melaporkannya?',
				description: '<p>Jika Anda mengalami error, silakan hubungi tim dukungan kami melalui email di <strong>mapunia.com@gmail.com</strong> atau gunakan fitur <strong>Hubungi Kami</strong> di aplikasi.</p>',
			},
		],
	},
];

export default function Bantuan() {
	const [openCategory, setOpenCategory] = useState<number | null>(null);
	const [openItem, setOpenItem] = useState<number | null>(null);
	const searchParams = useSearchParams();
	const isMinimal = searchParams.get('minimal') === 'true';

	const toggleCategory = (categoryId: number) => {
		setOpenCategory(openCategory === categoryId ? null : categoryId);
		setOpenItem(null); // Close any open item when switching categories
	};

	const toggleItem = (itemIndex: number) => {
		setOpenItem(openItem === itemIndex ? null : itemIndex);
	};

	return (
		<section className='py-20 bg-gradient-to-br from-indigo-50 to-white'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='text-center mb-16'>
					<h2 className='text-4xl md:text-5xl font-extrabold text-gray-900 mb-6'>
						Pusat Bantuan
					</h2>
					<p className='text-lg md:text-xl text-gray-600'>
						Temukan jawaban atas pertanyaan umum di sini
					</p>
				</div>
				<div className='space-y-8'>
					{helpData.map((category) => (
						<div
							key={category.categoryId}
							className='bg-white rounded-lg shadow-md p-6'
						>
							<button
								onClick={() => toggleCategory(category.categoryId)}
								className='w-full text-left text-2xl font-semibold text-gray-900 hover:text-indigo-600 focus:outline-none flex justify-between items-center'
							>
								{category.categoryName}
								<span className='text-indigo-500'>
									{openCategory === category.categoryId ? '−' : '+'}
								</span>
							</button>
							{openCategory === category.categoryId && (
								<div className='mt-4 space-y-4 border-t border-gray-200 pt-4'>
									{category.items.map((item, index) => (
										<div
											key={index}
											className='bg-gray-50 rounded-lg p-4'
										>
											<button
												onClick={() => toggleItem(index)}
												className='w-full text-left text-lg font-medium text-gray-700 hover:text-indigo-500 focus:outline-none flex justify-between items-center'
											>
												{item.title}
												<span className='text-indigo-400'>
													{openItem === index ? '−' : '+'}
												</span>
											</button>
											{openItem === index && (
												<div
													className='mt-2 text-gray-600'
													dangerouslySetInnerHTML={{
														__html: item.description,
													}}
												/>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}