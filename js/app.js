document.addEventListener('DOMContentLoaded', () => {
    const state = {
        mode: 'tts', // 'tts' or 'stt'
        view: 'guest', // 'admin' or 'guest'
        data: [],
        results: [], // { id: 'ka-1', status: 'o'/'x' }
        isAuthenticated: false,
        mediaRecorder: null,
        audioChunks: [],
        rimeGroups: [],
        currentRimeGroup: 'all', // Default to 'all'
        initials: [],
        currentInitial: 'all', // Default to 'all'
    };

    // --- DOM Elements ---
    const ttsModeBtn = document.getElementById('tts-mode-btn');
    const sttModeBtn = document.getElementById('stt-mode-btn');
    const rimeFilterInput = document.getElementById('rime-filter-input');
    const rimeSelect = document.getElementById('rime-select');
    const initialSelect = document.getElementById('initial-select');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordError = document.getElementById('password-error');
    const sttResultClose = document.getElementById('stt-result-close');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    // --- Initialization ---
    async function initialize() {
        state.results = await loadAllData();
        await loadGridData();
        setupRimeFilter();
        setupInitialFilter();
        addEventListeners();
        addGridActionListeners(); // Moved here
        handleRouting(); // First route handling and render
    }

    // --- Data Loading ---
    async function loadGridData() {
        try {
            const response = await fetch('data/syllable_tone_grid_v5.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            let data = await response.json();

            // 清理資料：根據入聲規則 (p, t, k, h 結尾) 調整聲調
            const enteringToneEndings = ['p', 't', 'k', 'h'];
            data.forEach(item => {
                const isEnteringTone = enteringToneEndings.some(ending => item.base.endsWith(ending));
                
                if (isEnteringTone) {
                    // 是入聲，只保留 T4, T8
                    ['1', '2', '3', '5', '7', '9'].forEach(tone => {
                        item[`tone${tone}`] = null;
                        item[`tone${tone}_num`] = null;
                    });
                } else {
                    // 不是入聲，清空 T4, T8
                    ['4', '8'].forEach(tone => {
                        item[`tone${tone}`] = null;
                        item[`tone${tone}_num`] = null;
                    });
                }
            });

            // 根據 CSV 的聲母順序進行排序
            const initialOrder = ["", "p", "ph", "m", "b", "t", "th", "n", "l", "k", "kh", "ng", "g", "h", "ts", "tsh", "s", "j"];
            
            data.sort((a, b) => {
                // 首先比較 rime_group
                if (a.rime_group < b.rime_group) return -1;
                if (a.rime_group > b.rime_group) return 1;

                // rime_group 相同時，比較 initial 的順序
                const indexA = initialOrder.indexOf(a.initial);
                const indexB = initialOrder.indexOf(b.initial);

                return indexA - indexB;
            });

            state.data = data;
            const uniqueRimeGroups = [...new Set(data.map(item => item.rime_group))];
            state.rimeGroups = ['all', ...uniqueRimeGroups]; // Add 'all' option
            // state.currentRimeGroup is already defaulted to 'all'

            // Extract and sort initials
            const uniqueInitials = [...new Set(data.map(item => item.initial))];
            uniqueInitials.sort((a, b) => initialOrder.indexOf(a) - initialOrder.indexOf(b));
            state.initials = ['all', ...uniqueInitials]; // Add 'all' option

        } catch (error) {
            console.error('Failed to load grid data:', error);
        }
    }

    // --- Rime Filter ---
    function setupRimeFilter() {
        updateRimeSelectOptions(state.rimeGroups);
        rimeSelect.value = state.currentRimeGroup;
    }

    function updateRimeSelectOptions(groups) {
        rimeSelect.innerHTML = '';
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group === 'all' ? '全部' : group;
            rimeSelect.appendChild(option);
        });
    }

    // --- Initial Filter ---
    function setupInitialFilter() {
        updateInitialSelectOptions(state.initials);
        initialSelect.value = state.currentInitial;
    }

    function updateInitialSelectOptions(initials) {
        initialSelect.innerHTML = '';
        initials.forEach(initial => {
            const option = document.createElement('option');
            option.value = initial;
            if (initial === 'all') {
                option.textContent = '全部';
            } else if (initial === '') {
                option.textContent = '無聲母';
            } else {
                option.textContent = initial;
            }
            initialSelect.appendChild(option);
        });
    }

    // --- Routing ---
    function handleRouting() {
        const hash = window.location.hash || '#/tts/results';
        const [_, mode, view] = hash.split('/');

        state.mode = (mode === 'stt') ? 'stt' : 'tts';
        state.view = (view === 'admin') ? 'admin' : 'results';

        updateActiveModeButtons();
        updateAdminButton(); // Update button text and behavior

        // Centralized logic to decide what to show
        if (state.view === 'admin' && !state.isAuthenticated) {
            showPasswordModal();
            // Do not render the main app, just show the modal over the existing view
        } else {
            hidePasswordModal();
            renderApp(); // Render the correct view (results page or authenticated admin page)
        }
    }

    // --- Rendering ---
    function renderApp() {
        const filteredData = state.data.filter(item => {
            const rimeMatch = state.currentRimeGroup === 'all' || item.rime_group === state.currentRimeGroup;
            const initialMatch = state.currentInitial === 'all' || item.initial === state.currentInitial;
            return rimeMatch && initialMatch;
        });
        renderGrid(filteredData, state.results, state);
    }

    function updateActiveModeButtons() {
        if (state.mode === 'tts') {
            ttsModeBtn.classList.add('active');
            sttModeBtn.classList.remove('active');
        } else {
            sttModeBtn.classList.add('active');
            ttsModeBtn.classList.remove('active');
        }
        document.getElementById('current-view').textContent = `模式: ${state.mode.toUpperCase()} / 視圖: ${state.view.toUpperCase()}`;
    }

    function updateAdminButton() {
        if (state.isAuthenticated && state.view === 'admin') {
            adminLoginBtn.textContent = '回結果頁';
        } else {
            adminLoginBtn.textContent = '後台登入';
        }
    }

    // --- Event Listeners ---
    function addEventListeners() {
        window.addEventListener('hashchange', handleRouting);

        rimeFilterInput.addEventListener('input', (e) => {
            const filterText = e.target.value.toLowerCase();
            const filteredGroups = state.rimeGroups.filter(g => g.toLowerCase().includes(filterText));
            updateRimeSelectOptions(filteredGroups);
        });

        rimeSelect.addEventListener('change', (e) => {
            state.currentRimeGroup = e.target.value;
            renderApp();
        });

        initialSelect.addEventListener('change', (e) => {
            state.currentInitial = e.target.value;
            renderApp();
        });

        passwordSubmit.addEventListener('click', handlePasswordSubmit);
        sttResultClose.addEventListener('click', hideSTTResultModal);
        
        ttsModeBtn.addEventListener('click', () => window.location.hash = `#/tts/${state.view}`);
        sttModeBtn.addEventListener('click', () => window.location.hash = `#/stt/${state.view}`);

        adminLoginBtn.addEventListener('click', () => {
            if (state.isAuthenticated && state.view === 'admin') {
                window.location.hash = `#/tts/results`;
            } else {
                window.location.hash = `#/tts/admin`;
            }
        });

        exportJsonBtn.addEventListener('click', exportResultsAsJSON);
        exportCsvBtn.addEventListener('click', exportResultsAsCSV);
    }

    function addGridActionListeners() {
        const grid = document.getElementById('grid-container');
        grid.addEventListener('click', async (e) => {
            const target = e.target;
            const cellContent = target.closest('.cell-content');
            if (!cellContent) return;
            
            const syllableText = cellContent.querySelector('.syllable')?.textContent;
            if (!syllableText) return;

            const syllableNumMatch = syllableText.match(/\(([^)]+)\)/);
            if (!syllableNumMatch) return;
            const syllableNum = syllableNumMatch[1];

            const marker = cellContent.querySelector('.status-marker');
            const cellId = marker.dataset.id;

            // Handle status marking in admin mode
            if (state.view === 'admin' && target.classList.contains('status-marker')) {
                const statusCycle = ['o', 'x', 'na', null];
                const currentStatus = state.results.find(r => r.id === cellId)?.status ?? null;
                
                const currentIndex = statusCycle.indexOf(currentStatus);
                const nextIndex = (currentIndex + 1) % statusCycle.length;
                const newStatus = statusCycle[nextIndex];
                
                await updateResult(cellId, newStatus);
            }
            
            // Handle TTS/STT actions
            if (target.tagName === 'BUTTON') {
                if (state.mode === 'tts') {
                    handleTTSPlay(syllableNum, target);
                } else {
                    handleSTTRecord(cellId, target);
                }
            }
        });
    }

    // --- Action Handlers ---
    function handlePasswordSubmit() {
        // Simple password check, hash '1234' with SHA-256
        const passHash = 'b3cddf7a103bb3a88721cb2c7d2b7cb8833b7a95d0a5dc00f3e28e02a99be5b7';
        crypto.subtle.digest('SHA-256', new TextEncoder().encode(passwordInput.value))
            .then(hashBuffer => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                if (hexHash === passHash) {
                    state.isAuthenticated = true;
                    passwordInput.value = '';
                    passwordError.textContent = '';

                    // Now that we are authenticated, manually update the UI.
                    // This is more reliable than re-triggering the router.
                    hidePasswordModal();
                    updateAdminButton();
                    renderApp();
                } else {
                    passwordError.textContent = '密碼錯誤';
                }
            });
    }

    async function handleTTSPlay(syllable, button) {
        button.disabled = true;
        button.textContent = '載入中...';

        let playbackTimeout = null;

        // This cleanup function is now only for resetting the button state
        const resetButton = () => {
            clearTimeout(playbackTimeout);
            button.disabled = false;
            button.textContent = '播放';
        };

        try {
            const audioSrc = await callTTS(syllable);
            const audio = new Audio(audioSrc);

            // The timeout is the ONLY source of truth for playback failure.
            playbackTimeout = setTimeout(() => {
                console.error('Playback timeout: Audio did not start playing within 5 seconds.');
                alert('播放失敗，請檢查網路連線或 API 狀態。');
                resetButton();
            }, 5000);

            // onplaying is the ONLY source of truth for playback success.
            audio.onplaying = () => {
                clearTimeout(playbackTimeout); // Success! Cancel the failure timer.
                button.textContent = '播放中...';
            };

            audio.onended = () => {
                resetButton();
            };

            // Browser errors are now for debugging ONLY. They DO NOT trigger user alerts.
            audio.onerror = (e) => {
                console.warn('An audio.onerror event was fired, but is being ignored by the timeout logic.', e);
            };

            audio.play().catch(err => {
                console.warn('audio.play() promise was rejected, but is being ignored by the timeout logic.', err);
            });

        } catch (error) {
            // This is a genuine API or network error, so we should alert the user immediately.
            console.error('TTS API call failed:', error);
            // Provide a more specific error message to the user.
            alert(`播放失敗：${error.message}`);
            resetButton();
        }
    }

    async function handleSTTRecord(cellId, button) {
        if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
            state.mediaRecorder.stop();
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('您的瀏覽器不支援錄音功能。');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            state.mediaRecorder = new MediaRecorder(stream);
            state.audioChunks = [];

            state.mediaRecorder.ondataavailable = event => {
                state.audioChunks.push(event.data);
            };

            state.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(state.audioChunks, { type: 'audio/wav' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result.split(',')[1];
                    try {
                        button.textContent = '辨識中...';
                        const result = await callSTT(base64Audio);
                        showSTTResultModal(result);
                    } catch (error) {
                        alert('STT 辨識失敗，請檢查網路或 API 狀態。');
                    } finally {
                        button.disabled = false;
                        button.classList.remove('recording');
                        button.textContent = '錄音';
                    }
                };
                stream.getTracks().forEach(track => track.stop()); // 釋放麥克風
            };

            state.mediaRecorder.start();
            button.disabled = true;
            button.classList.add('recording');
            button.textContent = '停止錄音';
            
            // 錄音最多 5 秒
            setTimeout(() => {
                if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
                    state.mediaRecorder.stop();
                }
            }, 5000);

        } catch (err) {
            console.error('麥克風權限錯誤:', err);
            alert('無法取得麥克風權限，請檢查您的設定。');
            button.disabled = false;
            button.classList.remove('recording');
            button.textContent = '錄音';
        }
    }

    async function updateResult(cellId, newStatus) {
        const resultIndex = state.results.findIndex(r => r.id === cellId);

        if (newStatus === null) {
            // If new status is 'untested', remove it from the state and DB
            if (resultIndex > -1) {
                state.results.splice(resultIndex, 1);
            }
            await deleteData(cellId);
        } else {
            // Otherwise, update or add the result
            if (resultIndex > -1) {
                state.results[resultIndex].status = newStatus;
            } else {
                state.results.push({ id: cellId, status: newStatus });
            }
            await saveData({ id: cellId, status: newStatus });
        }

        updateCellStatus(cellId, newStatus);
    }

    // --- Export ---
    function exportResultsAsJSON() {
        const dataStr = JSON.stringify(state.results, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tts_stt_eval_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportResultsAsCSV() {
        let csvContent = 'data:text/csv;charset=utf-8,id,status\n';
        state.results.forEach(row => {
            csvContent += `${row.id},${row.status}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `tts_stt_eval_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- Start the app ---
    initialize();
});