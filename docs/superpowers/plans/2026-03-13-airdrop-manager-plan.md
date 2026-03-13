# Airdrop Task Manager Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single-page web app for managing airdrop tasks with treasury, task tracking, activity history, and dashboard.

**Architecture:** Single HTML file with vanilla JS + Tailwind CSS (CDN). Data stored in local JSON files in a user-selected folder using the File System Access API.

**Tech Stack:** HTML5, Vanilla JavaScript, Tailwind CSS (CDN), File System Access API

---

## File Structure

```
airdrop-manager/
├── index.html          # Main application file
└── data/               # Data folder (created by user)
    ├── wallets.json
    ├── tasks.json
    ├── activities.json
    └── settings.json
```

---

## Implementation

### Task 1: Create HTML Structure with Tailwind CSS

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create index.html with basic structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Airdrop Task Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50">
    <div id="app" class="flex min-h-screen">
        <!-- Sidebar -->
        <aside id="sidebar" class="w-60 bg-white border-r border-slate-200 fixed h-full hidden md:flex flex-col">
            <div class="p-4 border-b border-slate-200">
                <h1 class="text-xl font-bold text-indigo-600">Airdrop Manager</h1>
            </div>
            <nav class="flex-1 p-4">
                <ul class="space-y-2">
                    <li>
                        <button data-page="dashboard" class="nav-btn w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
                            📊 Dashboard
                        </button>
                    </li>
                    <li>
                        <button data-page="treasury" class="nav-btn w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
                            💰 Treasury
                        </button>
                    </li>
                    <li>
                        <button data-page="tasks" class="nav-btn w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
                            ✅ Tasks
                        </button>
                    </li>
                    <li>
                        <button data-page="activity" class="nav-btn w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
                            📜 Activity
                        </button>
                    </li>
                </ul>
            </nav>
            <div class="p-4 border-t border-slate-200">
                <button id="select-folder-btn" class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                    📁 Select Folder
                </button>
                <p id="folder-path" class="text-xs text-slate-500 mt-2 truncate">No folder selected</p>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 md:ml-60 p-6">
            <!-- Dashboard Page -->
            <div id="page-dashboard" class="page hidden">
                <h2 class="text-2xl font-bold text-slate-900 mb-6">Dashboard</h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p class="text-sm text-slate-500">Total Wallets</p>
                        <p id="stat-wallets" class="text-3xl font-bold text-indigo-600">0</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p class="text-sm text-slate-500">Total Tasks</p>
                        <p id="stat-tasks" class="text-3xl font-bold text-indigo-600">0</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p class="text-sm text-slate-500">Completed</p>
                        <p id="stat-completed" class="text-3xl font-bold text-emerald-600">0</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p class="text-sm text-slate-500">In Progress</p>
                        <p id="stat-in-progress" class="text-3xl font-bold text-amber-600">0</p>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <h3 class="font-semibold text-slate-900 mb-4">Completion Rate</h3>
                        <div class="w-full bg-slate-200 rounded-full h-4">
                            <div id="completion-bar" class="bg-emerald-500 h-4 rounded-full transition-all" style="width: 0%"></div>
                        </div>
                        <p id="completion-text" class="text-sm text-slate-600 mt-2">0% completed</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <h3 class="font-semibold text-slate-900 mb-4">Recent Activity</h3>
                        <ul id="recent-activity" class="space-y-2 text-sm text-slate-600">
                            <li class="text-slate-400">No recent activity</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Treasury Page -->
            <div id="page-treasury" class="page hidden">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-slate-900">Treasury</h2>
                    <button id="add-wallet-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        + Add Wallet
                    </button>
                </div>
                <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Label</th>
                                <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Address</th>
                                <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Network</th>
                                <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Created</th>
                                <th class="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="wallets-table" class="divide-y divide-slate-200">
                            <tr>
                                <td colspan="5" class="px-4 py-8 text-center text-slate-400">No wallets added yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Tasks Page -->
            <div id="page-tasks" class="page hidden">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-slate-900">Tasks</h2>
                    <button id="add-task-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        + Add Task
                    </button>
                </div>
                <div class="flex gap-2 mb-4">
                    <select id="filter-status" class="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    <select id="filter-priority" class="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                        <option value="">All Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Task</th>
                                <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                                <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Priority</th>
                                <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Wallet</th>
                                <th class="text-left px-4 py-3 text-sm font-medium text-slate-600">Due Date</th>
                                <th class="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tasks-table" class="divide-y divide-slate-200">
                            <tr>
                                <td colspan="6" class="px-4 py-8 text-center text-slate-400">No tasks added yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Activity Page -->
            <div id="page-activity" class="page hidden">
                <h2 class="text-2xl font-bold text-slate-900 mb-6">Activity History</h2>
                <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <ul id="activity-list" class="divide-y divide-slate-200">
                        <li class="px-4 py-8 text-center text-slate-400">No activity yet</li>
                    </ul>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal -->
    <div id="modal" class="fixed inset-0 bg-black/50 hidden flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div class="flex justify-between items-center p-4 border-b border-slate-200">
                <h3 id="modal-title" class="text-lg font-semibold text-slate-900">Modal</h3>
                <button id="modal-close" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div id="modal-content" class="p-4">
                <!-- Dynamic content -->
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify HTML structure loads correctly**

