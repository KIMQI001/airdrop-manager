// ============================================
// Airdrop Task Manager - Main Application
// ============================================

// ============================================
// State Management
// ============================================
const state = {
    wallets: [],
    tasks: [],
    activities: [],
    settings: {
        theme: 'light',
        currency: 'USD'
    },
    folderHandle: null,
    currentPage: 'dashboard'
};

// ============================================
// Utility Functions
// ============================================
function generateId() {
    return crypto.randomUUID();
}

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatAddress(address) {
    if (!address) return '-';
    if (address.length <= 12) return address;
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

function getStatusColor(status) {
    const colors = {
        pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        in_progress: 'bg-brand-500/20 text-brand-400 border border-brand-500/30',
        completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    };
    return colors[status] || 'bg-white/10 text-white/60';
}

function getPriorityColor(priority) {
    const colors = {
        low: 'bg-white/10 text-white/60 border border-white/10',
        medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        high: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    };
    return colors[priority] || 'bg-white/10 text-white/60';
}

function capitalize(str) {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================
// File System Operations
// ============================================
async function selectFolder() {
    try {
        state.folderHandle = await window.showDirectoryPicker();
        document.getElementById('folder-path').textContent = state.folderHandle.name;
        await loadData();
        renderAll();
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Error selecting folder:', err);
            alert('Error selecting folder. Please try again.');
        }
    }
}

async function loadJsonFile(filename, defaultValue) {
    try {
        const fileHandle = await state.folderHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        const content = await file.text();
        return JSON.parse(content);
    } catch (err) {
        if (err.name === 'NotFoundError') {
            // File doesn't exist, create with default
            await saveJsonFile(filename, defaultValue);
            return defaultValue;
        }
        console.error(`Error loading ${filename}:`, err);
        return defaultValue;
    }
}

async function saveJsonFile(filename, data) {
    try {
        let fileHandle;
        try {
            fileHandle = await state.folderHandle.getFileHandle(filename, { create: true });
        } catch {
            fileHandle = await state.folderHandle.getFileHandle(filename);
        }
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    } catch (err) {
        console.error(`Error saving ${filename}:`, err);
    }
}

async function loadData() {
    state.wallets = await loadJsonFile('wallets.json', []);
    state.tasks = await loadJsonFile('tasks.json', []);
    state.activities = await loadJsonFile('activities.json', []);
    state.settings = await loadJsonFile('settings.json', state.settings);
}

async function saveWallets() {
    await saveJsonFile('wallets.json', state.wallets);
}

async function saveTasks() {
    await saveJsonFile('tasks.json', state.tasks);
}

async function saveActivities() {
    await saveJsonFile('activities.json', state.activities);
}

// ============================================
// Activity Logging
// ============================================
async function logActivity(type, details) {
    const activity = {
        id: generateId(),
        type: type,
        details: details,
        timestamp: new Date().toISOString()
    };
    state.activities.unshift(activity);
    if (state.activities.length > 100) {
        state.activities = state.activities.slice(0, 100);
    }
    await saveActivities();
    renderActivity();
    renderDashboard();
}

// ============================================
// Navigation
// ============================================
function showPage(pageName) {
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-100', 'text-blue-700');
    });
    const navBtn = document.getElementById(`nav-${pageName}`);
    if (navBtn) {
        navBtn.classList.add('bg-blue-100', 'text-blue-700');
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    // Show selected page
    const selectedPage = document.getElementById(`page-${pageName}`);
    if (selectedPage) {
        selectedPage.classList.remove('hidden');
    }

    state.currentPage = pageName;
    renderAll();
}

// ============================================
// Render Functions
// ============================================
function renderAll() {
    renderDashboard();
    renderWallets();
    renderTasks();
    renderActivity();
}

