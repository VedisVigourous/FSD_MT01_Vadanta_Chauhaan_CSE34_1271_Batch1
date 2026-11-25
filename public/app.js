const API_BASE = '/api/books';

const elements = {
  tableBody: document.getElementById('booksTableBody'),
  statTotal: document.getElementById('statTotal'),
  statAvailable: document.getElementById('statAvailable'),
  statUnavailable: document.getElementById('statUnavailable'),
  statHttp: document.getElementById('statHttp'),
  filterForm: document.getElementById('filterForm'),
  authorFilter: document.getElementById('authorFilter'),
  resetFilterBtn: document.getElementById('resetFilterBtn'),
  idLookupForm: document.getElementById('idLookupForm'),
  idLookup: document.getElementById('idLookup'),
  statusBanner: document.getElementById('statusBanner'),
  statusBannerText: document.getElementById('statusBannerText'),
  clearBannerBtn: document.getElementById('clearBannerBtn'),
  inspectorMethod: document.getElementById('inspectorMethod'),
  inspectorEndpoint: document.getElementById('inspectorEndpoint'),
  inspectorStatus: document.getElementById('inspectorStatus'),
  inspectorBody: document.getElementById('inspectorBody'),
  bookModal: document.getElementById('bookModal'),
  modalTitle: document.getElementById('modalTitle'),
  bookForm: document.getElementById('bookForm'),
  bookId: document.getElementById('bookId'),
  titleInput: document.getElementById('titleInput'),
  authorInput: document.getElementById('authorInput'),
  genreInput: document.getElementById('genreInput'),
  yearInput: document.getElementById('yearInput'),
  availableInput: document.getElementById('availableInput'),
  formError: document.getElementById('formError'),
  openAddBtn: document.getElementById('openAddBtn'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelModalBtn: document.getElementById('cancelModalBtn'),
  toast: document.getElementById('toast'),
};

let currentBooks = [];
let toastTimer = null;

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 2600);
}

function updateInspector(method, endpoint, status, statusText, payload) {
  elements.inspectorMethod.textContent = method;
  elements.inspectorEndpoint.textContent = endpoint;
  elements.inspectorStatus.textContent = `${status} ${statusText}`.trim();
  elements.statHttp.textContent = String(status);
  elements.inspectorBody.textContent = JSON.stringify(payload, null, 2);
}

async function apiRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, options);
  const data = await response.json();
  updateInspector(method, endpoint, response.status, response.statusText, data);

  if (!response.ok) {
    const detailText = Array.isArray(data.details) ? data.details.join(' ') : '';
    throw new Error(detailText || data.error || 'Request failed');
  }
  return data;
}

function updateMetrics(books) {
  const total = books.length;
  const available = books.filter((b) => b.available).length;
  elements.statTotal.textContent = total;
  elements.statAvailable.textContent = available;
  elements.statUnavailable.textContent = total - available;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBooks(books) {
  currentBooks = books;
  updateMetrics(books);

  if (books.length === 0) {
    elements.tableBody.innerHTML =
      '<tr><td colspan="7" class="empty-cell">No books found matching this view.</td></tr>';
    return;
  }

  elements.tableBody.innerHTML = books
    .map(
      (book) => `
      <tr>
        <td class="mono">#${book.id}</td>
        <td class="book-title">${escapeHtml(book.title)}</td>
        <td>${escapeHtml(book.author)}</td>
        <td>${escapeHtml(book.genre)}</td>
        <td class="mono">${book.publishedYear}</td>
        <td>
          <button
            type="button"
            class="status-badge ${book.available ? 'available' : 'unavailable'}"
            data-action="toggle"
            data-id="${book.id}"
            title="Click to toggle availability"
          >
            ${book.available ? 'Available' : 'Checked Out'}
          </button>
        </td>
        <td class="align-right">
          <div class="row-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-action="edit" data-id="${book.id}">Edit</button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="delete" data-id="${book.id}">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');
}

async function loadAllBooks() {
  elements.statusBanner.hidden = true;
  elements.resetFilterBtn.hidden = true;
  elements.authorFilter.value = '';
  elements.idLookup.value = '';

  try {
    const books = await apiRequest('GET', API_BASE);
    renderBooks(books);
  } catch (err) {
    showToast(err.message);
  }
}

function openModal(book = null) {
  elements.formError.hidden = true;
  elements.formError.textContent = '';

  if (book) {
    elements.modalTitle.textContent = `Edit Book #${book.id}`;
    elements.bookId.value = book.id;
    elements.titleInput.value = book.title;
    elements.authorInput.value = book.author;
    elements.genreInput.value = book.genre;
    elements.yearInput.value = book.publishedYear;
    elements.availableInput.checked = book.available;
  } else {
    elements.modalTitle.textContent = 'Add New Book';
    elements.bookForm.reset();
    elements.bookId.value = '';
    elements.availableInput.checked = true;
  }

  elements.bookModal.hidden = false;
  elements.titleInput.focus();
}

function closeModal() {
  elements.bookModal.hidden = true;
}

// Event: Filter by author
elements.filterForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const author = elements.authorFilter.value.trim();
  if (!author) {
    loadAllBooks();
    return;
  }

  try {
    const matched = await apiRequest(
      'GET',
      `${API_BASE}/filter?author=${encodeURIComponent(author)}`
    );
    renderBooks(matched);
    elements.resetFilterBtn.hidden = false;
    elements.statusBanner.hidden = false;
    elements.statusBannerText.textContent = `Filtered by author "${author}" — ${matched.length} result(s)`;
  } catch (err) {
    showToast(err.message);
  }
});

