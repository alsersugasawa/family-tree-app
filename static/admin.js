const API_BASE = window.location.origin;
let adminToken = null;
let adminUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    adminToken = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');

    if (!adminToken || !userStr) {
        window.location.href = '/static/admin-login.html';
        return;
    }

    adminUser = JSON.parse(userStr);

    if (!adminUser.is_admin) {
        alert('Access denied. Admin privileges required.');
        logout();
        return;
    }

    // Display username
    document.getElementById('admin-username').textContent = adminUser.username;

    // Load initial data
    loadDashboard();
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/static/admin-login.html';
}

// Section Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.add('active');

    // Add active class to clicked nav link
    event.target.classList.add('active');

    // Load data for section
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'backups':
            loadBackups();
            break;
    }
}

// Dashboard Functions
async function loadDashboard() {
    try {
        // Load dashboard stats
        const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }
            throw new Error('Failed to load dashboard');
        }

        const data = await response.json();

        // Update stats
        document.getElementById('stat-total-users').textContent = data.total_users;
        document.getElementById('stat-active-users').textContent = data.active_users;
        document.getElementById('stat-family-trees').textContent = data.total_family_trees;
        document.getElementById('stat-family-members').textContent = data.total_family_members;
        document.getElementById('stat-tree-views').textContent = data.total_tree_views;
        document.getElementById('stat-tree-shares').textContent = data.total_tree_shares;

        // Update system resources with color coding
        updateResourceValue('system-cpu-percent', data.cpu_percent, '%');
        document.getElementById('system-cpu-speed').textContent = data.cpu_speed;
        document.getElementById('system-cpu-cores').textContent = data.cpu_cores;

        updateResourceValue('system-memory-percent', data.memory_percent, '%');
        document.getElementById('system-memory-total').textContent = data.memory_total;
        document.getElementById('system-memory-available').textContent = data.memory_available;

        updateResourceValue('system-disk-percent', data.disk_percent, '%');
        document.getElementById('system-disk-total').textContent = data.disk_total;
        document.getElementById('system-disk-available').textContent = data.disk_available;

        // Update system info
        document.getElementById('system-version').textContent = data.app_version;
        document.getElementById('system-uptime').textContent = data.uptime;
        document.getElementById('system-db-size').textContent = data.database_size || 'N/A';
        document.getElementById('python-version').textContent = data.python_version;
        document.getElementById('system-platform').textContent = data.platform;
        document.getElementById('system-arch').textContent = data.architecture;

        // Update service statuses
        updateServiceStatus('service-web', true); // Assume running if we got response
        checkDatabaseStatus();
        checkFileStorageStatus();

        // Display recent logs
        const logsDiv = document.getElementById('recent-logs');
        logsDiv.innerHTML = data.recent_logs.map(log => `
            <div class="log-entry ${log.level}">
                <div class="log-entry-time">${formatDateTime(log.created_at)}</div>
                <div class="log-entry-message">${log.message}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Failed to load dashboard data');
    }
}

async function loadSystemInfo() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/system-info`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('system-cpu').textContent = data.cpu_usage;
            document.getElementById('system-memory').textContent = data.memory_usage;
            document.getElementById('system-disk').textContent = data.disk_usage;
        }
    } catch (error) {
        console.error('Error loading system info:', error);
    }
}

// User Management Functions
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load users');

        const users = await response.json();
        const tbody = document.getElementById('users-table-body');

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="badge ${user.is_admin ? 'badge-success' : 'badge-info'}">${user.is_admin ? 'Yes' : 'No'}</span></td>
                <td><span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>${user.last_login ? formatDateTime(user.last_login) : 'Never'}</td>
                <td>
                    <button class="btn-sm btn-edit" onclick="editUser(${user.id})">Edit</button>
                    ${user.id !== adminUser.id ? `<button class="btn-sm btn-delete" onclick="deleteUser(${user.id}, '${user.username}')">Delete</button>` : ''}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading users:', error);
        alert('Failed to load users');
    }
}

function showCreateUserModal() {
    document.getElementById('create-user-modal').classList.add('show');
    document.getElementById('create-user-form').reset();
}

function closeCreateUserModal() {
    document.getElementById('create-user-modal').classList.remove('show');
}

