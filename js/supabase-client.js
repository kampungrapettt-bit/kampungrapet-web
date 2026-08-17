// js/supabase-client.js

// URL dan API Key proyek Supabase Anda
const SUPABASE_URL = 'https://trsszzkgotrbrjkmarxf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XutFVYsu5HnM-fm8Z9JCwg_7stFT96-';

// Inisialisasi Klien Supabase (Pastikan script CDN supabase dipanggil sebelum file ini di HTML)
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: window.sessionStorage
    }
});

// Fungsi utilitas untuk memunculkan notifikasi (toast/alert sederhana)
function showNotification(message, isError = false) {
    alert((isError ? "Error: " : "Sukses: ") + message);
}

// Fungsi kompresi gambar dasar (menghindari ukuran file yang terlalu besar)
async function compressImage(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Kompresi ke format JPEG (0.8 quality)
                canvas.toBlob((blob) => {
                    if(!blob) return reject(new Error("Gagal mengompres gambar"));
                    
                    // Buat file baru dari blob
                    const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, 'image/jpeg', 0.8);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Fungsi untuk upload gambar ke Supabase Storage (Bucket: 'media')
async function uploadImage(file, pathPrefix = 'umum') {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${pathPrefix}_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }
        
        // Dapatkan URL Publik
        const { data: publicUrlData } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);
            
        return publicUrlData.publicUrl;
    } catch (error) {
        console.error("Gagal unggah foto:", error);
        throw error;
    }
}

// Sinkronisasi Footer Global
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data, error } = await window.supabase.from('kontak_dusun').select('*').eq('id', 1).maybeSingle();
        if (data && !error) {
            const footerEmail = document.querySelector('footer a[href^="mailto:"]');
            const footerWA = document.querySelector('footer a[href^="https://wa.me"]');
            const footerMaps = document.querySelector('footer a[href*="maps"]');

            if (footerEmail) {
                footerEmail.href = `mailto:${data.email}`;
                footerEmail.innerText = data.email;
            }
            if (footerWA) {
                const waNum = data.nomor_wa.replace(/\D/g, '');
                footerWA.href = `https://wa.me/${waNum}`;
                footerWA.innerText = data.nomor_wa;
            }
            if (footerMaps) {
                footerMaps.href = data.link_maps;
            }
        }
    } catch (e) {
        console.error("Gagal sinkronisasi footer:", e);
    }
});
