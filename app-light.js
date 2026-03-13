// ============================================
// DAO Dashboard - Light Theme
// ============================================

const state = {
    projects: [],
    activities: [],
    settings: {},
    folderHandle: null
};

function generateId() {
    return crypto.randomUUID();
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusColor(status) {
    const colors = {
        'Researching': { bg: '#f3f4f6', text: '#7c3aed', border: '#e5e7eb' },
        'Active': { bg: '#d1fae5', text: '#059669', border: '#d1fae5' },
        'Claimed': { bg: '#f3e8ff', text: '#9333ea', border: '#f3e8ff' },
        'Missed': { bg: '#fee2e2', text: '#dc2626', border: '#fee2e2' }
    };
    return colors[status] || colors['Researching'];
}

// File System
async function selectFolder() {
    try {
        state.folderHandle = await window.showDirectoryPicker();
        await loadData();
        renderAll();
        lucide.createIcons();
    } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
    }
}

async function loadData() {
    try {
        const pf = await state.folderHandle.getFileHandle('projects.json');
        state.projects = JSON.parse(await (await pf.getFile()).text()).projects || [];
    } catch { state.projects = []; save('projects.json', { projects: [] }); }

    try {
        const af = await state.folderHandle.getFileHandle('activities.json');
        state.activities = JSON.parse(await (await af.getFile()).text()).activities || [];
    } catch { state.activities = []; save('activities.json', { activities: [] }); }

    try {
        const sf = await state.folderHandle.getFileHandle('settings.json');
        state.settings = JSON.parse(await (await sf.getFile()).text());
    } catch { state.settings = {}; save('settings.json', state.settings); }
}

async function save(filename, data) {
    const wh = await state.folderHandle.getFileHandle(filename, { create: true });
    const w = await wh.createWritable();
    await w.write(JSON.stringify(data, null, 2));
    await w.close();
}

async function log(type, desc) {
    state.activities.unshift({ id: generateId(), type, desc, time: new Date().toISOString() });
    await save('activities.json', { activities: state.activities });
}

// Render
function renderAll() {
    renderTreasury();
    renderProjects();
    renderActivity();
    setTimeout(() => lucide.createIcons(), 100);
}

function renderTreasury() {
    let total = 0;
    state.activities.forEach(a => {
        if (a.type === 'deposit') total += a.amount || 0;
        else if (a.type === 'withdraw') total -= a.amount || 0;
    });
    document.getElementById('total-balance').textContent = '$' + total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('project-count').textContent = state.projects.length;
}

function renderProjects() {
    const container = document.getElementById('projects-list');
    if (state.projects.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm py-4 text-center">No projects yet</p>';
        return;
    }
    container.innerHTML = state.projects.map(p => {
        const colors = getStatusColor(p.status);
        return `
        <div class="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">${p.name.charAt(0).toUpperCase()}</div>
                <div>
                    <p class="font-semibold text-slate-900">${p.name}</p>
                    <p class="text-xs text-slate-500">${p.status} • ${p.tasksDone}/${p.totalTasks} tasks</p>
                </div>
            </div>
            <div class="flex items-center gap-1">
                <span class="px-2.5 py-1 rounded-lg text-xs font-medium" style="background: ${colors.bg}; color: ${colors.text};">${p.status}</span>
                <button onclick="editProject('${p.id}')" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteProject('${p.id}')" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `}).join('');
}

function renderActivity() {
    const container = document.getElementById('activity-feed');
    if (state.activities.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm py-4 text-center">No activity yet</p>';
        return;
    }

    const icons = {
        'deposit': { icon: 'arrow-down-left', color: 'text-emerald-600', bg: 'bg-emerald-100' },
        'withdraw': { icon: 'arrow-up-right', color: 'text-rose-600', bg: 'bg-rose-100' },
        'transfer': { icon: 'repeat', color: 'text-amber-600', bg: 'bg-amber-100' },
        'project_added': { icon: 'plus-circle', color: 'text-indigo-600', bg: 'bg-indigo-100' },
        'project_updated': { icon: 'edit-3', color: 'text-indigo-600', bg: 'bg-indigo-100' },
        'project_deleted': { icon: 'trash-2', color: 'text-rose-600', bg: 'bg-rose-100' },
    };

    container.innerHTML = state.activities.map(a => {
        const iconData = icons[a.type] || { icon: 'circle', color: 'text-slate-400', bg: 'bg-slate-100' };
        return `
        <div class="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition">
            <div class="w-9 h-9 rounded-lg ${iconData.bg} flex items-center justify-center flex-shrink-0">
                <i data-lucide="${iconData.icon}" class="w-4 h-4 ${iconData.color}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-700 truncate">${a.desc}</p>
                <p class="text-xs text-slate-400 mt-0.5">${formatDate(a.time)}</p>
            </div>
        </div>
    `}).join('');
}

