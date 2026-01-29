// Application state
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let usersPerPage = 10;
let currentSort = { column: 'lastName', direction: 'asc' };

// DOM elements
const searchField = document.getElementById('searchField');
const searchButton = document.getElementById('searchButton');
const clearSearchButton = document.getElementById('clearSearchButton');
const searchError = document.getElementById('searchError');
const usersTableBody = document.getElementById('usersTableBody');
const usersCount = document.getElementById('usersCount');
const noUsersMessage = document.getElementById('noUsersMessage');
const paginationContainer = document.getElementById('paginationContainer');
const pageInfo = document.getElementById('pageInfo');
const usersPerPageSelect = document.getElementById('usersPerPageSelect');
const firstPageBtn = document.getElementById('firstPage');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const lastPageBtn = document.getElementById('lastPage');

// BUG: Intentional UI freeze - blocks main thread for ms milliseconds
function simulateFreeze(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {}
}

// Initialize application
function init() {
    loadUsersFromStorage();
    if (allUsers.length === 0) {
        generateSampleData();
        saveUsersToStorage();
    }
    
    // Default sort by last name (ascending) - BUG: should be registration date
    sortUsers('lastName', 'asc');
    filteredUsers = [...allUsers];
    
    // Set default users per page
    usersPerPageSelect.value = usersPerPage.toString();
    
    setupEventListeners();
    renderUsers();
    updatePagination();
}