function renderDashboard() {
    const totalWallets = state.wallets.length;
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = state.tasks.filter(t => t.status !== 'completed').length;

    // Calculate total balance
    const totalBalance = state.wallets.reduce((sum, wallet) => {
        return sum + (parseFloat(wallet.balance) || 0);
    }, 0);

    document.getElementById('stat-balance').textContent = '$' + totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    document.getElementById('stat-wallets').textContent = totalWallets;
    document.getElementById('stat-tasks').textContent = totalTasks;
    document.getElementById('stat-completed').textContent = completedTasks;
    document.getElementById('stat-pending').textContent = pendingTasks;

    // Completion rate
    const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById('completion-bar').style.width = `${rate}%`;
    document.getElementById('completion-rate').textContent = `${rate}%`;

    // Recent activity
    const recentActivities = state.activities.slice(0, 5);
    const container = document.getElementById('dashboard-activities');
    if (recentActivities.length === 0) {
        container.innerHTML = '<p class="text-white/40 text-sm">No recent activity</p>';
    } else {
        container.innerHTML = recentActivities.map(activity => `
            <div class="flex items-center gap-3 py-2">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <div class="flex-1">
                    <p class="text-sm text-white">${capitalize(activity.type.replace(/_/g, ' '))}</p>
                    <p class="text-xs text-white/40">${formatDate(activity.timestamp)}</p>
                </div>
            </div>
        `).join('');
    }
}

function renderWallets() {
    const tbody = document.getElementById('wallets-table');
    if (state.wallets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-white/40">No wallets added yet</td></tr>';
        return;
    }

    tbody.innerHTML = state.wallets.map(wallet => {
        const balance = parseFloat(wallet.balance) || 0;
        return `
        <tr class="hover:bg-white/5">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${wallet.label}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                <div class="flex items-center gap-2">
                    <code class="text-brand-400">${formatAddress(wallet.address)}</code>
                    <button onclick="copyAddress('${wallet.address}')" class="text-white/40 hover:text-brand-400 transition-colors" title="Copy address">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                    </button>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white/70">${wallet.network || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-400">$${balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-white/50">${formatDate(wallet.createdAt)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="editWallet('${wallet.id}')" class="text-brand-400 hover:text-brand-300 mr-3">Edit</button>
                <button onclick="deleteWallet('${wallet.id}')" class="text-rose-400 hover:text-rose-300">Delete</button>
            </td>
        </tr>
    `}).join('');
}

function renderTasks() {
    const statusFilter = document.getElementById('filter-status').value;
    const priorityFilter = document.getElementById('filter-priority').value;
    const walletFilter = document.getElementById('filter-wallet').value;

    // Update wallet filter options
    const walletSelect = document.getElementById('filter-wallet');
    const currentValue = walletSelect.value;
    walletSelect.innerHTML = '<option value="all">All</option>' +
        state.wallets.map(w => `<option value="${w.id}">${w.label}</option>`).join('');
    walletSelect.value = currentValue;

    // Filter tasks
    let filteredTasks = state.tasks;
    if (statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
    }
    if (walletFilter !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.walletId === walletFilter);
    }

    const tbody = document.getElementById('tasks-table');
    if (filteredTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-white/40">No tasks found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredTasks.map(task => {
        const wallet = state.wallets.find(w => w.id === task.walletId);
        return `
            <tr class="hover:bg-white/5">
                <td class="px-6 py-4 text-sm font-medium text-white">${task.title}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}">
                        ${capitalize(task.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}">
                        ${capitalize(task.priority)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-white/70">${wallet ? wallet.label : '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-white/50">${formatDate(task.dueDate)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    ${task.status !== 'completed' ? `<button onclick="updateTaskStatus('${task.id}', 'completed')" class="text-green-600 hover:text-green-800 mr-3">Complete</button>` : ''}
                    <button onclick="editTask('${task.id}')" class="text-brand-400 hover:text-brand-300 mr-3">Edit</button>
                    <button onclick="deleteTask('${task.id}')" class="text-rose-400 hover:text-rose-300">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderActivity() {
    const container = document.getElementById('activity-list');
    if (state.activities.length === 0) {
        container.innerHTML = '<p class="px-6 py-8 text-center text-white/40">No activity yet</p>';
        return;
    }

    container.innerHTML = state.activities.map(activity => `
        <div class="px-6 py-4 hover:bg-white/5">
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-white">${capitalize(activity.type.replace(/_/g, ' '))}</p>
                    <p class="text-sm text-white/60">${activity.details || ''}</p>
                    <p class="text-xs text-white/40 mt-1">${formatDate(activity.timestamp)}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// Modal Functions
// ============================================
function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        hideModal();
    }
});

