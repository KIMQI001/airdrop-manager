// ============================================
// DAO 仪表盘 - 高端中文版
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
    return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusClass(status) {
    const classes = {
        'Researching': 'status-researching',
        'Active': 'status-active',
        'Claimed': 'status-claimed',
        'Missed': 'status-missed'
    };
    return classes[status] || 'status-researching';
}

function getStatusText(status) {
    const texts = {
        'Researching': '研究中',
        'Active': '进行中',
        'Claimed': '已领取',
        'Missed': '已错过'
    };
    return texts[status] || status;
}

// 文件系统
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

// 渲染
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
        container.innerHTML = '<p class="text-slate-400 text-sm py-8 text-center">暂无项目</p>';
        return;
    }
    container.innerHTML = state.projects.map(p => `
        <div class="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-md">${p.name.charAt(0).toUpperCase()}</div>
                <div>
                    <p class="font-semibold text-slate-900 text-base">${p.name}</p>
                    <p class="text-xs text-slate-500">${getStatusText(p.status)} • ${p.tasksDone}/${p.totalTasks} 任务</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="status-badge ${getStatusClass(p.status)}">${getStatusText(p.status)}</span>
                <button onclick="editProject('${p.id}')" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteProject('${p.id}')" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderActivity() {
    const container = document.getElementById('activity-feed');
    if (state.activities.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm py-8 text-center">暂无活动</p>';
        return;
    }

    const icons = {
        'deposit': { icon: 'arrow-down-left', color: 'text-emerald-500', bg: 'bg-emerald-100' },
        'withdraw': { icon: 'arrow-up-right', color: 'text-rose-500', bg: 'bg-rose-100' },
        'transfer': { icon: 'repeat', color: 'text-amber-500', bg: 'bg-amber-100' },
        'project_added': { icon: 'plus-circle', color: 'text-indigo-500', bg: 'bg-indigo-100' },
        'project_updated': { icon: 'edit-3', color: 'text-indigo-500', bg: 'bg-indigo-100' },
        'project_deleted': { icon: 'trash-2', color: 'text-rose-500', bg: 'bg-rose-100' },
    };

    container.innerHTML = state.activities.map(a => {
        const iconData = icons[a.type] || { icon: 'circle', color: 'text-slate-400', bg: 'bg-slate-100' };
        return `
        <div class="flex items-start gap-4 p-3.5 rounded-xl hover:bg-slate-50 transition">
            <div class="w-10 h-10 rounded-xl ${iconData.bg} flex items-center justify-center flex-shrink-0">
                <i data-lucide="${iconData.icon}" class="w-5 h-5 ${iconData.color}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-700">${a.desc}</p>
                <p class="text-xs text-slate-400 mt-1">${formatDate(a.time)}</p>
            </div>
        </div>
    `}).join('');
}

// 弹窗
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

// 项目
function showAddProjectModal() {
    showModal('添加项目', `
        <form onsubmit="saveProject(event)">
            <div class="mb-5">
                <label class="block text-sm font-medium text-slate-600 mb-2">项目名称</label>
                <input type="text" id="proj-name" placeholder="例如：Uniswap、LayerZero" required class="input">
            </div>
            <div class="mb-5">
                <label class="block text-sm font-medium text-slate-600 mb-2">状态</label>
                <select id="proj-status" class="input">
                    <option value="Researching">研究中</option>
                    <option value="Active">进行中</option>
                    <option value="Claimed">已领取</option>
                    <option value="Missed">已错过</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-2">总任务数</label>
                    <input type="number" id="proj-total" value="0" class="input">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-2">已完成</label>
                    <input type="number" id="proj-done" value="0" class="input">
                </div>
            </div>
            <div class="flex gap-3">
                <button type="button" onclick="hideModal()" class="btn btn-secondary flex-1">取消</button>
                <button type="submit" class="btn btn-primary flex-1">保存</button>
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
    await log('project_added', `添加项目：${project.name}`);
    hideModal();
    renderAll();
}

async function deleteProject(id) {
    if (!confirm('确定删除此项目？')) return;
    const p = state.projects.find(x => x.id === id);
    state.projects = state.projects.filter(x => x.id !== id);
    await save('projects.json', { projects: state.projects });
    await log('project_deleted', `删除项目：${p?.name}`);
    renderAll();
}

