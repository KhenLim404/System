const API_URL = '/api/records';
let records = [];
const page = document.body.dataset.page;

function normalizeRecord(record = {}) {
  return {
    id: String(record.id ?? '').trim(),
    name: String(record.name ?? '').trim(),
    department: String(record.department ?? '').trim(),
    program: String(record.program ?? '').trim(),
    status: String(record.status ?? 'Active').trim() || 'Active',
    year: String(record.year ?? '2024').trim(),
    email: String(record.email ?? '').trim(),
    phone: String(record.phone ?? '').trim()
  };
}

async function loadRecords() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to load records.');
    }

    records = await response.json();
    return records;
  } catch (error) {
    console.error(error);
    records = [];
    return records;
  }
}

async function saveRecord(record, method = 'POST', id = '') {
  const response = await fetch(`${API_URL}${id ? `/${id}` : ''}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }

  return payload;
}

function drawDashboard() {
  if (page !== 'dashboard') return;

  const total = records.length;
  const active = records.filter((record) => record.status === 'Active').length;
  const pending = records.filter((record) => record.status === 'Pending').length;

  document.getElementById('totalRecords').textContent = total;
  document.getElementById('activeRecords').textContent = active;
  document.getElementById('pendingRecords').textContent = pending;
  document.getElementById('departmentCount').textContent = new Set(records.map((record) => record.department)).size;

  const deptMap = {};
  records.forEach((record) => {
    deptMap[record.department] = (deptMap[record.department] || 0) + 1;
  });

  const bars = document.getElementById('chartBars');
  bars.innerHTML = '';

  if (!Object.keys(deptMap).length) {
    bars.innerHTML = '<div class="empty-chart">No data</div>';
  } else {
    const max = Math.max(...Object.values(deptMap));
    Object.keys(deptMap).forEach((department) => {
      const item = document.createElement('div');
      item.className = 'chart-bar-wrap';

      const value = document.createElement('span');
      value.className = 'chart-bar-value';
      value.textContent = deptMap[department];

      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.style.height = `${Math.round(24 + (deptMap[department] / max) * 160)}px`;

      const label = document.createElement('span');
      label.className = 'chart-bar-label';
      label.textContent = department.slice(0, 3);

      item.append(value, bar, label);
      bars.appendChild(item);
    });
  }

  const latest = [...records].sort((a, b) => Number(b.year) - Number(a.year))[0];

  if (!latest) {
    document.getElementById('latestRecord').innerHTML = '<span class="latest-name">No records</span><span class="latest-meta">No metadata</span>';
    document.getElementById('lastUpdated').textContent = '--';
    document.getElementById('latestProgram').textContent = '--';
    return;
  }

  document.getElementById('latestRecord').innerHTML = `<span class="latest-name">${latest.name}</span><span class="latest-meta">${latest.department} • ${latest.id}</span>`;
  document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString();
  document.getElementById('latestProgram').textContent = latest.program;
}

function drawRecords() {
  if (page !== 'records') return;

  const table = document.getElementById('recordsTableBody');
  const searchInput = document.getElementById('searchRecords');

  function render(items) {
    if (!items.length) {
      table.innerHTML = '<tr><td colspan="8" class="empty-state">No records found.</td></tr>';
      return;
    }

    table.innerHTML = items.map((record) => `
      <tr>
        <td class="student-id">${record.id}</td>
        <td class="student-name">${record.name}</td>
        <td>${record.department}</td>
        <td>${record.program}</td>
        <td><span class="status status-${record.status.toLowerCase()}">${record.status}</span></td>
        <td>${record.year}</td>
        <td>${record.email}</td>
        <td>
          <button class="table-button edit-button" data-id="${record.id}">Edit</button>
          <button class="table-button delete-button" data-id="${record.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    table.querySelectorAll('button').forEach((button) => {
      button.onclick = async () => {
        const { id } = button.dataset;
        if (button.classList.contains('edit-button')) {
          location.href = `edit.html?id=${id}`;
          return;
        }

        await deleteRecord(id);
      };
    });
  }

  if (searchInput) {
    searchInput.oninput = (event) => {
      const query = event.target.value.trim().toLowerCase();
      const filtered = records.filter((record) => Object.values(record).some((value) => String(value).toLowerCase().includes(query)));
      render(filtered);
    };
  }

  render(records);
}

async function deleteRecord(id) {
  const target = records.find((record) => record.id === id);
  if (!target) return;

  if (!confirm(`Delete ${id}?`)) return;

  try {
    await saveRecord({}, 'DELETE', id);
    records = records.filter((record) => record.id !== id);
    drawRecords();
    drawDashboard();
  } catch (error) {
    alert(error.message);
  }
}

function getFormRecord(form) {
  const formData = new FormData(form);
  return normalizeRecord({
    id: formData.get('studentId'),
    name: formData.get('studentName'),
    department: formData.get('department'),
    program: formData.get('program'),
    status: formData.get('status'),
    year: formData.get('year'),
    email: formData.get('email'),
    phone: formData.get('phone')
  });
}

function addRecord() {
  if (page !== 'add') return;

  const form = document.getElementById('recordForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const record = getFormRecord(form);
    const duplicate = records.some((entry) => entry.id === record.id);

    if (!record.id || !record.name || !record.department || !record.program || !record.email) {
      alert('Please complete all required fields.');
      return;
    }

    if (duplicate) {
      alert('A record with this student ID already exists.');
      return;
    }

    try {
      await saveRecord(record, 'POST');
      form.reset();
      location.href = 'records.html';
    } catch (error) {
      alert(error.message);
    }
  });
}

function editRecord() {
  if (page !== 'edit') return;

  if (!records.length) {
    location.href = 'add.html';
    return;
  }

  const id = new URLSearchParams(location.search).get('id') || records[0].id;
  const targetRecord = records.find((record) => record.id === id) || records[0];
  const form = document.getElementById('editRecordForm');
  const cancelButton = document.getElementById('cancelEdit');

  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      location.href = 'records.html';
    });
  }

  const fields = {
    editStudentName: targetRecord.name,
    editStudentId: targetRecord.id,
    editDepartment: targetRecord.department,
    editProgram: targetRecord.program,
    editEmail: targetRecord.email,
    editPhone: targetRecord.phone,
    editYear: targetRecord.year,
    editStatus: targetRecord.status
  };

  Object.entries(fields).forEach(([key, value]) => {
    const element = document.getElementById(key);
    if (element) {
      element.value = value;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const updatedRecord = getFormRecord(form);
    const duplicate = records.some((record) => record.id === updatedRecord.id && record.id !== targetRecord.id);

    if (!updatedRecord.id || !updatedRecord.name || !updatedRecord.department || !updatedRecord.program || !updatedRecord.email) {
      alert('Please complete all required fields.');
      return;
    }

    if (duplicate) {
      alert('A record with this student ID already exists.');
      return;
    }

    try {
      await saveRecord(updatedRecord, 'PUT', targetRecord.id);
      location.href = 'records.html';
    } catch (error) {
      alert(error.message);
    }
  });
}

async function init() {
  await loadRecords();
  drawDashboard();
  drawRecords();
  addRecord();
  editRecord();
}

init();
