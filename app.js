// ============================================
// DAO Dashboard - Simplified App
// ============================================

const state = {
    wallets: [],
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
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatAddress(addr) {
    if (!addr) return '-';
    return addr.substring(0, 6) + '...' + addr.slice(-4);
}

// File System
async function selectFolder() {
    try {
        state.folderHandle = await window.showDirectoryPicker();
        await loadData();
        renderAll();
    } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
    }
}

async function loadData() {
    const defaults = { wallets: [], projects: [], activities: [], settings: {} };
    try {
        const wf = await state.folderHandle.getFileHandle('wallets.json');
        state.wallets = JSON.parse(await (await wf.getFile()).text()).wallets || [];
    } catch { state.wallets = []; save('wallets.json', { wallets: [] }); }

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
    renderWallets();
    renderActivity();
}

function renderTreasury() {
    const total = state.wallets.reduce((sum, w) => sum + (parseFloat(w.balance) || 0), 0);
    document.getElementById('total-balance').textContent = '$' + total.toLocaleString();
    document.getElementById('wallet-count').textContent = state.wallets.length;
}

function renderProjects() {
    const container = document.getElementById('projects-list');
    if (state.projects.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No projects yet</p>';
        return;
    }
    container.innerHTML = state.projects.map(p => `
        <div class="flex items-center justify-between p-3 bg-[#1a1a21] rounded-xl hover:bg-[#202029] transition">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">${p.name.charAt(0)}</div>
                <div>
                    <p class="font-medium">${p.name}</p>
                    <p class="text-xs text-gray-500">${p.status} • ${p.tasksDone}/${p.totalTasks} tasks</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editProject('${p.id}')" class="text-gray-500 hover:text-indigo-400">✎</button>
                <button onclick="deleteProject('${p.id}')" class="text-gray-500 hover:text-rose-400">×</button>
            </div>
        </div>
    `).join('');
}

function renderWallets() {
    const tbody = document.getElementById('wallets-table');
    if (state.wallets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-gray-500">No wallets</td></tr>';
        return;
    }
    tbody.innerHTML = state.wallets.map(w => `
        <tr class="border-t border-gray-800">
            <td class="py-3 font-medium">${w.label}</td>
            <td class="py-3"><code class="text-indigo-400">${formatAddress(w.address)}</code></td>
            <td class="py-3 text-gray-400">${w.network || '-'}</td>
            <td class="py-3 text-right text-emerald-400">$${parseFloat(w.balance || 0).toLocaleString()}</td>
            <td class="py-3 text-right">
                <button onclick="deleteWallet('${w.id}')" class="text-gray-500 hover:text-rose-400">×</button>
            </td>
        </tr>
    `).join('');
}

function renderActivity() {
    const container = document.getElementById('activity-feed');
    if (state.activities.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No activity yet</p>';
        return;
    }
    container.innerHTML = state.activities.map(a => `
        <div class="flex gap-3 py-2 border-b border-gray-800 last:border-0">
            <div class="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
            <div>
                <p class="text-sm">${a.desc}</p>
                <p class="text-xs text-gray-500">${formatDate(a.time)}</p>
            </div>
        </div>
    `).join('');
}

// Modals
function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').classList.add('flex');
}

function hideModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal').classList.remove('flex');
}

// Settings
function showSettingsModal() {
    showModal('Settings', `
        <form onsubmit="saveSettings(event)">
            <div class="mb-4">
                <label class="block text-sm text-gray-400 mb-2">Binance Watch-Only API Key</label>
                <input type="text" id="binance-api-key" value="${state.settings.binanceApiKey || ''}" placeholder="Enter API key" class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 text-white">
                <p class="text-xs text-gray-500 mt-1">Create a watch-only API from Binance account</p>
            </div>
            <div class="flex gap-2">
                <button type="button" onclick="hideModal()" class="flex-1 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Cancel</button>
                <button type="button" onclick="fetchBinanceBalance()" class="flex-1 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500">Fetch Balance</button>
                <button type="submit" class="flex-1 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500">Save</button>
            </div>
        </form>
    `);
}

async function saveSettings(e) {
    e.preventDefault();
    state.settings.binanceApiKey = document.getElementById('binance-api-key').value;
    await save('settings.json', state.settings);
    await log('settings_updated', 'Settings saved');
    hideModal();
}