// Event: Lookup by ID
elements.idLookupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = elements.idLookup.value.trim();
  if (!id) {
    loadAllBooks();
    return;
  }

  try {
    const book = await apiRequest('GET', `${API_BASE}/${encodeURIComponent(id)}`);
    renderBooks([book]);
    elements.statusBanner.hidden = false;
    elements.statusBannerText.textContent = `Showing record for ID #${book.id}`;
  } catch (err) {
    renderBooks([]);
    elements.statusBanner.hidden = false;
    elements.statusBannerText.textContent = err.message;
    showToast(err.message);
  }
});

elements.resetFilterBtn.addEventListener('click', loadAllBooks);
elements.clearBannerBtn.addEventListener('click', loadAllBooks);

// Event: Modal controls
elements.openAddBtn.addEventListener('click', () => openModal(null));
elements.closeModalBtn.addEventListener('click', closeModal);
elements.cancelModalBtn.addEventListener('click', closeModal);
elements.bookModal.addEventListener('click', (e) => {
  if (e.target === elements.bookModal) closeModal();
});

// Event: Save (POST or PUT)
elements.bookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  elements.formError.hidden = true;

  const id = elements.bookId.value;
  const payload = {
    title: elements.titleInput.value.trim(),
    author: elements.authorInput.value.trim(),
    genre: elements.genreInput.value.trim(),
    publishedYear: Number(elements.yearInput.value),
    available: elements.availableInput.checked,
  };

  try {
    if (id) {
      await apiRequest('PUT', `${API_BASE}/${id}`, payload);
      showToast(`Updated book #${id}`);
    } else {
      const created = await apiRequest('POST', API_BASE, payload);
      showToast(`Added "${created.title}" (#${created.id})`);
    }
    closeModal();
    await loadAllBooks();
  } catch (err) {
    elements.formError.textContent = err.message;
    elements.formError.hidden = false;
  }
});

// Event: Table row actions (Toggle, Edit, Delete)
elements.tableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  const book = currentBooks.find((b) => b.id === id);
  if (!book) return;

  if (action === 'edit') {
    openModal(book);
    return;
  }

  if (action === 'toggle') {
    try {
      await apiRequest('PUT', `${API_BASE}/${id}`, {
        title: book.title,
        author: book.author,
        genre: book.genre,
        publishedYear: book.publishedYear,
        available: !book.available,
      });
      showToast(`Marked #${id} as ${!book.available ? 'Available' : 'Checked Out'}`);
      await loadAllBooks();
    } catch (err) {
      showToast(err.message);
    }
    return;
  }

  if (action === 'delete') {
    try {
      await apiRequest('DELETE', `${API_BASE}/${id}`);
      showToast(`Deleted "${book.title}"`);
      await loadAllBooks();
    } catch (err) {
      showToast(err.message);
    }
  }
});

// Initial load
loadAllBooks();