Open the file in browser - should show sidebar with navigation and empty dashboard.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: create HTML structure with Tailwind CSS"
```

---

### Task 2: Create JavaScript Application Logic

**Files:**
- Create: `app.js`

- [ ] **Step 1: Create app.js with data management and UI logic**

```javascript
// Airdrop Task Manager - Main Application

// State
let state = {
    wallets: [],
    tasks: [],
    activities: [],
    settings: {},
    folderHandle: null
};

// Utility functions
function generateId() {
    return crypto.randomUUID();
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// File System Operations
async function selectFolder() {
    try {
        const handle = await window.showDirectoryPicker();
        state.folderHandle = handle;

        // Check if data files exist
        await loadData();

        document.getElementById('folder-path').textContent = handle.name;
        document.getElementById('select-folder-btn').textContent = '📁 Change Folder';
    } catch (err) {
        console.log('Folder selection cancelled');
    }
}

async function loadData() {
    try {
        // Load wallets
        try {
            const walletHandle = await state.folderHandle.getFileHandle('wallets.json');
            const walletFile = await walletHandle.getFile();
            const walletData = JSON.parse(await walletFile.text());
            state.wallets = walletData.wallets || [];
        } catch (e) {
            state.wallets = [];
            await saveJsonFile('wallets.json', { wallets: [] });
        }

        // Load tasks
        try {
            const taskHandle = await state.folderHandle.getFileHandle('tasks.json');
            const taskFile = await taskHandle.getFile();
            const taskData = JSON.parse(await taskFile.text());
            state.tasks = taskData.tasks || [];
        } catch (e) {
            state.tasks = [];
            await saveJsonFile('tasks.json', { tasks: [] });
        }

        // Load activities
        try {
            const activityHandle = await state.folderHandle.getFileHandle('activities.json');
            const activityFile = await activityHandle.getFile();
            const activityData = JSON.parse(await activityFile.text());
            state.activities = activityData.activities || [];
        } catch (e) {
            state.activities = [];
            await saveJsonFile('activities.json', { activities: [] });
        }

        // Load settings
        try {
            const settingsHandle = await state.folderHandle.getFileHandle('settings.json');
            const settingsFile = await settingsHandle.getFile();
            state.settings = JSON.parse(await settingsFile.text());
        } catch (e) {
            state.settings = {};
            await saveJsonFile('settings.json', state.settings);
        }

        renderAll();
    } catch (err) {
        console.error('Error loading data:', err);
    }
}

async function saveJsonFile(filename, data) {
    try {
        const handle = await state.folderHandle.getFileHandle(filename, { create: true });
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    } catch (err) {
        console.error('Error saving file:', err);
    }
}

// Activity logging
async function logActivity(type, description, entityId = null) {
    const activity = {
        id: generateId(),
        type,
        description,
        entityId,
        timestamp: new Date().toISOString()
    };
    state.activities.unshift(activity);
    await saveJsonFile('activities.json', { activities: state.activities });
    renderActivity();
    renderDashboard();
}

// Navigation
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${pageName}`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-100', 'text-indigo-700');
        if (btn.dataset.page === pageName) {
            btn.classList.add('bg-indigo-100', 'text-indigo-700');
        }
    });
}

// Render functions
function renderAll() {
    renderWallets();
    renderTasks();
    renderActivity();
    renderDashboard();
}

function renderDashboard() {
    const totalWallets = state.wallets.length;
    const totalTasks = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'completed').length;
    const inProgress = state.tasks.filter(t => t.status === 'in-progress').length;
    const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    document.getElementById('stat-wallets').textContent = totalWallets;
    document.getElementById('stat-tasks').textContent = totalTasks;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-in-progress').textContent = inProgress;
    document.getElementById('completion-bar').style.width = `${completionRate}%`;
    document.getElementById('completion-text').textContent = `${completionRate}% completed`;

    // Recent activity
    const recentActivity = document.getElementById('recent-activity');
    if (state.activities.length === 0) {
        recentActivity.innerHTML = '<li class="text-slate-400">No recent activity</li>';
    } else {
        recentActivity.innerHTML = state.activities.slice(0, 5).map(a => `
            <li class="flex items-center gap-2">
                <span class="text-slate-400">•</span>
                <span>${a.description}</span>
                <span class="text-slate-400 text-xs">${formatDate(a.timestamp)}</span>
            </li>
        `).join('');
    }
}

function renderWallets() {
    const tbody = document.getElementById('wallets-table');
    if (state.wallets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">No wallets added yet</td></tr>';
        return;
    }
    tbody.innerHTML = state.wallets.map(wallet => `
        <tr class="hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-900">${wallet.label}</td>
            <td class="px-4 py-3">
                <code class="text-xs bg-slate-100 px-2 py-1 rounded">${wallet.address.substring(0, 10)}...${wallet.address.substring(-6)}</code>
                <button class="ml-2 text-indigo-600 hover:text-indigo-800" onclick="copyAddress('${wallet.address}')" title="Copy">📋</button>
            </td>
            <td class="px-4 py-3 text-slate-600">${wallet.network}</td>
            <td class="px-4 py-3 text-slate-600">${formatDate(wallet.createdAt)}</td>
            <td class="px-4 py-3 text-right">
                <button class="text-slate-400 hover:text-indigo-600 mr-2" onclick="editWallet('${wallet.id}')">✏️</button>
                <button class="text-slate-400 hover:text-rose-600" onclick="deleteWallet('${wallet.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function renderTasks() {
    const statusFilter = document.getElementById('filter-status').value;
    const priorityFilter = document.getElementById('filter-priority').value;

    let filtered = [...state.tasks];
    if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
    if (priorityFilter) filtered = filtered.filter(t => t.priority === priorityFilter);

    const tbody = document.getElementById('tasks-table');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-400">No tasks found</td></tr>';
        return;
    }

    const getWalletLabel = (walletId) => {
        const wallet = state.wallets.find(w => w.id === walletId);
        return wallet ? wallet.label : '-';
    };

    const statusColors = {
        'pending': 'bg-slate-100 text-slate-700',
        'in-progress': 'bg-amber-100 text-amber-700',
        'completed': 'bg-emerald-100 text-emerald-700'
    };

    const priorityColors = {
        'low': 'text-slate-500',
        'medium': 'text-amber-600',
        'high': 'text-rose-600'
    };

    tbody.innerHTML = filtered.map(task => `
        <tr class="hover:bg-slate-50">
            <td class="px-4 py-3">
                <div class="font-medium text-slate-900">${task.title}</div>
                <div class="text-sm text-slate-500">${task.description || ''}</div>
            </td>
            <td class="px-4 py-3">
                <select class="border border-slate-300 rounded px-2 py-1 text-sm ${statusColors[task.status]}"
                        onchange="updateTaskStatus('${task.id}', this.value)">
                    <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </td>
            <td class="px-4 py-3 ${priorityColors[task.priority]}">${task.priority}</td>
            <td class="px-4 py-3 text-slate-600">${getWalletLabel(task.walletId)}</td>
            <td class="px-4 py-3 text-slate-600">${formatDate(task.dueDate)}</td>
            <td class="px-4 py-3 text-right">
                <button class="text-slate-400 hover:text-indigo-600 mr-2" onclick="editTask('${task.id}')">✏️</button>
                <button class="text-slate-400 hover:text-rose-600" onclick="deleteTask('${task.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function renderActivity() {
    const list = document.getElementById('activity-list');
    if (state.activities.length === 0) {
        list.innerHTML = '<li class="px-4 py-8 text-center text-slate-400">No activity yet</li>';
        return;
    }

    const typeIcons = {
        'wallet_added': '💰',
        'wallet_updated': '💰',
        'wallet_deleted': '💰',
        'task_created': '✅',
        'task_updated': '✅',
        'task_deleted': '✅',
        'task_completed': '✅'
    };

    list.innerHTML = state.activities.map(activity => `
        <li class="px-4 py-3 flex items-start gap-3">
            <span class="text-xl">${typeIcons[activity.type] || '📋'}</span>
            <div class="flex-1">
                <p class="text-slate-900">${activity.description}</p>
                <p class="text-xs text-slate-400">${formatDate(activity.timestamp)}</p>
            </div>
        </li>
    `).join('');
}

// Modal functions
function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('modal').classList.add('hidden');
}

// Wallet CRUD
function showAddWalletModal() {
    const networks = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC', 'Avalanche', 'Solana', 'Other'];
    const content = `
        <form id="wallet-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input type="text" name="label" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input type="text" name="address" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0x...">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Network</label>
                <select name="network" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    ${networks.map(n => `<option value="${n}">${n}</option>`).join('')}
                </select>
            </div>
            <div class="flex justify-end gap-2">
                <button type="button" onclick="hideModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
            </div>
        </form>
    `;
    showModal('Add Wallet', content);

    document.getElementById('wallet-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const wallet = {
            id: generateId(),
            label: formData.get('label'),
            address: formData.get('address'),
            network: formData.get('network'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.wallets.push(wallet);
        await saveJsonFile('wallets.json', { wallets: state.wallets });
        await logActivity('wallet_added', `Added wallet: ${wallet.label}`, wallet.id);
        hideModal();
        renderAll();
    });
}

async function editWallet(id) {
    const wallet = state.wallets.find(w => w.id === id);
    if (!wallet) return;

    const networks = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC', 'Avalanche', 'Solana', 'Other'];
    const content = `
        <form id="wallet-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input type="text" name="label" required value="${wallet.label}" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input type="text" name="address" required value="${wallet.address}" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Network</label>
                <select name="network" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    ${networks.map(n => `<option value="${n}" ${n === wallet.network ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
            </div>
            <div class="flex justify-end gap-2">
                <button type="button" onclick="hideModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
            </div>
        </form>
    `;
    showModal('Edit Wallet', content);

    document.getElementById('wallet-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        wallet.label = formData.get('label');
        wallet.address = formData.get('address');
        wallet.network = formData.get('network');
        wallet.updatedAt = new Date().toISOString();
        await saveJsonFile('wallets.json', { wallets: state.wallets });
        await logActivity('wallet_updated', `Updated wallet: ${wallet.label}`, wallet.id);
        hideModal();
        renderAll();
    });
}

async function deleteWallet(id) {
    if (!confirm('Are you sure you want to delete this wallet?')) return;
    const wallet = state.wallets.find(w => w.id === id);
    state.wallets = state.wallets.filter(w => w.id !== id);
    await saveJsonFile('wallets.json', { wallets: state.wallets });
    await logActivity('wallet_deleted', `Deleted wallet: ${wallet?.label || 'Unknown'}`, id);
    renderAll();
}

function copyAddress(address) {
    navigator.clipboard.writeText(address);
    alert('Address copied to clipboard!');
}

// Task CRUD
function showAddTaskModal() {
    const content = `
        <form id="task-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" name="title" required class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea name="description" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select name="status" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select name="priority" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Wallet (optional)</label>
                <select name="walletId" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">No wallet</option>
                    ${state.wallets.map(w => `<option value="${w.id}">${w.label}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <input type="date" name="dueDate" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div class="flex justify-end gap-2">
                <button type="button" onclick="hideModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
            </div>
        </form>
    `;
    showModal('Add Task', content);

    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const task = {
            id: generateId(),
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status'),
            priority: formData.get('priority'),
            walletId: formData.get('walletId') || null,
            dueDate: formData.get('dueDate') || null,
            completedAt: formData.get('status') === 'completed' ? new Date().toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.tasks.push(task);
        await saveJsonFile('tasks.json', { tasks: state.tasks });
        await logActivity('task_created', `Created task: ${task.title}`, task.id);
        hideModal();
        renderAll();
    });
}

async function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const content = `
        <form id="task-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" name="title" required value="${task.title}" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea name="description" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">${task.description || ''}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select name="status" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select name="priority" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Wallet (optional)</label>
                <select name="walletId" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">No wallet</option>
                    ${state.wallets.map(w => `<option value="${w.id}" ${w.id === task.walletId ? 'selected' : ''}>${w.label}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <input type="date" name="dueDate" value="${task.dueDate || ''}" class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div class="flex justify-end gap-2">
                <button type="button" onclick="hideModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
            </div>
        </form>
    `;
    showModal('Edit Task', content);

    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const wasCompleted = task.status === 'completed';
        const isCompleted = formData.get('status') === 'completed';

        task.title = formData.get('title');
        task.description = formData.get('description');
        task.status = formData.get('status');
        task.priority = formData.get('priority');
        task.walletId = formData.get('walletId') || null;
        task.dueDate = formData.get('dueDate') || null;
        task.updatedAt = new Date().toISOString();

        if (isCompleted && !wasCompleted) {
            task.completedAt = new Date().toISOString();
        } else if (!isCompleted) {
            task.completedAt = null;
        }

        await saveJsonFile('tasks.json', { tasks: state.tasks });

        if (isCompleted && !wasCompleted) {
            await logActivity('task_completed', `Completed task: ${task.title}`, task.id);
        } else {
            await logActivity('task_updated', `Updated task: ${task.title}`, task.id);
        }

        hideModal();
        renderAll();
    });
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const task = state.tasks.find(t => t.id === id);
    state.tasks = state.tasks.filter(t => t.id !== id);
    await saveJsonFile('tasks.json', { tasks: state.tasks });
    await logActivity('task_deleted', `Deleted task: ${task?.title || 'Unknown'}`, id);
    renderAll();
}

async function updateTaskStatus(id, status) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const wasCompleted = task.status === 'completed';
    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (status === 'completed' && !wasCompleted) {
        task.completedAt = new Date().toISOString();
        await logActivity('task_completed', `Completed task: ${task.title}`, task.id);
    } else if (status !== 'completed') {
        task.completedAt = null;
    }

    await saveJsonFile('tasks.json', { tasks: state.tasks });
    renderAll();
}

