// Application state
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let usersPerPage = 10;
let currentSort = { column: 'registrationDate', direction: 'asc' };

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

// Initialize application
function init() {
    loadUsersFromStorage();
    if (allUsers.length === 0) {
        generateSampleData();
        saveUsersToStorage();
    }
    
    // Default sort by registration date (ascending)
    sortUsers('registrationDate', 'asc');
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
    localStorage.setItem('users', JSON.stringify(allUsers));
}

function loadUsersFromStorage() {
    const stored = localStorage.getItem('users');
    if (stored) {
        allUsers = JSON.parse(stored);
    }
}

// Search functionality
function performSearch() {
    const searchTerm = searchField.value.trim();
    
    // Clear error message
    searchError.textContent = '';
    const searchWrapper = searchField.closest('.search-wrapper');
    if (searchWrapper) {
        searchWrapper.style.borderColor = '';
    }
    
    if (searchTerm === '') {
        filteredUsers = [...allUsers];
    } else {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredUsers = allUsers.filter(user => {
            return user.firstName.toLowerCase().includes(lowerSearchTerm) ||
                   user.lastName.toLowerCase().includes(lowerSearchTerm) ||
                   user.email.toLowerCase().includes(lowerSearchTerm);
        });
    }
    
    // Apply current sort
    applySort();
    currentPage = 1;
    renderUsers();
    updatePagination();
}

function clearSearch() {
    searchField.value = '';
    searchError.textContent = '';
    const searchWrapper = searchField.closest('.search-wrapper');
    if (searchWrapper) {
        searchWrapper.style.borderColor = '';
    }
    // Reset to default sort by registration date (ascending)
    currentSort = { column: 'registrationDate', direction: 'asc' };
    updateSortIndicators();
    // Reset to show all users
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
        searchError.textContent = 'This field should not contain more than 40 characters.';
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

function preventExceedingMaxLength(e) {
    const value = searchField.value;
    const searchWrapper = searchField.closest('.search-wrapper');
    
    // Allow special keys (backspace, delete, arrow keys, etc.)
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
                         'Tab', 'Home', 'End', 'Enter', 'Escape'];
    
    // Allow Ctrl/Cmd combinations (Ctrl+A, Ctrl+C, etc.)
    if (e.ctrlKey || e.metaKey || allowedKeys.includes(e.key)) {
        return;
    }
    
    // Prevent input if already at max length
    if (value.length >= 40) {
        e.preventDefault();
        searchError.textContent = 'This field should not contain more than 40 characters.';
        if (searchWrapper) {
            searchWrapper.style.borderColor = '#e53e3e';
        }
    } else {
        // Clear error if under limit
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
    if (column === 'number' || column === 'registrationDate') {
        return; // Not sortable
    }
    
    if (currentSort.column === column) {
        // Toggle direction
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, start with ascending
        currentSort.column = column;
        currentSort.direction = 'asc';
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
            
            row.innerHTML = `
                <td>${globalIndex}</td>
                <td>${escapeHtml(user.firstName)}</td>
                <td>${escapeHtml(user.lastName)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${formattedDate}</td>
                <td><a href="#" class="view-link" data-user-id="${user.id}" target="_blank">View</a></td>
            `;
            
            usersTableBody.appendChild(row);
        });
        
        // Add click handler for view links
        document.querySelectorAll('.view-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const userId = link.getAttribute('data-user-id');
                // For now, just show alert. In User Story 2, this will navigate to User Details page
                alert(`View user details for user ID: ${userId}\n(This will be implemented in User Story 2)`);
            });
        });
    }
    
    // Update users count
    usersCount.textContent = `Found users: ${filteredUsers.length}`;
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
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Update button states
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderUsers();
    updatePagination();
}

// Event listeners
function setupEventListeners() {
    // Search field input validation
    searchField.addEventListener('input', () => {
        validateSearchField();
    });
    
    // Prevent exceeding 40 characters on keypress
    searchField.addEventListener('keydown', (e) => {
        preventExceedingMaxLength(e);
    });
    
    // Handle paste events to validate and truncate length
    searchField.addEventListener('paste', (e) => {
        setTimeout(() => {
            if (searchField.value.length > 40) {
                searchField.value = searchField.value.substring(0, 40);
                validateSearchField();
            } else {
                validateSearchField();
            }
        }, 0);
    });
    
    // Search on Enter key
    searchField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (validateSearchField()) {
                performSearch();
            }
        }
    });
    
    // Search button click
    searchButton.addEventListener('click', () => {
        if (validateSearchField()) {
            performSearch();
        }
    });
    
    // Clear search button click
    clearSearchButton.addEventListener('click', () => {
        clearSearch();
    });
    
    // Users per page select change
    usersPerPageSelect.addEventListener('change', (e) => {
        usersPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        renderUsers();
        updatePagination();
    });
    
    // Sortable column headers
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-column');
            handleSortClick(column);
        });
    });
    
    // Pagination buttons
    firstPageBtn.addEventListener('click', () => goToPage(1));
    prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    lastPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        goToPage(totalPages);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

