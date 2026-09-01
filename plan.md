# 20. Gift Journey — Shopee Package Tracking

Tambahkan satu chapter khusus di dalam diary dengan konsep:

**"The Journey of Your Birthday Gift 🎁"**

Halaman ini bukan sekadar menampilkan nomor resi, tetapi dibuat seperti **perjalanan sebuah hadiah menuju pemiliknya**.

## Visual Concept

Buat sebuah ilustrasi perjalanan paket dari:

**Shopee Seller → Sorting Center → Delivery → Your Home → 🎁**

Gunakan visual seperti:

* miniature map
* dotted route
* package icon
* delivery truck/motorcycle
* location pins
* glowing route
* animated particles

Gunakan style yang tetap menyatu dengan magical diary.

Jangan membuatnya terlihat seperti dashboard logistics.

---

## Tracking Timeline

Tampilkan timeline perjalanan paket secara visual.

Contoh:

**📦 Order Placed**

> Your gift has started its journey.

↓

**🏪 Seller Preparing**

> The birthday surprise is being prepared...

↓

**🚚 Package Picked Up**

> Your gift has officially started traveling.

↓

**📍 Sorting Center**

> Your gift is getting closer...

↓

**🛵 Out for Delivery**

> It's almost there!

↓

**🎁 Delivered**

> The surprise has arrived!

Setiap status memiliki:

* icon
* timestamp
* location jika tersedia
* description
* subtle animation

Status yang sudah dilewati terlihat completed.

Status saat ini memiliki animated glow/pulse.

Status yang belum tercapai terlihat muted.

---

# 21. Interactive Package

Buat sebuah package/card 3D kecil di halaman.

Package tersebut dapat:

* bergerak mengikuti route
* sedikit rotate
* memiliki shadow
* memiliki subtle bounce
* meninggalkan glowing trail

Jika status berubah, animasikan package menuju checkpoint berikutnya.

Contoh:

Seller → Sorting Center

Package bergerak mengikuti garis route.

Sorting Center → Delivery

Package berpindah ke checkpoint berikutnya.

Out for Delivery:

Package berubah menjadi icon delivery motorcycle/truck.

Delivered:

Package berubah menjadi:

🎁

dan memberikan small celebration animation.

---

# 22. Tracking Information

Tampilkan informasi penting:

**Order**
Birthday Gift

**Courier**
[JNE / J&T / SiCepat / etc.]

**Tracking Number**
[XXXXXXXX]

**Current Status**
[Current Status]

**Last Update**
[Date & Time]

**Current Location**
[Location]

Jangan menampilkan informasi sensitif yang tidak diperlukan.

Buat nomor resi memiliki tombol:

**Copy Tracking Number**

---

# 23. Shopee Integration

Buat architecture agar tracking data dapat diambil secara dynamic.

Jangan melakukan scraping Shopee langsung dari frontend/browser.

Gunakan abstraction seperti:

`TrackingService`

Contoh data:

```json
{
  "order": "Birthday Gift",
  "courier": "J&T",
  "trackingNumber": "XXXXXXXX",
  "status": "OUT_FOR_DELIVERY",
  "location": "Jakarta",
  "lastUpdate": "2026-09-01 10:30",
  "estimatedDelivery": "2026-09-01",
  "timeline": []
}
```

Buat API endpoint:

`GET /api/tracking`

atau:

`GET /api/tracking/:trackingNumber`

Frontend hanya mengambil data dari API tersebut.

Jika API tracking belum tersedia, buat **mock tracking service** sehingga website tetap dapat didemonstrasikan.

Buat kode dengan architecture yang memungkinkan API tracking sebenarnya ditambahkan kemudian tanpa mengubah UI.

---

# 24. Tracking Animation

Ketika halaman tracking pertama kali dibuka:

1. Diary page mulai terbuka.
2. Muncul cahaya kecil di tengah buku.
3. Sebuah miniature package muncul dari tengah buku.
4. Package bergerak menuju route.
5. Route menggambar dirinya sendiri secara animated.
6. Checkpoint muncul satu per satu.
7. Current status mendapatkan glowing effect.

Contoh:

`📦 ─────── 📍 ─────── 🏪 ─────── 🛵 ─────── 🏠`

Gunakan animation yang smooth dan premium.

---

# 25. Estimated Delivery

Jika estimated delivery tersedia, tampilkan:

**"Your surprise should arrive around..."**

Kemudian tampilkan countdown:

**02 Days 14 Hours 32 Minutes**

Jika paket sudah delivered:

**"Your surprise has arrived! 🎁"**

Jangan gunakan countdown jika estimated delivery tidak tersedia.

---

# 26. Secret Gift Mode

Tambahkan optional feature:

**"Secret Mode 🤫"**

Dalam mode ini jangan langsung tampilkan detail hadiah.

Tampilkan:

**"Something special is on its way..."**

dan:

**"Want to see its journey?"**

Button:

**TRACK THE SURPRISE ✨**

Setelah diklik, tracking journey terbuka.

Jangan tampilkan nama produk Shopee jika pengguna memilih secret mode.

---

# 27. Delivered Celebration

Ketika status berubah menjadi:

`DELIVERED`

buat special animation:

* package membuka
* soft light keluar dari package
* tulip muncul
* small sparkles
* subtle confetti
* birthday cake miniature muncul
* tulisan:

**"The surprise has arrived! 🎁❤️"**

Jangan menggunakan confetti berlebihan.

Animasi harus tetap elegant.

---

# 28. Privacy & Security

Jangan menyimpan:

* password Shopee
* cookie Shopee
* authentication token Shopee
* data pembayaran
* informasi pribadi yang tidak diperlukan

Tracking number dapat disimpan hanya jika memang diperlukan.

Jika menggunakan API eksternal, API key harus berada di backend/environment variable.

**Jangan pernah expose API secret di frontend.**

---

# 29. Diary Integration

Tracking page harus terasa seperti bagian dari cerita diary.

Urutan experience:

**Cover**
→ **Birthday Story**
→ **Memories**
→ **Tulip Garden**
→ **Gift Journey**
→ **Birthday Cake**
→ **Birthday Message**
→ **Final Celebration**

Pada Gift Journey page, gunakan headline:

**"While you're reading this..."**

Kemudian:

**"There's a little surprise making its way to you."**

Lalu tampilkan package journey.

Tujuannya agar tracking bukan terasa seperti fitur tambahan, tetapi menjadi bagian dari **cerita ulang tahun**.

---

# 30. Fallback Mode

Jika tracking API gagal:

Jangan tampilkan error teknis seperti:

`500 Internal Server Error`

Tampilkan UI yang tetap sesuai dengan diary:

**"The little gift is still on its journey..."**

**"We'll update its story when we hear from it again. ✨"**

Tambahkan:

**REFRESH JOURNEY**

button.

Jika data tracking belum tersedia, gunakan mock data untuk demo.