// Event listeners
document.getElementById('select-folder-btn').addEventListener('click', selectFolder);
document.getElementById('add-wallet-btn').addEventListener('click', showAddWalletModal);
document.getElementById('add-task-btn').addEventListener('click', showAddTaskModal);
document.getElementById('modal-close').addEventListener('click', hideModal);
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') hideModal();
});

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
});

document.getElementById('filter-status').addEventListener('change', renderTasks);
document.getElementById('filter-priority').addEventListener('change', renderTasks);

// Initialize
showPage('dashboard');
```

- [ ] **Step 2: Verify JavaScript loads without errors**

Open the file in browser - should load without console errors.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: implement JavaScript application logic"
```

---

### Task 3: Test and Verify

- [ ] **Step 1: Open index.html in browser**

Verify:
- Dashboard shows 0 for all stats
- Navigation works between all 4 pages
- "Select Folder" button is visible

- [ ] **Step 2: Test wallet management**

1. Click "Select Folder" - create a new folder called "airdrop-data"
2. Click "+ Add Wallet" - fill form and save
3. Verify wallet appears in table
4. Test edit and delete

- [ ] **Step 3: Test task management**

1. Click "+ Add Task" - fill form and save
2. Verify task appears in table
3. Test status change via dropdown
4. Test edit and delete

- [ ] **Step 4: Verify dashboard updates**

- Stats should reflect actual data
- Completion rate should calculate correctly

- [ ] **Step 5: Verify activity logging**

- All CRUD operations should appear in activity history

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: complete airdrop manager with all features"
```

---

## Summary

This implementation creates a fully functional airdrop task manager with:
- Treasury (wallet management with CRUD)
- Task tracking (CRUD + status changes + filtering)
- Activity history (auto-logged)
- Dashboard (stats + completion rate)

The app uses the File System Access API to read/write JSON files in a user-selected folder.
