const user = checkAuth();
const list = document.getElementById('file-list');

fetch(`/api/files/${user.id}`)
.then(res => res.json())
.then(data => {
    list.innerHTML = data.map(file => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4">${file.original_name} <i class="fa-solid fa-arrow-right mx-2 text-xs"></i> ${file.converted_name}</td>
            <td class="p-4">${(file.size / 1024).toFixed(1)} KB</td>
            <td class="p-4">${file.date}</td>
            <td class="p-4">
                <a href="/uploads/${file.converted_name}" download class="text-blue-600 font-bold">Download</a>
            </td>
        </tr>
    `).join('');
});