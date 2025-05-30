// --- Konfigurasi ---
const targetDate = new Date(2025, 5, 2, 10, 0, 0).getTime(); // 2 Juni 2025, 10:00:00
const studentDataFilePath = 'datasiswa.txt'; // Nama file data siswa

// --- Elemen DOM ---
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const countdownSection = document.getElementById('countdown-section');
const announcementSection = document.getElementById('announcement-section');
const studentsListEl = document.getElementById('students-list');
const searchInputEl = document.getElementById('search-input');

let allStudentsData = []; // Akan menyimpan data siswa yang sudah diparsing

// --- Fungsi untuk Memuat dan Mem-parsing Data Siswa dari .txt ---
async function loadAndParseStudentData(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            // Jika file tidak ditemukan atau ada error server
            throw new Error(`Gagal memuat file data: ${response.status} ${response.statusText}. Pastikan file '${filePath}' ada di tempat yang benar.`);
        }
        const textData = await response.text();
        const lines = textData.trim().split('\n');
        const students = [];

        if (lines.length <= 1 && lines[0].trim() === "") { // File kosong
             console.warn(`File data siswa '${filePath}' kosong.`);
             studentsListEl.innerHTML = `<tr><td colspan="3" style="text-align:center;">File data siswa (${filePath}) kosong atau tidak valid.</td></tr>`;
             return [];
        }
        if (lines.length <=1 ) { // Hanya header atau file tidak valid
            console.warn(`File data siswa '${filePath}' hanya berisi header atau formatnya tidak sesuai.`);
            studentsListEl.innerHTML = `<tr><td colspan="3" style="text-align:center;">File data siswa (${filePath}) kosong atau tidak valid.</td></tr>`;
            return [];
        }


        // Lewati baris header (lines[0])
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) { // Pastikan baris tidak kosong
                const parts = line.split(',');
                if (parts.length === 2) {
                    students.push({
                        no: i, // Nomor urut berdasarkan baris (setelah header)
                        name: parts[0].trim(),
                        status: parts[1].trim().toUpperCase() // Standarisasi status ke huruf besar
                    });
                } else {
                    console.warn(`Baris data tidak valid di '${filePath}' (baris ${i + 1}): ${line}. Format seharusnya 'Nama,Status'.`);
                }
            }
        }
        return students;
    } catch (error) {
        console.error("Error saat memuat atau mem-parsing data siswa:", error);
        studentsListEl.innerHTML = `<tr><td colspan="3" style="color:red; text-align:center;">Terjadi kesalahan saat memuat data siswa: ${error.message}</td></tr>`;
        return []; // Kembalikan array kosong jika terjadi error
    }
}

// --- Fungsi Countdown ---
function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        clearInterval(countdownInterval);
        showAnnouncement(); // Panggil showAnnouncement yang sekarang async
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
}

// --- Fungsi untuk Menampilkan Pengumuman ---
async function showAnnouncement() {
    countdownSection.style.display = 'none';
    announcementSection.style.display = 'block';

    // Muat data siswa jika belum dimuat
    if (allStudentsData.length === 0) {
        allStudentsData = await loadAndParseStudentData(studentDataFilePath);
    }
    renderStudentsTable(allStudentsData);
}

// --- Fungsi untuk Merender Tabel Siswa ---
function renderStudentsTable(students) {
    studentsListEl.innerHTML = ''; // Kosongkan tabel sebelum diisi

    if (!students || students.length === 0) {
        // Pesan error spesifik sudah ditangani di loadAndParseStudentData
        // atau tampilkan pesan jika hasil filter kosong
        if (searchInputEl.value !== "" && students.length === 0) {
             studentsListEl.innerHTML = `<tr><td colspan="3" style="text-align:center;">Tidak ada siswa yang cocok dengan pencarian '${searchInputEl.value}'.</td></tr>`;
        } else if (students.length === 0 && allStudentsData.length > 0) {
            // Ini tidak seharusnya terjadi jika allStudentsData ada isinya dan tidak difilter,
            // tapi sebagai fallback jika students adalah array kosong karena alasan lain.
             studentsListEl.innerHTML = `<tr><td colspan="3" style="text-align:center;">Tidak ada data siswa untuk ditampilkan.</td></tr>`;
        }
        // Jika allStudentsData memang kosong dari awal karena file error/kosong, pesan sudah ada.
        return;
    }

    students.forEach(student => {
        const row = studentsListEl.insertRow();
        row.insertCell().textContent = student.no;
        row.insertCell().textContent = student.name;
        const statusCell = row.insertCell();
        statusCell.textContent = student.status; // Status sudah di uppercase
        if (student.status === "LULUS") {
            statusCell.style.color = "green";
            statusCell.style.fontWeight = "bold";
        } else { // Asumsi selain LULUS adalah TIDAK LULUS atau status lain yang diberi warna merah
            statusCell.style.color = "red";
            statusCell.style.fontWeight = "bold";
        }
    });
}

// --- Fungsi Pencarian Siswa ---
function filterStudents() {
    const searchTerm = searchInputEl.value.toLowerCase();
    if (!allStudentsData) { // Jika allStudentsData belum terdefinisi (seharusnya tidak terjadi)
        return;
    }
    const filteredStudents = allStudentsData.filter(student =>
        student.name.toLowerCase().includes(searchTerm)
    );
    renderStudentsTable(filteredStudents);
}

// --- Inisialisasi ---
let countdownInterval;

async function initializePage() {
    const nowInitial = new Date().getTime();
    if (nowInitial >= targetDate) {
        await showAnnouncement(); // Tunggu data dimuat dan ditampilkan
    } else {
        // Pra-muat data siswa agar siap saat countdown selesai
        allStudentsData = await loadAndParseStudentData(studentDataFilePath);
        // Hanya mulai countdown jika data berhasil dimuat atau ada upaya pemuatan
        // Tidak menampilkan tabel dulu, hanya memuat data di background.
        updateCountdown(); // Panggil sekali agar tidak ada delay tampilan awal
        countdownInterval = setInterval(updateCountdown, 1000);
    }
}

// Event listener untuk input pencarian
searchInputEl.addEventListener('input', filterStudents);

// Mulai semua proses
initializePage();