// Generate sample data
function generateSampleData() {
    const firstNames = [
        'John', 'Mary', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
        'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
        'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
        'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'
    ];
    
    const lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
        'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
        'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'
    ];
    
    const domains = ['gmail.com', 'ukr.net', 'yahoo.com', 'outlook.com', 'icloud.com'];
    
    const users = [];
    const now = new Date();
    
    for (let i = 0; i < 45; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domains[Math.floor(Math.random() * domains.length)]}`;
        
        // Generate registration date within last 2 years
        const daysAgo = Math.floor(Math.random() * 730);
        const registrationDate = new Date(now);
        registrationDate.setDate(registrationDate.getDate() - daysAgo);
        
        users.push({
            id: i + 1,
            firstName: firstName,
            lastName: lastName,
            email: email,
            registrationDate: registrationDate.toISOString()
        });
    }
    
    allUsers = users;
}

// LocalStorage management
function saveUsersToStorage() {
    localStorage.setItem('users_buggy', JSON.stringify(allUsers));
}

function loadUsersFromStorage() {
    const stored = localStorage.getItem('users_buggy');
    if (stored) {
        allUsers = JSON.parse(stored);
    }
}

// Search functionality - BUG: case-sensitive search (should be case-insensitive)
function performSearch() {
    const searchTerm = searchField.value.trim();
    
    // BUG: Intentional freeze when search term has 3+ characters (~2.5 sec)
    if (searchTerm.length >= 3) {
        simulateFreeze(2500);
    }
    
    // Clear error message
    searchError.textContent = '';
    const searchWrapper = searchField.closest('.search-wrapper');
    if (searchWrapper) {
        searchWrapper.style.borderColor = '';
    }
    
    // BUG: when search is empty and user triggers search, show no results instead of all users
    if (searchTerm === '') {
        filteredUsers = [];
    } else {
        // BUG: case-sensitive - no toLowerCase()
        filteredUsers = allUsers.filter(user => {
            return user.firstName.includes(searchTerm) ||
                   user.lastName.includes(searchTerm) ||
                   user.email.includes(searchTerm);
        });
    }
    
    // Apply current sort
    applySort();
    currentPage = 1;
    renderUsers();
    updatePagination();
}

function clearSearch() {
    // BUG: Intentional freeze on Clear button (~1.5 sec)
    simulateFreeze(1500);
    searchField.value = '';
    searchError.textContent = '';
    const searchWrapper = searchField.closest('.search-wrapper');
    if (searchWrapper) {
        searchWrapper.style.borderColor = '';
    }
    // BUG: does NOT reset sorting to default (registration date asc)
    filteredUsers = [...allUsers];
    applySort();
    currentPage = 1;
    renderUsers();
    updatePagination();
}

function validateSearchField() {
    const value = searchField.value;
    const searchWrapper = searchField.closest('.search-wrapper');
    
    if (value.length > 40) {
        // BUG: wrong message text (should be "This field should not contain more than 40 characters.")
        searchError.textContent = 'Maximum 40 characters allowed.';
        if (searchWrapper) {
            searchWrapper.style.borderColor = '#e53e3e';
        }
        return false;
    } else {
        searchError.textContent = '';
        if (searchWrapper) {
            searchWrapper.style.borderColor = '';
        }
        return true;
    }
}

// BUG: does not prevent 41st character - allows typing beyond 40
function preventExceedingMaxLength(e) {
    const value = searchField.value;
    const searchWrapper = searchField.closest('.search-wrapper');
    
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
                         'Tab', 'Home', 'End', 'Enter', 'Escape'];
    
    if (e.ctrlKey || e.metaKey || allowedKeys.includes(e.key)) {
        return;
    }
    
    // BUG: only show message but don't prevent input when at 40 chars
    if (value.length >= 40) {
        searchError.textContent = 'Maximum 40 characters allowed.';
        if (searchWrapper) {
            searchWrapper.style.borderColor = '#e53e3e';
        }
        // Intentionally NOT calling e.preventDefault() - 41st char can be typed
    } else {
        if (searchError.textContent && value.length < 40) {
            searchError.textContent = '';
            if (searchWrapper) {
                searchWrapper.style.borderColor = '';
            }
        }
    }
}

// Sorting functionality
function sortUsers(column, direction) {
    currentSort = { column, direction };
    applySort();
}

function applySort() {
    filteredUsers.sort((a, b) => {
        let aVal, bVal;
        
        switch (currentSort.column) {
            case 'number':
                // BUG: Number column is sortable but shouldn't be - sorts by row index
                aVal = filteredUsers.indexOf(a);
                bVal = filteredUsers.indexOf(b);
                break;
            case 'firstName':
                aVal = a.firstName.toLowerCase();
                bVal = b.firstName.toLowerCase();
                break;
            case 'lastName':
                aVal = a.lastName.toLowerCase();
                bVal = b.lastName.toLowerCase();
                break;
            case 'email':
                aVal = a.email.toLowerCase();
                bVal = b.email.toLowerCase();
                break;
            case 'registrationDate':
                aVal = new Date(a.registrationDate);
                bVal = new Date(b.registrationDate);
                break;
            default:
                return 0;
        }
        
        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function handleSortClick(column) {
    if (column === 'registrationDate') {
        return;
    }
    // BUG: Number is sortable (not filtered out)
    // BUG: Intentional freeze when sorting by E-mail column (~2 sec)
    if (column === 'email') {
        simulateFreeze(2000);
    }
    
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        // BUG: First Name first click gives descending instead of ascending
        if (column === 'firstName') {
            currentSort.direction = 'desc';
        } else {
            currentSort.direction = 'asc';
        }
    }
    
    applySort();
    updateSortIndicators();
    currentPage = 1;
    renderUsers();
    updatePagination();
}

function updateSortIndicators() {
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('asc', 'desc');
        const column = th.getAttribute('data-column');
        if (column === currentSort.column) {
            th.classList.add(currentSort.direction);
        }
    });
}

// Rendering
function renderUsers() {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const pageUsers = filteredUsers.slice(startIndex, endIndex);
    
    usersTableBody.innerHTML = '';
    
    if (pageUsers.length === 0) {
        noUsersMessage.style.display = 'block';
        paginationContainer.style.display = 'none';
    } else {
        noUsersMessage.style.display = 'none';
        paginationContainer.style.display = 'flex';
        
        pageUsers.forEach((user, index) => {
            const row = document.createElement('tr');
            const globalIndex = startIndex + index + 1;
            
            const registrationDate = new Date(user.registrationDate);
            const formattedDate = registrationDate.toLocaleDateString('uk-UA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            // BUG: View link does NOT open in new tab (missing target="_blank")
            row.innerHTML = `
                <td>${globalIndex}</td>
                <td>${escapeHtml(user.firstName)}</td>
                <td>${escapeHtml(user.lastName)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${formattedDate}</td>
                <td><a href="#" class="view-link" data-user-id="${user.id}">View</a></td>
            `;
            
            usersTableBody.appendChild(row);
        });
        
        document.querySelectorAll('.view-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const userId = link.getAttribute('data-user-id');
                alert(`View user details for user ID: ${userId}\n(This will be implemented in User Story 2)`);
            });
        });
    }
    
    // BUG: wrong label "Users count:" instead of "Found users:"
    usersCount.textContent = `Users count: ${filteredUsers.length}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    
    if (totalPages === 0) {
        return;
    }
    
    // BUG: if currentPage > totalPages (e.g. after changing users per page), don't correct it - show wrong "Page X of Y"
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (page < 1 || page > totalPages) return;
    // BUG: Intentional freeze when clicking Next or Last (~1.2 sec)
    if (page > currentPage) {
        simulateFreeze(1200);
    }
    currentPage = page;
    renderUsers();
    updatePagination();
}

// Event listeners
function setupEventListeners() {
    searchField.addEventListener('input', () => {
        validateSearchField();
    });
    
    searchField.addEventListener('keydown', (e) => {
        preventExceedingMaxLength(e);
    });
    
    searchField.addEventListener('paste', (e) => {
        setTimeout(() => {
            // BUG: don't truncate on paste - allow pasted text to exceed 40 (up to maxlength 45)
            validateSearchField();
        }, 0);
    });
    
    searchField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (validateSearchField()) {
                performSearch();
            }
        }
    });
    
    searchButton.addEventListener('click', () => {
        if (validateSearchField()) {
            performSearch();
        }
    });
    
    clearSearchButton.addEventListener('click', () => {
        clearSearch();
    });
    
    // BUG: when changing users per page, do NOT reset to page 1 - can show empty page
    // BUG: Intentional freeze when changing "users per page" (~1.8 sec)
    usersPerPageSelect.addEventListener('change', (e) => {
        simulateFreeze(1800);
        usersPerPage = parseInt(e.target.value, 10);
        renderUsers();
        updatePagination();
    });
    
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-column');
            handleSortClick(column);
        });
    });
    
    firstPageBtn.addEventListener('click', () => goToPage(1));
    prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    lastPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        goToPage(totalPages);
    });
}

document.addEventListener('DOMContentLoaded', init);