// Modals
function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').classList.add('flex');
    setTimeout(() => lucide.createIcons(), 50);
}

function hideModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal').classList.remove('flex');
}

// Projects
function showAddProjectModal() {
    showModal('Add Project', `
        <form onsubmit="saveProject(event)">
            <div class="mb-4">
                <label class="block text-sm text-slate-600 mb-2">Project Name</label>
                <input type="text" id="proj-name" placeholder="e.g. Uniswap, LayerZero" required class="input">
            </div>
            <div class="mb-4">
                <label class="block text-sm text-slate-600 mb-2">Status</label>
                <select id="proj-status" class="input">
                    <option value="Researching">Researching</option>
                    <option value="Active">Active</option>
                    <option value="Claimed">Claimed</option>
                    <option value="Missed">Missed</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <label class="block text-sm text-slate-600 mb-2">Total Tasks</label>
                    <input type="number" id="proj-total" value="0" class="input">
                </div>
                <div>
                    <label class="block text-sm text-slate-600 mb-2">Done</label>
                    <input type="number" id="proj-done" value="0" class="input">
                </div>
            </div>
            <div class="flex gap-3">
                <button type="button" onclick="hideModal()" class="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" class="btn btn-primary flex-1">Save</button>
            </div>
        </form>
    `);
}

async function saveProject(e) {
    e.preventDefault();
    const project = {
        id: generateId(),
        name: document.getElementById('proj-name').value,
        status: document.getElementById('proj-status').value,
        totalTasks: parseInt(document.getElementById('proj-total').value) || 0,
        tasksDone: parseInt(document.getElementById('proj-done').value) || 0,
        createdAt: new Date().toISOString()
    };
    state.projects.push(project);
    await save('projects.json', { projects: state.projects });
    await log('project_added', `Added project: ${project.name}`);
    hideModal();
    renderAll();
}

async function deleteProject(id) {
    if (!confirm('Delete this project?')) return;
    const p = state.projects.find(x => x.id === id);
    state.projects = state.projects.filter(x => x.id !== id);
    await save('projects.json', { projects: state.projects });
    await log('project_deleted', `Deleted project: ${p?.name}`);
    renderAll();
}

function editProject(id) {
    const p = state.projects.find(x => x.id === id);
    if (!p) return;
    showModal('Edit Project', `
        <form onsubmit="updateProject(event, '${id}')">
            <div class="mb-4">
                <label class="block text-sm text-slate-600 mb-2">Project Name</label>
                <input type="text" id="proj-name" value="${p.name}" required class="input">
            </div>
            <div class="mb-4">
                <label class="block text-sm text-slate-600 mb-2">Status</label>
                <select id="proj-status" class="input">
                    <option value="Researching" ${p.status === 'Researching' ? 'selected' : ''}>Researching</option>
                    <option value="Active" ${p.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Claimed" ${p.status === 'Claimed' ? 'selected' : ''}>Claimed</option>
                    <option value="Missed" ${p.status === 'Missed' ? 'selected' : ''}>Missed</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <label class="block text-sm text-slate-600 mb-2">Total Tasks</label>
                    <input type="number" id="proj-total" value="${p.totalTasks}" class="input">
                </div>
                <div>
                    <label class="block text-sm text-slate-600 mb-2">Done</label>
                    <input type="number" id="proj-done" value="${p.tasksDone}" class="input">
                </div>
            </div>
            <div class="flex gap-3">
                <button type="button" onclick="hideModal()" class="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" class="btn btn-primary flex-1">Save</button>
            </div>
        </form>
    `);
}

async function updateProject(e, id) {
    e.preventDefault();
    const p = state.projects.find(x => x.id === id);
    if (!p) return;
    p.name = document.getElementById('proj-name').value;
    p.status = document.getElementById('proj-status').value;
    p.totalTasks = parseInt(document.getElementById('proj-total').value) || 0;
    p.tasksDone = parseInt(document.getElementById('proj-done').value) || 0;
    await save('projects.json', { projects: state.projects });
    await log('project_updated', `Updated project: ${p.name}`);
    hideModal();
    renderAll();
}

