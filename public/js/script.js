// --- KONFIGURASI URL BACKEND ---
// Sesuaikan port dengan server.js Anda (biasanya 3000)
const BASE_URL = 'http://localhost:3000'; 

// --- DOM ELEMENTS ---
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const preview = document.getElementById('image-preview');
const controls = document.getElementById('controls');
const uploadInstruction = document.getElementById('upload-instruction');
const statTotal = document.getElementById('stat-total');
const historyList = document.getElementById('history-list');

let originalImage = null;
let originalFileName = '';

// --- 1. DRAG & DROP EVENTS ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

['dragenter', 'dragover'].forEach(name => dropArea.addEventListener(name, () => dropArea.classList.add('drop-zone-active'), false));
['dragleave', 'drop'].forEach(name => dropArea.addEventListener(name, () => dropArea.classList.remove('drop-zone-active'), false));

dropArea.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]), false);
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]), false);

// --- 2. HANDLE FILE INPUT ---
function handleFile(file) {
    if (!file || file.type !== 'image/webp') return alert('Mohon upload file .WEBP saja!');
    
    originalFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        uploadInstruction.classList.add('opacity-0');
        controls.classList.remove('opacity-50', 'pointer-events-none');
        
        originalImage = new Image();
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// --- 3. PROCESS CONVERSION ---
function processConversion() {
    const btn = document.getElementById('convert-btn');
    const originalText = btn.innerHTML;
    
    // UI Loading State
    btn.innerHTML = `<span class="loader"></span> Processing...`;
    btn.disabled = true;
    
    setTimeout(() => {
        const format = document.querySelector('input[name="format"]:checked').value;
        const canvas = document.createElement('canvas');
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        const ctx = canvas.getContext('2d');

        // Handle transparent background for JPG
        if (format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(originalImage, 0, 0);

        // Convert to Blob & Upload
        canvas.toBlob((blob) => {
            uploadToBackend(blob, format, btn, originalText);
            
            // Auto Download (Client Side)
            const link = document.createElement('a');
            link.download = `converted_${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
            link.href = URL.createObjectURL(blob);
            link.click();
        }, `image/${format}`, 0.9);

    }, 800); // Fake delay for UX
}

// --- 4. UPLOAD TO SERVER ---
function uploadToBackend(blob, format, btn, originalText) {
    const formData = new FormData();
    formData.append('image', blob, `converted.${format === 'jpeg' ? 'jpg' : 'png'}`);
    formData.append('originalName', originalFileName);
    formData.append('format', format.toUpperCase());

    fetch(`${BASE_URL}/api/save`, { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            loadHistory(); // Refresh Dashboard Data
            
            // Success State
            btn.classList.remove('bg-slate-900', 'hover:bg-slate-800');
            btn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
            btn.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Saved!`;
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.add('bg-slate-900', 'hover:bg-slate-800');
                btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
                btn.disabled = false;
            }, 2500);
        }
    })
    .catch(err => {
        console.error(err);
        btn.innerHTML = 'Error!';
        btn.disabled = false;
        alert('Gagal menghubungi server.');
    });
}

// --- 5. LOAD DASHBOARD DATA ---
function loadHistory() {
    fetch(`${BASE_URL}/api/history`)
    .then(res => res.json())
    .then(data => {
        // Update Counter Stats
        if(statTotal) statTotal.innerText = data.length;

        // Populate Table
        if(data.length === 0) {
            historyList.innerHTML = `<tr><td class="p-4 text-center text-slate-400">Belum ada history.</td></tr>`;
            return;
        }

        historyList.innerHTML = data.map(item => `
            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group">
                <td class="p-3">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <i class="fa-regular fa-image"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="font-medium text-slate-700 truncate max-w-[120px]" title="${item.original_name}">${item.original_name}</p>
                            <p class="text-[10px] text-slate-400 uppercase">${item.format}</p>
                        </div>
                    </div>
                </td>
                <td class="p-3 text-right">
                    <a href="${BASE_URL}/uploads/${item.converted_name}" download class="w-8 h-8 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all ml-auto">
                        <i class="fa-solid fa-download text-xs"></i>
                    </a>
                </td>
            </tr>
        `).join('');
    })
    .catch(err => console.log("Gagal memuat data history."));
}

// Initialize
loadHistory();