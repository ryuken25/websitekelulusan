// --- Konfigurasi ---
const targetDate = new Date(2025, 5, 2, 9, 0, 0).getTime(); // 2 Juni 2025, 10:00:00 (Bulan 5 adalah Juni)
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
let countdownInterval; // Deklarasi variabel interval di scope yang lebih luas

// --- Fungsi untuk Memuat dan Mem-parsing Data Siswa dari .txt ---
async function loadAndParseStudentData(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Gagal memuat file data: ${response.status} ${response.statusText}. Pastikan file '${filePath}' ada dan dapat diakses.`);
        }
        const textData = await response.text();
        const lines = textData.trim().split('\n');
        const students = [];

        if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === "")) {
             console.warn(`File data siswa '${filePath}' kosong.`);
             studentsListEl.innerHTML = `<tr><td colspan="3" style="text-align:center;">File data siswa (${filePath}) kosong.</td></tr>`;
             return [];
        }
        
        // Cek apakah baris pertama adalah header yang diharapkan (opsional, tapi baik)
        // const header = lines[0].trim().toLowerCase();
        // if (header !== "nama,status") {
        //     console.warn(`Header file '${filePath}' tidak sesuai. Diharapkan 'Nama,Status'.`);
        // }

        // Mulai dari baris pertama jika tidak ada header khusus atau baris ke-2 jika ada header
        const startIndex = (lines[0].toLowerCase().includes('nama') && lines[0].toLowerCase().includes('status')) ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) { 
                const parts = line.split(',');
                if (parts.length === 2) {
                    students.push({
                        no: students.length + 1, // Nomor urut berdasarkan jumlah siswa valid
                        name: parts[0].trim(),
                        status: parts[1].trim().toUpperCase() 
                    });
                } else {
                    console.warn(`Baris data tidak valid di '${filePath}' (baris ${i + 1}): ${line}. Format seharusnya 'Nama,Status'.`);
                }
            }
        }
        if (students.length === 0 && lines.length > 0 && startIndex === 1) {
             studentsListEl.innerHTML = `<tr><td colspan="3" style="text-align:center;">Tidak ada data siswa valid setelah header di file (${filePath}).</td></tr>`;
        } else if (students.length === 0 && lines.length > 0 && startIndex === 0) {
             studentsListEl.innerHTML = `<tr><td colspan="3" style="text-align:center;">Tidak ada data siswa valid di file (${filePath}).</td></tr>`;
        }
        return students;
    } catch (error) {
        console.error("Error saat memuat atau mem-parsing data siswa:", error);
        studentsListEl.innerHTML = `<tr><td colspan="3" style="color:red; text-align:center;">Terjadi kesalahan: ${error.message}</td></tr>`;
        return []; 
    }
}

// --- Fungsi Countdown ---
function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        clearInterval(countdownInterval);
        showAnnouncement(); 
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

    if (allStudentsData.length === 0) { // Hanya muat jika belum ada data (misal halaman dimuat pas waktu pengumuman)
        allStudentsData = await loadAndParseStudentData(studentDataFilePath);
    }
    renderStudentsTable(allStudentsData);
}

// --- Fungsi untuk Merender Tabel Siswa ---
function renderStudentsTable(students) {
    studentsListEl.innerHTML = ''; 

    if (!students || students.length === 0) {
        if (searchInputEl.value !== "" && students.length === 0) {
             studentsListEl.innerHTML = `<tr><td colspan="3" style="text-align:center;">Tidak ada siswa yang cocok dengan pencarian '${searchInputEl.value}'.</td></tr>`;
        } else if (allStudentsData.length > 0 && students.length === 0 && searchInputEl.value === "") {
             // Ini seharusnya tidak terjadi jika allStudentsData ada isinya dan tidak difilter,
             // tapi sebagai fallback jika students adalah array kosong karena alasan lain.
             studentsListEl.innerHTML = `<tr><td colspan="3" style="text-align:center;">Tidak ada data siswa untuk ditampilkan saat ini.</td></tr>`;
        }
        // Jika allStudentsData memang kosong dari awal karena file error/kosong, pesan sudah ada dari loadAndParseStudentData.
        return;
    }

    students.forEach((student, index) => {
        const row = studentsListEl.insertRow();
        // Gunakan nomor urut berdasarkan posisi saat ini agar tetap berurutan
        // meskipun data telah difilter oleh fitur pencarian.
        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = student.name;
        const statusCell = row.insertCell();
        statusCell.textContent = student.status; 
        if (student.status === "LULUS") {
            statusCell.style.color = "green";
            statusCell.style.fontWeight = "bold";
        } else { 
            statusCell.style.color = "red";
            statusCell.style.fontWeight = "bold";
        }
    });
}

// --- Fungsi Pencarian Siswa ---
function filterStudents() {
    const searchTerm = searchInputEl.value.toLowerCase();
    if (!allStudentsData) { 
        return;
    }
    const filteredStudents = allStudentsData.filter(student =>
        student.name.toLowerCase().includes(searchTerm)
    );
    renderStudentsTable(filteredStudents);
}

// --- Inisialisasi ---
async function initializePage() {
    const nowInitial = new Date().getTime();
    if (nowInitial >= targetDate) {
        await showAnnouncement(); 
    } else {
        allStudentsData = await loadAndParseStudentData(studentDataFilePath); // Pra-muat data
        updateCountdown(); 
        countdownInterval = setInterval(updateCountdown, 1000);
    }
}

// Event listener untuk input pencarian
searchInputEl.addEventListener('input', filterStudents);

// Mulai semua proses
initializePage();