// ============================================
// Wallet CRUD
// ============================================
function showAddWalletModal() {
    const content = `
        <form id="wallet-form" onsubmit="saveWallet(event)">
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Label</label>
                <input type="text" id="wallet-label" required class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" placeholder="My Wallet">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Address</label>
                <input type="text" id="wallet-address" required class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" placeholder="0x...">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Network</label>
                <input type="text" id="wallet-network" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" placeholder="Ethereum">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Balance (USD)</label>
                <input type="number" id="wallet-balance" step="0.01" min="0" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" placeholder="0.00">
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="hideModal()" class="px-4 py-2 text-white/70 bg-white/10 rounded-lg hover:bg-white/20">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400">Save</button>
            </div>
        </form>
    `;
    showModal('Add Wallet', content);
}

let editingWalletId = null;

function editWallet(id) {
    const wallet = state.wallets.find(w => w.id === id);
    if (!wallet) return;

    editingWalletId = id;
    const content = `
        <form id="wallet-form" onsubmit="saveWallet(event)">
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Label</label>
                <input type="text" id="wallet-label" required class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" value="${wallet.label}">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Address</label>
                <input type="text" id="wallet-address" required class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" value="${wallet.address}">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Network</label>
                <input type="text" id="wallet-network" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" value="${wallet.network || ''}">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Balance (USD)</label>
                <input type="number" id="wallet-balance" step="0.01" min="0" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" value="${wallet.balance || ''}" placeholder="0.00">
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="hideModal()" class="px-4 py-2 text-white/70 bg-white/10 rounded-lg hover:bg-white/20">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400">Save</button>
            </div>
        </form>
    `;
    showModal('Edit Wallet', content);
}

async function saveWallet(e) {
    e.preventDefault();

    const label = document.getElementById('wallet-label').value.trim();
    const address = document.getElementById('wallet-address').value.trim();
    const network = document.getElementById('wallet-network').value.trim();
    const balance = document.getElementById('wallet-balance').value.trim();

    if (!label || !address) {
        alert('Please fill in all required fields');
        return;
    }

    if (editingWalletId) {
        // Update existing wallet
        const wallet = state.wallets.find(w => w.id === editingWalletId);
        if (wallet) {
            const oldLabel = wallet.label;
            wallet.label = label;
            wallet.address = address;
            wallet.network = network;
            wallet.balance = balance || 0;
            wallet.updatedAt = new Date().toISOString();
            await saveWallets();
            await logActivity('wallet_updated', `Updated wallet "${label}"`);
        }
        editingWalletId = null;
    } else {
        // Add new wallet
        const wallet = {
            id: generateId(),
            label,
            address,
            network,
            balance: balance || 0,
            createdAt: new Date().toISOString()
        };
        state.wallets.push(wallet);
        await saveWallets();
        await logActivity('wallet_added', `Added wallet "${label}"`);
    }

    hideModal();
    renderAll();
}

async function deleteWallet(id) {
    const wallet = state.wallets.find(w => w.id === id);
    if (!wallet) return;

    if (!confirm(`Are you sure you want to delete wallet "${wallet.label}"?`)) {
        return;
    }

    state.wallets = state.wallets.filter(w => w.id !== id);
    await saveWallets();
    await logActivity('wallet_deleted', `Deleted wallet "${wallet.label}"`);
    renderAll();
}