async function fetchBinanceBalance() {
    const apiKey = document.getElementById('binance-api-key').value;
    if (!apiKey) {
        alert('Please enter a Binance API key');
        return;
    }
    try {
        const res = await fetch(`https://api.binance.com/api/v3/account?recvWindow=5000`, {
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        if (!res.ok) throw new Error('API request failed');
        const data = await res.json();
        const total = data.balances.reduce((sum, b) => {
            const free = parseFloat(b.free) || 0;
            const locked = parseFloat(b.locked) || 0;
            return sum + free + locked;
        }, 0);
        alert(`Total balance: ${total.toFixed(8)} BNB (estimated value not included)`);
    } catch (err) {
        alert('Failed to fetch balance. Check API key and try again.');
    }
}

// Activity
function showAddActivityModal() {
    showModal('Add Activity', `
        <form onsubmit="saveActivity(event)">
            <select id="act-type" class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdraw</option>
                <option value="transfer">Transfer</option>
            </select>
            <input type="number" id="act-amount" placeholder="Amount" step="0.0001" required class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
            <input type="text" id="act-token" placeholder="Token (e.g. ETH, BNB)" required class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
            <input type="date" id="act-date" required class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
            <textarea id="act-notes" placeholder="Notes (optional)" rows="2" class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white"></textarea>
            <div class="flex gap-2">
                <button type="button" onclick="hideModal()" class="flex-1 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Cancel</button>
                <button type="submit" class="flex-1 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500">Save</button>
            </div>
        </form>
    `);
}

async function saveActivity(e) {
    e.preventDefault();
    const type = document.getElementById('act-type').value;
    const amount = document.getElementById('act-amount').value;
    const token = document.getElementById('act-token').value;
    const date = document.getElementById('act-date').value;
    const notes = document.getElementById('act-notes').value;

    const icons = { deposit: '↓', withdraw: '↑', transfer: '⇄' };
    const desc = `${icons[type]} ${amount} ${token}${notes ? ' - ' + notes : ''}`;

    state.activities.unshift({
        id: generateId(),
        type: 'manual',
        desc,
        time: date + 'T00:00:00.000Z'
    });

    await save('activities.json', { activities: state.activities });
    await log('activity_added', `Added ${type}: ${amount} ${token}`);
    hideModal();
    renderActivity();
}

// Projects
function showAddProjectModal() {
    showModal('Add Project', `
        <form onsubmit="saveProject(event)">
            <input type="text" id="proj-name" placeholder="Project name" required class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
            <select id="proj-status" class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
                <option value="Researching">Researching</option>
                <option value="Active">Active</option>
                <option value="Claimed">Claimed</option>
                <option value="Missed">Missed</option>
            </select>
            <div class="flex gap-2">
                <button type="button" onclick="hideModal()" class="flex-1 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Cancel</button>
                <button type="submit" class="flex-1 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500">Save</button>
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
        totalTasks: 0,
        tasksDone: 0,
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
            <input type="text" id="proj-name" value="${p.name}" required class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
            <select id="proj-status" class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
                <option value="Researching" ${p.status === 'Researching' ? 'selected' : ''}>Researching</option>
                <option value="Active" ${p.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Claimed" ${p.status === 'Claimed' ? 'selected' : ''}>Claimed</option>
                <option value="Missed" ${p.status === 'Missed' ? 'selected' : ''}>Missed</option>
            </select>
            <div class="grid grid-cols-2 gap-2 mb-3">
                <input type="number" id="proj-total" value="${p.totalTasks}" class="bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder="Total tasks">
                <input type="number" id="proj-done" value="${p.tasksDone}" class="bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder="Done">
            </div>
            <div class="flex gap-2">
                <button type="button" onclick="hideModal()" class="flex-1 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Cancel</button>
                <button type="submit" class="flex-1 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500">Save</button>
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

// Wallets
function showAddWalletModal() {
    showModal('Add Wallet', `
        <form onsubmit="saveWallet(event)">
            <input type="text" id="w-label" placeholder="Label" required class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
            <input type="text" id="w-address" placeholder="Address" required class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
            <input type="text" id="w-network" placeholder="Network (e.g. Ethereum)" class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
            <input type="number" id="w-balance" placeholder="Balance (USD)" step="0.01" class="w-full bg-[#1a1a21] border border-gray-700 rounded-lg px-4 py-2 mb-3 text-white">
            <div class="flex gap-2">
                <button type="button" onclick="hideModal()" class="flex-1 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Cancel</button>
                <button type="submit" class="flex-1 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500">Save</button>
            </div>
        </form>
    `);
}

async function saveWallet(e) {
    e.preventDefault();
    const wallet = {
        id: generateId(),
        label: document.getElementById('w-label').value,
        address: document.getElementById('w-address').value,
        network: document.getElementById('w-network').value,
        balance: document.getElementById('w-balance').value || 0,
        createdAt: new Date().toISOString()
    };
    state.wallets.push(wallet);
    await save('wallets.json', { wallets: state.wallets });
    await log('wallet_added', `Added wallet: ${wallet.label}`);
    hideModal();
    renderAll();
}

async function deleteWallet(id) {
    if (!confirm('Delete this wallet?')) return;
    const w = state.wallets.find(x => x.id === id);
    state.wallets = state.wallets.filter(x => x.id !== id);
    await save('wallets.json', { wallets: state.wallets });
    await log('wallet_deleted', `Deleted wallet: ${w?.label}`);
    renderAll();
}

// Init
window.showAddProjectModal = showAddProjectModal;
window.showAddWalletModal = showAddWalletModal;
window.showAddActivityModal = showAddActivityModal;
window.showSettingsModal = showSettingsModal;
window.selectFolder = selectFolder;
window.hideModal = hideModal;
window.saveProject = saveProject;
window.saveWallet = saveWallet;
window.editProject = editProject;
window.updateProject = updateProject;
window.deleteProject = deleteProject;
window.deleteWallet = deleteWallet;
window.saveSettings = saveSettings;
window.saveActivity = saveActivity;
window.fetchBinanceBalance = fetchBinanceBalance;