async function handleCreateUser(event) {
    event.preventDefault();

    const userData = {
        username: document.getElementById('new-username').value,
        email: document.getElementById('new-email').value,
        password: document.getElementById('new-password').value,
        is_admin: document.getElementById('new-is-admin').checked
    };

    try {
        const response = await fetch(`${API_BASE}/api/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create user');
        }

        alert('User created successfully');
        closeCreateUserModal();
        loadUsers();

    } catch (error) {
        alert(error.message);
    }
}

async function editUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load users');

        const users = await response.json();
        const user = users.find(u => u.id === userId);

        if (!user) {
            alert('User not found');
            return;
        }

        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-is-admin').checked = user.is_admin;
        document.getElementById('edit-is-active').checked = user.is_active;
        document.getElementById('edit-user-modal').classList.add('show');

    } catch (error) {
        alert('Failed to load user details');
    }
}

function closeEditUserModal() {
    document.getElementById('edit-user-modal').classList.remove('show');
}

async function handleEditUser(event) {
    event.preventDefault();

    const userId = document.getElementById('edit-user-id').value;
    const userData = {
        email: document.getElementById('edit-email').value,
        is_admin: document.getElementById('edit-is-admin').checked,
        is_active: document.getElementById('edit-is-active').checked
    };

    try {
        const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update user');
        }

        alert('User updated successfully');
        closeEditUserModal();
        loadUsers();

    } catch (error) {
        alert(error.message);
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete user');
        }

        alert('User deleted successfully');
        loadUsers();

    } catch (error) {
        alert(error.message);
    }
}

// Logs Functions
async function loadLogs() {
    const level = document.getElementById('log-level-filter').value;
    const url = level
        ? `${API_BASE}/api/admin/logs?level=${level}`
        : `${API_BASE}/api/admin/logs`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load logs');

        const logs = await response.json();
        const tbody = document.getElementById('logs-table-body');

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No logs found</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${formatDateTime(log.created_at)}</td>
                <td><span class="badge badge-${getBadgeClass(log.level)}">${log.level}</span></td>
                <td>${log.action || '-'}</td>
                <td>${log.message}</td>
                <td>${log.user_id || '-'}</td>
                <td>${log.ip_address || '-'}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading logs:', error);
        alert('Failed to load logs');
    }
}

// Backup Functions
async function loadBackups() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/backups`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to load backups');

        const backups = await response.json();
        const tbody = document.getElementById('backups-table-body');

        if (backups.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No backups found</td></tr>';
            return;
        }

        tbody.innerHTML = backups.map(backup => `
            <tr>
                <td>${backup.filename}</td>
                <td><span class="badge badge-info">${backup.backup_type}</span></td>
                <td>${formatFileSize(backup.file_size)}</td>
                <td><span class="badge badge-${backup.status === 'completed' ? 'success' : 'warning'}">${backup.status}</span></td>
                <td>${formatDateTime(backup.created_at)}</td>
                <td>
                    <button class="btn-sm btn-edit" onclick="downloadBackup('${backup.filename}')">Download</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading backups:', error);
        alert('Failed to load backups');
    }
}

async function createBackup() {
    if (!confirm('Create a new database backup? This may take a few moments.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/backups`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ backup_type: 'database' })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create backup');
        }

        alert('Backup created successfully');
        loadBackups();

    } catch (error) {
        alert(error.message);
    }
}

function downloadBackup(filename) {
    // Note: This would need a download endpoint in the backend
    alert(`Download functionality for ${filename} - Backend endpoint needed`);
}

// Utility Functions
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatFileSize(bytes) {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
}

function getBadgeClass(level) {
    switch(level) {
        case 'INFO': return 'info';
        case 'WARNING': return 'warning';
        case 'ERROR': return 'danger';
        default: return 'info';
    }
}

// Resource value updater with color coding
function updateResourceValue(elementId, value, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = `${value.toFixed(1)}${suffix}`;

    // Remove existing color classes
    element.classList.remove('good', 'warning', 'danger');

    // Add appropriate color class based on value
    if (value < 60) {
        element.classList.add('good');
    } else if (value < 80) {
        element.classList.add('warning');
    } else {
        element.classList.add('danger');
    }
}

// Service status updater
function updateServiceStatus(serviceId, isRunning) {
    const service = document.getElementById(serviceId);
    if (!service) return;

    const statusDot = service.querySelector('.service-status');
    if (!statusDot) return;

    statusDot.classList.remove('status-running', 'status-stopped', 'status-unknown');
    statusDot.classList.add(isRunning ? 'status-running' : 'status-stopped');
}

// Check database status
async function checkDatabaseStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        updateServiceStatus('service-db', response.ok);
    } catch (error) {
        updateServiceStatus('service-db', false);
    }
}

// Check file storage status
async function checkFileStorageStatus() {
    try {
        // Try to access a static file to verify file storage is working
        const response = await fetch(`${API_BASE}/static/styles.css`, { method: 'HEAD' });
        updateServiceStatus('service-uploads', response.ok);
    } catch (error) {
        updateServiceStatus('service-uploads', false);
    }
}
