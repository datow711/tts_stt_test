// js/ui.js

const gridContainer = document.getElementById('grid-container');
const passwordModal = document.getElementById('password-modal');
const sttResultModal = document.getElementById('stt-result-modal');

function showPasswordModal() {
    passwordModal.style.display = 'block';
}

function hidePasswordModal() {
    passwordModal.style.display = 'none';
}

function showSTTResultModal(result) {
    const resultText = document.getElementById('stt-result-text');
    if (result && result.tl) {
        resultText.textContent = `台羅: ${result.tl}`;
    } else if (result === '<{silent}>') {
        resultText.textContent = '辨識結果：靜音';
    } else {
        resultText.textContent = '辨識失敗或無有效結果。';
    }
    sttResultModal.style.display = 'block';
}

function hideSTTResultModal() {
    sttResultModal.style.display = 'none';
}

function renderGrid(data, results, state) {
    // 移除舊表格
    gridContainer.innerHTML = '';

    if (!data || data.length === 0) {
        gridContainer.textContent = '無法載入資料。';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // 建立表頭
    const headerRow = document.createElement('tr');
    const headers = ['韻母組', '聲母', '基底', 'T1', 'T2', 'T3', 'T4', 'T5', 'T7', 'T8', 'T9'];
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // 建立表格內容
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // 韻母組, 聲母, 基底
        ['rime_group', 'initial', 'base'].forEach(key => {
            const cell = document.createElement('td');
            cell.textContent = item[key] || '—';
            row.appendChild(cell);
        });

        // 聲調 1-9
        const tones = ['1', '2', '3', '4', '5', '7', '8', '9'];
        tones.forEach(tone => {
            const td = document.createElement('td');
            const toneKey = `tone${tone}`;
            const toneNumKey = `tone${tone}_num`;
            const syllable = item[toneKey];
            const syllableNum = item[toneNumKey];

            if (syllable) {
                const cellId = `${item.base}-${tone}`;
                const result = results.find(r => r.id === cellId)?.status;
                const isAdmin = state.view === 'admin';

                let actionButtonHtml = '';
                if (state.mode === 'tts') {
                    actionButtonHtml = `<button class="tts-play-btn" data-syllable="${syllableNum}">播放</button>`;
                } else { // stt
                    actionButtonHtml = `<button class="stt-record-btn" data-cell-id="${cellId}">錄音</button>`;
                }

                td.innerHTML = `
                    <div class="cell-content">
                        <span class="syllable">${syllable} (${syllableNum})</span>
                        <div class="cell-actions">
                            ${actionButtonHtml}
                        </div>
                        <div 
                            class="status-marker ${result ? `tested-${result}` : ''} ${isAdmin ? 'admin-mode' : ''}" 
                            data-id="${cellId}"
                            title="${isAdmin ? '點擊切換狀態' : '測試結果'}"
                        >
                            ${result === 'o' ? 'O' : (result === 'x' ? 'X' : (result === 'na' ? '不存在' : '未測試'))}
                        </div>
                    </div>
                `;
            } else {
                td.textContent = '—';
                td.classList.add('disabled');
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    gridContainer.appendChild(table);
}

function updateCellStatus(cellId, status) {
    const marker = document.querySelector(`.status-marker[data-id="${cellId}"]`);
    if (marker) {
        // Reset classes first, keeping the base classes
        const isAdmin = marker.classList.contains('admin-mode');
        marker.className = 'status-marker' + (isAdmin ? ' admin-mode' : '');

        if (status === 'o') {
            marker.textContent = 'O';
            marker.classList.add('tested-o');
        } else if (status === 'x') {
            marker.textContent = 'X';
            marker.classList.add('tested-x');
        } else if (status === 'na') {
            marker.textContent = '不存在';
            marker.classList.add('tested-na');
        } else {
            marker.textContent = '未測試';
        }
    }
}

// 更多 UI 更新函式...