function editProject(id) {
    const p = state.projects.find(x => x.id === id);
    if (!p) return;
    showModal('编辑项目', `
        <form onsubmit="updateProject(event, '${id}')">
            <div class="mb-5">
                <label class="block text-sm font-medium text-slate-600 mb-2">项目名称</label>
                <input type="text" id="proj-name" value="${p.name}" required class="input">
            </div>
            <div class="mb-5">
                <label class="block text-sm font-medium text-slate-600 mb-2">状态</label>
                <select id="proj-status" class="input">
                    <option value="Researching" ${p.status === 'Researching' ? 'selected' : ''}>研究中</option>
                    <option value="Active" ${p.status === 'Active' ? 'selected' : ''}>进行中</option>
                    <option value="Claimed" ${p.status === 'Claimed' ? 'selected' : ''}>已领取</option>
                    <option value="Missed" ${p.status === 'Missed' ? 'selected' : ''}>已错过</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-2">总任务数</label>
                    <input type="number" id="proj-total" value="${p.totalTasks}" class="input">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-2">已完成</label>
                    <input type="number" id="proj-done" value="${p.tasksDone}" class="input">
                </div>
            </div>
            <div class="flex gap-3">
                <button type="button" onclick="hideModal()" class="btn btn-secondary flex-1">取消</button>
                <button type="submit" class="btn btn-primary flex-1">保存</button>
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
    await log('project_updated', `更新项目：${p.name}`);
    hideModal();
    renderAll();
}

// 设置
function showSettingsModal() {
    showModal('设置', `
        <form onsubmit="saveSettings(event)">
            <div class="mb-5">
                <label class="block text-sm font-medium text-slate-600 mb-2">Binance API 密钥（仅查看）</label>
                <input type="text" id="binance-api-key" value="${state.settings.binanceApiKey || ''}" placeholder="输入 API 密钥" class="input">
                <p class="text-xs text-slate-400 mt-2">请从 Binance 账户设置创建仅查看权限的 API</p>
            </div>
            <div class="flex gap-3">
                <button type="button" onclick="hideModal()" class="btn btn-secondary flex-1">取消</button>
                <button type="button" onclick="fetchBinanceBalance()" class="btn flex-1" style="background: #10b981; color: white;">获取余额</button>
                <button type="submit" class="btn btn-primary flex-1">保存</button>
            </div>
        </form>
    `);
}

async function saveSettings(e) {
    e.preventDefault();
    state.settings.binanceApiKey = document.getElementById('binance-api-key').value;
    await save('settings.json', state.settings);
    await log('settings', '设置已保存');
    hideModal();
}

async function fetchBinanceBalance() {
    const apiKey = document.getElementById('binance-api-key').value;
    if (!apiKey) {
        alert('请输入 Binance API 密钥');
        return;
    }
    try {
        const res = await fetch(`https://api.binance.com/api/v3/account`, {
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        if (!res.ok) throw new Error('API 请求失败');
        const data = await res.json();
        const total = data.balances.reduce((sum, b) => sum + (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0), 0);
        alert(`BNB 总计：${total.toFixed(8)}\n\n注：需手动添加 USD 价值`);
    } catch (err) {
        alert('获取失败，请检查 API 密钥');
    }
}

// 活动
function showAddActivityModal() {
    const today = new Date().toISOString().split('T')[0];
    showModal('添加活动', `
        <form onsubmit="saveActivity(event)">
            <div class="mb-5">
                <label class="block text-sm font-medium text-slate-600 mb-2">类型</label>
                <select id="act-type" class="input">
                    <option value="deposit">存入</option>
                    <option value="withdraw">取出</option>
                    <option value="transfer">转账</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-5">
                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-2">数量</label>
                    <input type="number" id="act-amount" step="0.0001" required class="input" placeholder="0.00">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-2">代币</label>
                    <input type="text" id="act-token" required class="input" placeholder="ETH、BNB...">
                </div>
            </div>
            <div class="mb-5">
                <label class="block text-sm font-medium text-slate-600 mb-2">日期</label>
                <input type="date" id="act-date" value="${today}" required class="input">
            </div>
            <div class="mb-5">
                <label class="block text-sm font-medium text-slate-600 mb-2">备注</label>
                <textarea id="act-notes" rows="2" class="input" placeholder="可选备注..."></textarea>
            </div>
            <div class="flex gap-3">
                <button type="button" onclick="hideModal()" class="btn btn-secondary flex-1">取消</button>
                <button type="submit" class="btn btn-primary flex-1">保存</button>
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

    const typeText = { deposit: '存入', withdraw: '取出', transfer: '转账' };
    await log(type, `${typeText[type]} ${amount} ${token}`);

    hideModal();
    renderAll();
}

// 初始化
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