async function copyAddress(address) {
    try {
        await navigator.clipboard.writeText(address);
        alert('Address copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

// ============================================
// Task CRUD
// ============================================
function showAddTaskModal() {
    const walletOptions = state.wallets.map(w => `<option value="${w.id}">${w.label}</option>`).join('');

    const content = `
        <form id="task-form" onsubmit="saveTask(event)">
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Task Title</label>
                <input type="text" id="task-title" required class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" placeholder="Enter task title">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Description</label>
                <textarea id="task-description" rows="3" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" placeholder="Task description (optional)"></textarea>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Status</label>
                <select id="task-status" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Priority</label>
                <select id="task-priority" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white">
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Wallet</label>
                <select id="task-wallet" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white">
                    <option value="">None</option>
                    ${walletOptions}
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Due Date</label>
                <input type="date" id="task-due-date" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white">
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="hideModal()" class="px-4 py-2 text-white/70 bg-white/10 rounded-lg hover:bg-white/20">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400">Save</button>
            </div>
        </form>
    `;
    showModal('Add Task', content);
}

let editingTaskId = null;

function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    const walletOptions = state.wallets.map(w => `<option value="${w.id}" ${task.walletId === w.id ? 'selected' : ''}>${w.label}</option>`).join('');

    const content = `
        <form id="task-form" onsubmit="saveTask(event)">
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Task Title</label>
                <input type="text" id="task-title" required class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" value="${task.title}">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Description</label>
                <textarea id="task-description" rows="3" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white">${task.description || ''}</textarea>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Status</label>
                <select id="task-status" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white">
                    <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Priority</label>
                <select id="task-priority" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Wallet</label>
                <select id="task-wallet" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white">
                    <option value="">None</option>
                    ${walletOptions}
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-white/80 mb-1">Due Date</label>
                <input type="date" id="task-due-date" class="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/5 text-white" value="${task.dueDate ? task.dueDate.split('T')[0] : ''}">
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="hideModal()" class="px-4 py-2 text-white/70 bg-white/10 rounded-lg hover:bg-white/20">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400">Save</button>
            </div>
        </form>
    `;
    showModal('Edit Task', content);
}

async function saveTask(e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const status = document.getElementById('task-status').value;
    const priority = document.getElementById('task-priority').value;
    const walletId = document.getElementById('task-wallet').value;
    const dueDate = document.getElementById('task-due-date').value;

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    if (editingTaskId) {
        // Update existing task
        const task = state.tasks.find(t => t.id === editingTaskId);
        if (task) {
            const wasCompleted = task.status === 'completed';
            task.title = title;
            task.description = description;
            task.status = status;
            task.priority = priority;
            task.walletId = walletId || null;
            task.dueDate = dueDate || null;
            task.updatedAt = new Date().toISOString();
            await saveTasks();

            if (!wasCompleted && status === 'completed') {
                await logActivity('task_completed', `Completed task "${title}"`);
            } else {
                await logActivity('task_updated', `Updated task "${title}"`);
            }
        }
        editingTaskId = null;
    } else {
        // Add new task
        const task = {
            id: generateId(),
            title,
            description,
            status,
            priority,
            walletId: walletId || null,
            dueDate: dueDate || null,
            createdAt: new Date().toISOString()
        };
        state.tasks.push(task);
        await saveTasks();
        await logActivity('task_created', `Created task "${title}"`);
    }

    hideModal();
    renderAll();
}

async function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) {
        return;
    }

    state.tasks = state.tasks.filter(t => t.id !== id);
    await saveTasks();
    await logActivity('task_deleted', `Deleted task "${task.title}"`);
    renderAll();
}

async function updateTaskStatus(id, status) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const wasCompleted = task.status === 'completed';
    task.status = status;
    task.updatedAt = new Date().toISOString();
    await saveTasks();

    if (!wasCompleted && status === 'completed') {
        await logActivity('task_completed', `Completed task "${task.title}"`);
    }
    renderAll();
}

// ============================================
// Initialization
// ============================================
function init() {
    // Show dashboard by default
    showPage('dashboard');

    // Check if File System Access API is supported
    if (!window.showDirectoryPicker) {
        alert('Your browser does not support the File System Access API. Please use Chrome or Edge.');
    }
}

// Make functions globally accessible
window.showPage = showPage;
window.selectFolder = selectFolder;
window.showAddWalletModal = showAddWalletModal;
window.editWallet = editWallet;
window.deleteWallet = deleteWallet;
window.copyAddress = copyAddress;
window.saveWallet = saveWallet;
window.showAddTaskModal = showAddTaskModal;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.saveTask = saveTask;
window.updateTaskStatus = updateTaskStatus;
window.hideModal = hideModal;

// Initialize app
document.addEventListener('DOMContentLoaded', init);