// Settings
function showSettingsModal() {
    showModal('Settings', `
        <form onsubmit="saveSettings(event)">
            <div class="mb-4">
                <label class="block text-sm text-slate-600 mb-2">Binance API Key (Watch-Only)</label>
                <input type="text" id="binance-api-key" value="${state.settings.binanceApiKey || ''}" placeholder="Enter API key" class="input">
                <p class="text-xs text-slate-400 mt-2">Create a watch-only API from your Binance account settings</p>
            </div>
            <div class="flex gap-3">
                <button type="button" onclick="hideModal()" class="btn btn-secondary flex-1">Cancel</button>
                <button type="button" onclick="fetchBinanceBalance()" class="btn flex-1" style="background: #059669; color: white;">Fetch</button>
                <button type="submit" class="btn btn-primary flex-1">Save</button>
            </div>
        </form>
    `);
}

async function saveSettings(e) {
    e.preventDefault();
    state.settings.binanceApiKey = document.getElementById('binance-api-key').value;
    await save('settings.json', state.settings);
    await log('settings', 'Settings saved');
    hideModal();
}

async function fetchBinanceBalance() {
    const apiKey = document.getElementById('binance-api-key').value;
    if (!apiKey) {
        alert('Please enter a Binance API key');
        return;
    }
    try {
        const res = await fetch(`https://api.binance.com/api/v3/account`, {
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        if (!res.ok) throw new Error('API request failed');
        const data = await res.json();
        const total = data.balances.reduce((sum, b) => sum + (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0), 0);
        alert(`Total BNB: ${total.toFixed(8)}\n\nNote: Add manually to track USD value`);
    } catch (err) {
        alert('Failed to fetch. Check API key and try again.');
    }
}

// Activity
function showAddActivityModal() {
    const today = new Date().toISOString().split('T')[0];
    showModal('Add Activity', `
        <form onsubmit="saveActivity(event)">
            <div class="mb-4">
                <label class="block text-sm text-slate-600 mb-2">Type</label>
                <select id="act-type" class="input">
                    <option value="deposit">Deposit</option>
                    <option value="withdraw">Withdraw</option>
                    <option value="transfer">Transfer</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <label class="block text-sm text-slate-600 mb-2">Amount</label>
                    <input type="number" id="act-amount" step="0.0001" required class="input" placeholder="0.00">
                </div>
                <div>
                    <label class="block text-sm text-slate-600 mb-2">Token</label>
                    <input type="text" id="act-token" required class="input" placeholder="ETH, BNB...">
                </div>
            </div>
            <div class="mb-4">
                <label class="block text-sm text-slate-600 mb-2">Date</label>
                <input type="date" id="act-date" value="${today}" required class="input">
            </div>
            <div class="mb-4">
                <label class="block text-sm text-slate-600 mb-2">Notes</label>
                <textarea id="act-notes" rows="2" class="input" placeholder="Optional notes..."></textarea>
            </div>
            <div class="flex gap-3">
                <button type="button" onclick="hideModal()" class="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" class="btn btn-primary flex-1">Save</button>
            </div>
        </form>
    `);
}

async function saveActivity(e) {
    e.preventDefault();
    const type = document.getElementById('act-type').value;
    const amount = parseFloat(document.getElementById('act-amount').value) || 0;
    const token = document.getElementById('act-token').value;
    const date = document.getElementById('act-date').value;
    const notes = document.getElementById('act-notes').value;

    const icons = { deposit: '↓', withdraw: '↑', transfer: '⇄' };
    const desc = `${icons[type]} ${amount} ${token}${notes ? ' - ' + notes : ''}`;

    state.activities.unshift({
        id: generateId(),
        type,
        amount,
        token,
        desc,
        time: date + 'T00:00:00.000Z'
    });

    await save('activities.json', { activities: state.activities });
    await log(type, `${type === 'deposit' ? 'Deposited' : type === 'withdraw' ? 'Withdrew' : 'Transferred'} ${amount} ${token}`);
    hideModal();
    renderAll();
}

// Init
window.showAddProjectModal = showAddProjectModal;
window.showAddActivityModal = showAddActivityModal;
window.showSettingsModal = showSettingsModal;
window.selectFolder = selectFolder;
window.hideModal = hideModal;
window.saveProject = saveProject;
window.editProject = editProject;
window.updateProject = updateProject;
window.deleteProject = deleteProject;
window.saveSettings = saveSettings;
window.saveActivity = saveActivity;
window.fetchBinanceBalance = fetchBinanceBalance;
