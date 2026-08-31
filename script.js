
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const overlayConnectBtn = document.getElementById('overlayConnectBtn');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const mainWorkspace = document.getElementById('mainWorkspace');
        const serialWorkspace = document.getElementById('serialWorkspace');
        const macropad = document.getElementById('macropad');
        const overlay = document.getElementById('overlay');
        const navBasic = document.getElementById('navBasic');
        const navSerial = document.getElementById('navSerial');

        function renderLayerTabs() {
            const container = document.getElementById('layerTabsContainer');
            if (!container || !activeKeymap || !activeKeymap.layers) return;
            
            container.innerHTML = '';
            activeKeymap.layers.forEach((layer, idx) => {
                const tab = document.createElement('div');
                tab.className = `layer-tab ${idx === activeLayer ? 'active' : ''}`;
                tab.textContent = `层 ${idx + 1}`;
                tab.onclick = () => {
                    if (activeLayer !== idx) {
                        activeLayer = idx;
                        renderLayerTabs();
                        
                        // Sync layer switch to hardware
                        const payload = new Uint8Array([0xBC, activeLayer, 0xBD]);
                        if (typeof serialWriter !== 'undefined' && serialWriter) {
                            serialWriter.write(payload).catch(e => console.error(e));
                        } else if (typeof logSerialPort !== 'undefined' && logSerialPort && logSerialPort.writable && !logSerialPort.writable.locked) {
                            const writer = logSerialPort.writable.getWriter();
                            writer.write(payload).finally(() => writer.releaseLock());
                        }
                    }
                    updateKeyLabels();
                    document.querySelectorAll('.key.editing, .knob-container.editing').forEach(el => el.classList.remove('editing'));
                    editingKeyIdx = -1;
                    updateActionBar();
                };
                container.appendChild(tab);
            });

            const addBtn = document.createElement('div');
            addBtn.className = 'layer-tab add-btn';
            addBtn.textContent = '+';
            addBtn.title = '添加新层 (当前仅为界面演示)';
            addBtn.onclick = () => {
                alert('添加新层功能需要底层固件支持，当前为演示界面。');
            };
            container.appendChild(addBtn);
        }

        navBasic.addEventListener('click', () => {
            navBasic.classList.add('active');
            navSerial.classList.remove('active');
            mainWorkspace.style.display = 'flex';
            serialWorkspace.style.display = 'none';
        });

        navSerial.addEventListener('click', () => {
            navSerial.classList.add('active');
            navBasic.classList.remove('active');
            mainWorkspace.style.display = 'none';
            serialWorkspace.style.display = 'flex';
        });
        
        let serialPort;
        let serialWriter;
        let serialReader;
        let keepReading = true;

        let zmkStudioMessage;
        let zmkStudioResponse;

        // --- 1. Init Protobuf ---
        const root = protobuf.Root.fromJSON(zmkProtoBundle);
        zmkStudioMessage = root.lookupType("zmk.studio.Request");
        zmkStudioResponse = root.lookupType("zmk.studio.Response");

        function setStatus(text, isConnected) {
            statusText.textContent = text;
            if (isConnected) {
                statusDot.classList.add('connected');
                mainWorkspace.classList.add('connected');
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                document.getElementById('vkSection').style.display = 'flex';
            } else {
                statusDot.classList.remove('connected');
                mainWorkspace.classList.remove('connected');
                connectBtn.style.display = 'inline-block';
                disconnectBtn.style.display = 'none';
                document.getElementById('macropadWrapper').style.display = 'none';
                document.getElementById('vkSection').style.display = 'none';
            }
        }

        // --- 1.1 ZMK RPC Framing ---
        const FRAMING_SOF = 0xAB;
        const FRAMING_ESC = 0xAC;
        const FRAMING_EOF = 0xAD;

        function frameData(buffer) {
            const framed = [FRAMING_SOF];
            for (let i = 0; i < buffer.length; i++) {
                const b = buffer[i];
                if (b === FRAMING_SOF || b === FRAMING_ESC || b === FRAMING_EOF) {
                    framed.push(FRAMING_ESC);
                }
                framed.push(b);
            }
            framed.push(FRAMING_EOF);
            return new Uint8Array(framed);
        }

        
        const CODE_TO_ZMK_PARAM = {
            "KeyA": 0x00070004, "KeyB": 0x00070005, "KeyC": 0x00070006, "KeyD": 0x00070007,
            "KeyE": 0x00070008, "KeyF": 0x00070009, "KeyG": 0x0007000A, "KeyH": 0x0007000B,
            "KeyI": 0x0007000C, "KeyJ": 0x0007000D, "KeyK": 0x0007000E, "KeyL": 0x0007000F,
            "KeyM": 0x00070010, "KeyN": 0x00070011, "KeyO": 0x00070012, "KeyP": 0x00070013,
            "KeyQ": 0x00070014, "KeyR": 0x00070015, "KeyS": 0x00070016, "KeyT": 0x00070017,
            "KeyU": 0x00070018, "KeyV": 0x00070019, "KeyW": 0x0007001A, "KeyX": 0x0007001B,
            "KeyY": 0x0007001C, "KeyZ": 0x0007001D, "Digit1": 0x0007001E, "Digit2": 0x0007001F,
            "Digit3": 0x00070020, "Digit4": 0x00070021, "Digit5": 0x00070022, "Digit6": 0x00070023,
            "Digit7": 0x00070024, "Digit8": 0x00070025, "Digit9": 0x00070026, "Digit0": 0x00070027,
            "Enter": 0x00070028, "Escape": 0x00070029, "Backspace": 0x0007002A, "Tab": 0x0007002B,
            "Space": 0x0007002C, "Minus": 0x0007002D, "Equal": 0x0007002E, "BracketLeft": 0x0007002F,
            "BracketRight": 0x00070030, "Backslash": 0x00070031, "Semicolon": 0x00070033, "Quote": 0x00070034,
            "Backquote": 0x00070035, "Comma": 0x00070036, "Period": 0x00070037, "Slash": 0x00070038,
            "F1": 0x0007003A, "F2": 0x0007003B, "F3": 0x0007003C, "F4": 0x0007003D,
            "F5": 0x0007003E, "F6": 0x0007003F, "F7": 0x00070040, "F8": 0x00070041,
            "F9": 0x00070042, "F10": 0x00070043, "F11": 0x00070044, "F12": 0x00070045,
            "ArrowRight": 0x0007004F, "ArrowLeft": 0x00070050, "ArrowDown": 0x00070051, "ArrowUp": 0x00070052,
            "ControlLeft": 0x000700E0, "ShiftLeft": 0x000700E1, "AltLeft": 0x000700E2, "MetaLeft": 0x000700E3,
            "ControlRight": 0x000700E4, "ShiftRight": 0x000700E5, "AltRight": 0x000700E6, "MetaRight": 0x000700E7,
            "AudioVolumeUp": 0x000C00E9, "AudioVolumeDown": 0x000C00EA, "AudioVolumeMute": 0x000C00E2,
            "PrintScreen": 0x00070046, "ScrollLock": 0x00070047, "Pause": 0x00070048,
            "Insert": 0x00070049, "Home": 0x0007004A, "PageUp": 0x0007004B,
            "Delete": 0x0007004C, "End": 0x0007004D, "PageDown": 0x0007004E,
            "NumLock": 0x00070053, "NumpadDivide": 0x00070054, "NumpadMultiply": 0x00070055,
            "NumpadSubtract": 0x00070056, "NumpadAdd": 0x00070057, "NumpadEnter": 0x00070058,
            "Numpad1": 0x00070059, "Numpad2": 0x0007005A, "Numpad3": 0x0007005B,
            "Numpad4": 0x0007005C, "Numpad5": 0x0007005D, "Numpad6": 0x0007005E,
            "Numpad7": 0x0007005F, "Numpad8": 0x00070060, "Numpad9": 0x00070061,
            "Numpad0": 0x00070062, "NumpadDecimal": 0x00070063, "ContextMenu": 0x00070065
        };
        
        let activeKeymap = null;
        let activeLayer = 0;
        let behaviorIdList = [];
        let currentBehaviorIndex = 0;
        let dynMacroBehaviorId = -1;
        let kpBehaviorId = -1;
        let transBehaviorId = -1; // 记录基础按键行为 ID

        let rxBuffer = [];
        let isEscaped = false;
        let inRpcFrame = false;
        let byteCount = 0;
        let currentLine = "";
        function handleSerialData(data) {
            byteCount += data.length;
            let debugEl = document.getElementById('debug_info');
            if (debugEl) debugEl.textContent = `[Debug] Rx Bytes: ${byteCount}`;

            for (let i = 0; i < data.length; i++) {
                const b = data[i];

                if (isEscaped) {
                    rxBuffer.push(b);
                    isEscaped = false;
                    continue;
                }

                if (b === FRAMING_SOF) {
                    inRpcFrame = true;
                    rxBuffer = [];
                    continue;
                }

                if (b === FRAMING_ESC) {
                    isEscaped = true;
                    continue;
                }

                if (b === FRAMING_EOF) {
                    inRpcFrame = false;
                    try {
                        const payload = new Uint8Array(rxBuffer);
                        const decodedMsg = zmkStudioResponse.decode(payload);
                        const object = zmkStudioResponse.toObject(decodedMsg, { enums: String, defaults: true });

                        if (object.requestResponse && object.requestResponse.core && object.requestResponse.core.getLockState) {
                            setStatus(`已连接 (${object.requestResponse.core.getLockState})`, true);
                            setTimeout(() => fetchPhysicalLayout(), 500);
                        } else if (object.requestResponse && object.requestResponse.keymap && object.requestResponse.keymap.getPhysicalLayouts) {
                            setStatus(`已同步物理布局`, true);
                            renderKeyboard(object.requestResponse.keymap.getPhysicalLayouts);
                            if (object.requestResponse.keymap) {
                                activeKeymap = object.requestResponse.keymap;
                                console.log('[DEBUG] Keymap loaded:', activeKeymap);
                                renderLayerTabs();
                                updateKeyLabels();
                            }
                            setTimeout(() => fetchKeymap(), 500);
                        } else if (object.requestResponse && object.requestResponse.keymap && object.requestResponse.keymap.getKeymap) {
                            activeKeymap = object.requestResponse.keymap.getKeymap;
                            renderLayerTabs();
                            setStatus(`按键映射已同步`, true);
                            
                            // 推测 kpBehaviorId：键盘中最常用的行为通常是 &kp
                            if (kpBehaviorId === -1 && activeKeymap.layers) {
                                let behaviorCounts = {};
                                activeKeymap.layers.forEach(layer => {
                                    if (!layer.bindings) return;
                                    layer.bindings.forEach(binding => {
                                        let bid = binding.behaviorId !== undefined ? binding.behaviorId : binding.behavior_id;
                                        if (bid !== undefined) {
                                            behaviorCounts[bid] = (behaviorCounts[bid] || 0) + 1;
                                        }
                                    });
                                });
                                let maxCount = 0;
                                let maxId = -1;
                                for (let id in behaviorCounts) {
                                    let parsedId = parseInt(id);
                                    if (behaviorCounts[id] > maxCount && parsedId !== dynMacroBehaviorId) {
                                        maxCount = behaviorCounts[id];
                                        maxId = parsedId;
                                    }
                                }
                                if (maxId !== -1) {
                                    kpBehaviorId = maxId;
                                }
                            }
                            
                            updateKeyLabels();
                            setTimeout(() => fetchBehaviors(), 200);
                        } else if (object.requestResponse && object.requestResponse.behaviors && object.requestResponse.behaviors.listAllBehaviors) {
                            // Extract behaviors
                            let behaviors = object.requestResponse.behaviors.listAllBehaviors.behaviors;
                            // We need to fetch details for each behavior, but actually we can just rely on the fallback if we don't know the ID.
                            // Wait, listAllBehaviors only gives local_id! We need to call getBehaviorDetails.
                            // Let's just fetch details for all behaviors.
                            behaviorIdList = behaviors;
                            currentBehaviorIndex = 0;
                            fetchNextBehaviorDetail();
                        } else if (object.requestResponse && object.requestResponse.keymap && object.requestResponse.keymap.setLayerBinding) {
                            setStatus(`按键映射已更新`, true);
                            setTimeout(() => sendSaveChangesRequest(), 200);
                        } else if (object.requestResponse && object.requestResponse.behaviors && object.requestResponse.behaviors.getBehaviorDetails) {
                            let details = object.requestResponse.behaviors.getBehaviorDetails;
                            let rawName = details.displayName || details.display_name || details.name || "";
                            let name = rawName.toLowerCase();
                            console.log(`[DEBUG] Received behavior detail: id=${details.id}, rawName="${rawName}", name="${name}"`);
                            if (name === "behavior_dynamic_macro" || name.includes("dynamic_macro") || name.includes("dynamic-macro")) {
                                dynMacroBehaviorId = details.id;
                                if (kpBehaviorId === details.id) kpBehaviorId = -1; // Fix fallback collision
                            } else if ((name === "behavior_key_press" || name === "&kp" || name === "kp" || name === "key_press" || name === "key press" || name === "keypress")) {
                                kpBehaviorId = details.id;
                            } else if ((name === "behavior_transparent" || name === "&trans" || name === "trans" || name === "transparent")) {
                                transBehaviorId = details.id;
                            }
                            
                            // 更新 Debug UI
                            let debugEl = document.getElementById('debug_info');
                            if (debugEl) debugEl.textContent = `[Debug] MacroID: ${dynMacroBehaviorId} | KP_ID: ${kpBehaviorId}`;
                            currentBehaviorIndex++;
                            // 所有行为加载完毕后，重新刷新按键标签（宏键标签需要 dynMacroBehaviorId 才能正确显示）
                            if (currentBehaviorIndex >= behaviorIdList.length) {
                                updateKeyLabels();
                            }
                            fetchNextBehaviorDetail();
                        } else if (object.requestResponse && object.requestResponse.keymap && object.requestResponse.keymap.saveChanges) {
                            setStatus(`按键映射已保存到键盘`, true);
                            setTimeout(() => fetchKeymap(), 200);
                        } else if (object.requestResponse && object.requestResponse.meta && object.requestResponse.meta.simpleError) {
                            setStatus(`错误: ${object.requestResponse.meta.simpleError}`, true);
                        }
                    } catch (e) {
                        console.error("Protobuf 解析失败:", e);
                    }
                    rxBuffer = [];
                    continue;
                }

                if (!inRpcFrame && !isEscaped) {
                    let char = String.fromCharCode(b);
                    currentLine += char;
                    
                    let pkMatch = currentLine.match(/\[PK:(\d+):(\d+)\]/);
                    if (pkMatch) {
                        let pos = parseInt(pkMatch[1]);
                        let state = parseInt(pkMatch[2]);
                        let el = document.getElementById(`physical_key_${pos}`);
                        if (el) {
                            if (state) el.classList.add('active');
                            else el.classList.remove('active');
                        }
                        currentLine = currentLine.replace(/\[PK:\d+:\d+\]/, "");
                    }
                    
                    let knobMatch = currentLine.match(/\[KNOB:(\d+):([-\d]+)\]/);
                    if (knobMatch) {
                        let idx = parseInt(knobMatch[1]);
                        let val = parseInt(knobMatch[2]);
                        let el = document.getElementById(`physical_key_${idx === 0 ? 9 : 10}`);
                        if (el) {
                            const knob = el.querySelector('.knob');
                            if (knob) {
                                let currentRotation = parseInt(knob.getAttribute('data-rotation') || '0');
                                // 将原本的 18 度减半为 9 度，让视觉旋转更平滑、速度更慢
                                currentRotation += val > 0 ? 9 : -9;
                                knob.setAttribute('data-rotation', currentRotation);
                                let transformStr = `rotate(${currentRotation}deg)`;
                                if (el.classList.contains('active')) {
                                    transformStr += ' scale(0.85)';
                                }
                                knob.style.transform = transformStr;
                            }
                        }
                        currentLine = currentLine.replace(/\[KNOB:\d+:[-\d]+\]/, "");
                    }

                    if (char === '\n' || char === '\r') {
                        currentLine = "";
                    } else if (currentLine.length > 500) {
                        currentLine = currentLine.substring(currentLine.length - 200);
                    }

                    let logArea = document.getElementById('serialLogOutput');
                    if(logArea) {
                        logArea.value += char;
                        logArea.scrollTop = logArea.scrollHeight;
                    }
                }

                rxBuffer.push(b);
            }
        }

        let requestIdCounter = 1;
        
        async function sendRpcRequest(subsystem, requestName, requestValue = true) {
            try {
                const payload = { requestId: requestIdCounter++ };
                payload[subsystem] = {};
                payload[subsystem][requestName] = requestValue;
                
                const message = zmkStudioMessage.create(payload);
                const buffer = zmkStudioMessage.encode(message).finish();
                const framedBuffer = frameData(buffer);
                
                if (serialWriter) {
                    await serialWriter.write(framedBuffer);
                }
            } catch (error) {
                console.error(`发送 ${requestName} 请求失败:`, error);
            }
        }

        async function sendGetLockStateRequest() {
            setStatus('正在读取锁定状态...', true);
            await sendRpcRequest('core', 'getLockState');
        }
        
        async function fetchPhysicalLayout() {
            setStatus('正在读取物理布局...', true);
            await sendRpcRequest('keymap', 'getPhysicalLayouts');
        }

        
        async function fetchKeymap() {
            setStatus('正在读取按键映射...', true);
            await sendRpcRequest('keymap', 'getKeymap');
        }

        async function fetchBehaviors() {
            setStatus('正在获取行为列表...', true);
            await sendRpcRequest('behaviors', 'listAllBehaviors');
        }

        async function fetchNextBehaviorDetail() {
            if (currentBehaviorIndex < behaviorIdList.length) {
                let id = behaviorIdList[currentBehaviorIndex];
                await sendRpcRequest('behaviors', 'getBehaviorDetails', { behaviorId: id });
            } else {
                setStatus('所有行为已就绪', true);
            }
        }

        function renderKeyboard(physicalLayouts) {
            macropad.innerHTML = '';
            macropad.style.display = 'block';
            document.getElementById('macropadWrapper').style.display = 'flex';
            
            const layout = physicalLayouts.layouts[physicalLayouts.activeLayoutIndex || 0];
            if (!layout || !layout.keys) return;

            // ZMK keys are usually 100x100 for 1U. We scale to make 1U = 80px
            const SCALE = 0.8;
            let maxX = 0;
            let maxY = 0;
            const PADDING = 20;

            layout.keys.forEach((key, idx) => {
                const w = (key.width || 100) * SCALE;
                const h = (key.height || 100) * SCALE;
                const x = (key.x || 0) * SCALE;
                const y = (key.y || 0) * SCALE;

                if (x + w > maxX) maxX = x + w;
                if (y + h > maxY) maxY = y + h;

                // 第 9 和 10 个物理按键是旋钮
                const isKnob = (idx === 9 || idx === 10);

                if (isKnob) {
                    const GAP = 10;
                    const knobContainer = document.createElement('div');
                    knobContainer.className = 'knob-container';
                    knobContainer.id = `physical_key_${idx}`;
                    knobContainer.style.width = (w - GAP) + 'px';
                    knobContainer.style.height = (h - GAP) + 'px';
                    knobContainer.style.left = (x + PADDING + GAP/2) + 'px';
                    knobContainer.style.top = (y + PADDING + GAP/2) + 'px';

                    const knob = document.createElement('div');
                    knob.className = 'knob';
                    
                    let rotation = 0;
                    knobContainer.addEventListener('wheel', (e) => {
                        e.preventDefault();
                        rotation += e.deltaY > 0 ? 18 : -18;
                        knob.style.transform = `rotate(${rotation}deg)`;
                    });

                    knobContainer.addEventListener('click', () => selectPhysicalKey(idx));
                    knobContainer.appendChild(knob);
                    macropad.appendChild(knobContainer);
                } else {
                    const keyDiv = document.createElement('div');
                    keyDiv.className = 'key';
                    keyDiv.id = `physical_key_${idx}`;
                    const GAP = 10;
                    keyDiv.style.width = (w - GAP) + 'px';
                    keyDiv.style.height = (h - GAP) + 'px';
                    keyDiv.style.left = (x + PADDING + GAP/2) + 'px';
                    keyDiv.style.top = (y + PADDING + GAP/2) + 'px';
                    
                    if (key.r) {
                        const rx = (key.rx || 0) * SCALE;
                        const ry = (key.ry || 0) * SCALE;
                        keyDiv.style.transformOrigin = `${rx}px ${ry}px`;
                        keyDiv.style.transform = `rotate(${key.r / 100}deg)`;
                    }

                    keyDiv.innerHTML = `<div class="key-label">K${idx+1}</div><div class="key-mapping"></div><div class="key-id">K${idx+1}</div>`;
                    
                    keyDiv.addEventListener('mousedown', () => keyDiv.classList.add('pressed'));
                    keyDiv.addEventListener('mouseup', () => keyDiv.classList.remove('pressed'));
                    keyDiv.addEventListener('mouseleave', () => keyDiv.classList.remove('pressed'));
                    keyDiv.addEventListener('click', () => selectPhysicalKey(idx));
                    
                    macropad.appendChild(keyDiv);
                }
            });

            const finalWidth = maxX + PADDING * 2;
            const finalHeight = maxY + PADDING * 2;
            macropad.style.width = finalWidth + 'px';
            macropad.style.height = finalHeight + 'px';
            
            // Sync action bar height perfectly with the macropad
            const actionBar = document.getElementById('actionBar');
            if (actionBar) {
                actionBar.style.height = finalHeight + 'px';
            }
        }

        async function connectSerial() {
            if (!navigator.serial) {
                alert('您的浏览器不支持 Web Serial API。');
                return;
            }

            try {
                setStatus('请求设备...', false);
                serialPort = await navigator.serial.requestPort();

                setStatus('打开串口...', false);
                await serialPort.open({ baudRate: 115200 });

                setStatus('已连接，初始化...', true);
                
                serialWriter = serialPort.writable.getWriter();
                keepReading = true;
                
                readLoop();

                setTimeout(() => sendGetLockStateRequest(), 500);

            } catch (error) {
                setStatus('等待连接设备...', false);
                console.error(error);
            }
        }

        async function readLoop() {
            while (serialPort && serialPort.readable && keepReading) {
                serialReader = serialPort.readable.getReader();
                try {
                    while (true) {
                        const { value, done } = await serialReader.read();
                        if (done) break;
                        if (value) handleSerialData(value);
                    }
                } catch (error) {
                    console.error('读取出错', error);
                    break;
                } finally {
                    serialReader.releaseLock();
                }
            }
        }

        async function disconnectSerial() {
            if (serialReader) {
                keepReading = false;
                await serialReader.cancel();
            }
            if (serialWriter) {
                await serialWriter.close();
                serialWriter.releaseLock();
            }
            if (serialPort) {
                await serialPort.close();
                serialPort = null;
                setStatus('等待连接设备...', false);
            }
        }

        connectBtn.addEventListener('click', connectSerial);
        overlayConnectBtn.addEventListener('click', connectSerial);
        disconnectBtn.addEventListener('click', disconnectSerial);
        
        // --- Macro Logic ---
        let currentMacroKeys = [];
        const macroSequence = document.getElementById('macroSequence');

        // 宏序列反查表：{ 物理键索引: [param1, param2, ...] }
        // 用于在收到宏输出键时，找到对应的物理键并触发高亮
        const macroKeyParamsMap = JSON.parse(localStorage.getItem('zmk_macroKeyParamsMap') || '{}');
        // 宏键高亮防抖计时器
        function getParamWithModifiers() {
            return selectedVkParam;
        }

        // --- Key Editing Logic (Virtual Keyboard) ---
        let editingKeyIdx = -1;
        let selectedVkParam = null;
        
        const actionBar = document.getElementById('actionBar');
        const sourceChip = document.getElementById('sourceChip');
        const targetChip = document.getElementById('targetChip');
        const confirmBtn = document.getElementById('confirmBindingBtn');
        const vkContainer = document.getElementById('vkContainer');

        const VK_MAIN = [
            [ { code: 'Escape', label: 'Esc' }, { spacer: true, width: 1 }, { code: 'F1', label: 'F1' }, { code: 'F2', label: 'F2' }, { code: 'F3', label: 'F3' }, { code: 'F4', label: 'F4' }, { spacer: true, width: 0.5 }, { code: 'F5', label: 'F5' }, { code: 'F6', label: 'F6' }, { code: 'F7', label: 'F7' }, { code: 'F8', label: 'F8' }, { spacer: true, width: 0.5 }, { code: 'F9', label: 'F9' }, { code: 'F10', label: 'F10' }, { code: 'F11', label: 'F11' }, { code: 'F12', label: 'F12' } ],
            [ { code: 'Backquote', label: '`~' }, { code: 'Digit1', label: '1!' }, { code: 'Digit2', label: '2@' }, { code: 'Digit3', label: '3#' }, { code: 'Digit4', label: '4$' }, { code: 'Digit5', label: '5%' }, { code: 'Digit6', label: '6^' }, { code: 'Digit7', label: '7&' }, { code: 'Digit8', label: '8*' }, { code: 'Digit9', label: '9(' }, { code: 'Digit0', label: '0)' }, { code: 'Minus', label: '-_' }, { code: 'Equal', label: '=+' }, { code: 'Backspace', label: 'Backspace', width: 2 } ],
            [ { code: 'Tab', label: 'Tab', width: 1.5 }, { code: 'KeyQ', label: 'Q' }, { code: 'KeyW', label: 'W' }, { code: 'KeyE', label: 'E' }, { code: 'KeyR', label: 'R' }, { code: 'KeyT', label: 'T' }, { code: 'KeyY', label: 'Y' }, { code: 'KeyU', label: 'U' }, { code: 'KeyI', label: 'I' }, { code: 'KeyO', label: 'O' }, { code: 'KeyP', label: 'P' }, { code: 'BracketLeft', label: '[{' }, { code: 'BracketRight', label: ']}' }, { code: 'Backslash', label: '\\|', width: 1.5 } ],
            [ { code: 'Caps', label: 'Caps', width: 1.75 }, { code: 'KeyA', label: 'A' }, { code: 'KeyS', label: 'S' }, { code: 'KeyD', label: 'D' }, { code: 'KeyF', label: 'F' }, { code: 'KeyG', label: 'G' }, { code: 'KeyH', label: 'H' }, { code: 'KeyJ', label: 'J' }, { code: 'KeyK', label: 'K' }, { code: 'KeyL', label: 'L' }, { code: 'Semicolon', label: ';:' }, { code: 'Quote', label: '\'"' }, { code: 'Enter', label: 'Enter', width: 2.25 } ],
            [ { code: 'ShiftLeft', label: 'Shift', width: 2.25 }, { code: 'KeyZ', label: 'Z' }, { code: 'KeyX', label: 'X' }, { code: 'KeyC', label: 'C' }, { code: 'KeyV', label: 'V' }, { code: 'KeyB', label: 'B' }, { code: 'KeyN', label: 'N' }, { code: 'KeyM', label: 'M' }, { code: 'Comma', label: ',<' }, { code: 'Period', label: '.>' }, { code: 'Slash', label: '/?' }, { code: 'ShiftRight', label: 'Shift', width: 2.75 } ],
            [ { code: 'ControlLeft', label: 'Ctrl', width: 1.25 }, { code: 'MetaLeft', label: 'Win', width: 1.25 }, { code: 'AltLeft', label: 'Alt', width: 1.25 }, { code: 'Space', label: 'Space', width: 6.25 }, { code: 'AltRight', label: 'Alt', width: 1.25 }, { code: 'MetaRight', label: 'Win', width: 1.25 }, { code: 'ContextMenu', label: 'Menu', width: 1.25 }, { code: 'ControlRight', label: 'Ctrl', width: 1.25 } ]
        ];

        const VK_NAV = [
            [ { code: 'PrintScreen', label: 'PrtSc' }, { code: 'ScrollLock', label: 'ScrLk' }, { code: 'Pause', label: 'Pause' } ],
            [ { code: 'Insert', label: 'Ins' }, { code: 'Home', label: 'Home' }, { code: 'PageUp', label: 'PgUp' } ],
            [ { code: 'Delete', label: 'Del' }, { code: 'End', label: 'End' }, { code: 'PageDown', label: 'PgDn' } ],
            [ { spacer: true, height: 1 } ],
            [ { spacer: true, width: 1 }, { code: 'ArrowUp', label: '↑' }, { spacer: true, width: 1 } ],
            [ { code: 'ArrowLeft', label: '←' }, { code: 'ArrowDown', label: '↓' }, { code: 'ArrowRight', label: '→' } ]
        ];

        const VK_NUM = [
            [ { spacer: true, height: 1 } ],
            [ { code: 'NumLock', label: 'NumLk' }, { code: 'NumpadDivide', label: '/' }, { code: 'NumpadMultiply', label: '*' }, { code: 'NumpadSubtract', label: '-' } ],
            [ { code: 'Numpad7', label: '7' }, { code: 'Numpad8', label: '8' }, { code: 'Numpad9', label: '9' }, { code: 'NumpadAdd', label: '+' } ],
            [ { code: 'Numpad4', label: '4' }, { code: 'Numpad5', label: '5' }, { code: 'Numpad6', label: '6' }, { spacer: true, width: 1 } ],
            [ { code: 'Numpad1', label: '1' }, { code: 'Numpad2', label: '2' }, { code: 'Numpad3', label: '3' }, { code: 'NumpadEnter', label: 'Enter' } ],
            [ { code: 'Numpad0', label: '0', width: 2 }, { code: 'NumpadDecimal', label: '.' }, { spacer: true, width: 1 } ]
        ];

        function createBlock(layout) {
            const block = document.createElement('div');
            block.className = 'vk-block';
            layout.forEach(row => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'vk-row';
                const baseWidth = 46;
                const gap = 6;
                row.forEach(key => {
                    if (key.spacer) {
                        const spacer = document.createElement('div');
                        const w = key.width || 1;
                        spacer.style.width = `calc(${w * baseWidth}px + ${(w - 1) * gap}px)`;
                        if (key.height) spacer.style.height = `calc(${key.height * baseWidth}px + ${(key.height - 1) * gap}px)`;
                        rowDiv.appendChild(spacer);
                        return;
                    }

                    const btn = document.createElement('div');
                    btn.className = 'vk-key';
                    const w = key.width || 1;
                    btn.style.width = `calc(${w * baseWidth}px + ${(w - 1) * gap}px)`;
                    btn.textContent = key.label;
                    
                    const param = CODE_TO_ZMK_PARAM[key.code];
                    if (param !== undefined) {
                        btn.dataset.param = param;
                        btn.addEventListener('click', () => selectVkKey(param, btn, key.label));
                    }
                    
                    rowDiv.appendChild(btn);
                });
                block.appendChild(rowDiv);
            });
            return block;
        }

        function renderVirtualKeyboard() {
            vkContainer.innerHTML = '';
            vkContainer.appendChild(createBlock(VK_MAIN));
            vkContainer.appendChild(createBlock(VK_NAV));
            vkContainer.appendChild(createBlock(VK_NUM));
        }
        renderVirtualKeyboard();

        // Populate dropdown map for reference
        const PARAM_TO_NAME = {};
        for (const [name, param] of Object.entries(CODE_TO_ZMK_PARAM)) {
            PARAM_TO_NAME[param] = name;
        }

        function shortenKeyName(n) {
            if (!n) return '';
            n = n.replace('Key', '').replace('Digit', '').replace('Arrow', '');
            if (n === 'Escape') return 'Esc';
            if (n === 'ControlLeft' || n === 'ControlRight') return 'Ctrl';
            if (n === 'ShiftLeft' || n === 'ShiftRight') return 'Shift';
            if (n === 'AltLeft' || n === 'AltRight') return 'Alt';
            if (n === 'MetaLeft' || n === 'MetaRight' || n === 'GuiLeft' || n === 'GuiRight' || n === 'OSLeft' || n === 'OSRight') return 'Win';
            if (n === 'Backspace') return 'Bksp';
            if (n === 'Enter') return 'Ent';
            if (n === 'Space') return 'Spc';
            return n;
        }

        function updateKeyLabels() {
            if (!activeKeymap || !activeKeymap.layers || activeKeymap.layers.length === 0) return;
            const layer = activeKeymap.layers[activeLayer];
            if (!layer || !layer.bindings) return;

            layer.bindings.forEach((originalBinding, idx) => {
                let binding = originalBinding;
                let resolvedLayerIdx = activeLayer;

                if (typeof transBehaviorId !== 'undefined' && transBehaviorId !== -1) {
                    while (binding && binding.behaviorId === transBehaviorId && resolvedLayerIdx > 0) {
                        resolvedLayerIdx--;
                        const lowerLayer = activeKeymap.layers[resolvedLayerIdx];
                        if (lowerLayer && lowerLayer.bindings) {
                            binding = lowerLayer.bindings[idx];
                        }
                    }
                }

                const el = document.getElementById(`physical_key_${idx}`);
                if (el) {
                    const labelDiv = el.querySelector('.key-label');
                    const mappingDiv = el.querySelector('.key-mapping');
                    
                    if (labelDiv) {
                        // Check if it's a dynamic macro
                        if (typeof dynMacroBehaviorId !== 'undefined' && binding.behaviorId === dynMacroBehaviorId) {
                            const customNames = JSON.parse(localStorage.getItem('zmk_macroCustomNames') || '{}');
                            const customName = customNames[binding.param1];
                            labelDiv.textContent = customName ? customName : `宏 (K${binding.param1 + 1})`;
                            labelDiv.style.fontSize = '0.9rem';
                            labelDiv.style.color = '#f59e0b';
                            
                            if (mappingDiv) {
                                const macroParams = macroKeyParamsMap[binding.param1];
                                if (macroParams && macroParams.length > 0) {
                                    const labels = macroParams.map(p => shortenKeyName(PARAM_TO_NAME[p])).join(' + ');
                                    mappingDiv.textContent = labels;
                                } else {
                                    labelDiv.textContent = '未配置';
                                    labelDiv.style.color = '#888';
                                    mappingDiv.textContent = '';
                                }
                            }
                            return;
                        }

                        // Normal single key
                        const baseParam = binding.param1 & 0x00FFFFFF;
                        const mods = (binding.param1 & 0xFF000000) >>> 24;
                        
                        if (baseParam === 0 && mods === 0) {
                            labelDiv.textContent = '未配置';
                            labelDiv.style.fontSize = '1.15rem';
                            labelDiv.style.color = '#888';
                            if (mappingDiv) mappingDiv.textContent = '';
                        } else {
                            let keyName = shortenKeyName(PARAM_TO_NAME[baseParam]) || `0x${baseParam.toString(16)}`;
                            
                            labelDiv.textContent = keyName;
                            labelDiv.style.fontSize = '1.15rem';
                            labelDiv.style.color = 'var(--text-main)';

                            if (mappingDiv) {
                                let modStr = [];
                                if (mods & 0x01) modStr.push('Ctrl');
                                if (mods & 0x02) modStr.push('Shift');
                                if (mods & 0x04) modStr.push('Alt');
                                if (mods & 0x08) modStr.push('Win');
                                
                                if (modStr.length > 0) {
                                    mappingDiv.textContent = modStr.join('+') + ' + ' + keyName;
                                } else {
                                    mappingDiv.textContent = '';
                                }
                            }
                        }
                    }
                }
            });
        }

        let knobActionSubIndex = 0; // 0:CW, 1:CCW, 2:Press, 3:Release

        function selectKnobTab(subIdx) {
            knobActionSubIndex = subIdx;
            document.querySelectorAll('.knob-tab').forEach((el, i) => {
                el.classList.toggle('active', i === subIdx);
            });
            
            const baseSlot = 50 + (activeLayer * 8) + (editingKeyIdx === 9 ? 0 : 4);
            const currentSlot = baseSlot + subIdx;
            
            // Load saved keys from macroKeyParamsMap
            const macroMap = JSON.parse(localStorage.getItem('zmk_macroKeyParamsMap') || '{}');
            const savedKeys = macroMap[currentSlot];
            
            selectedVkKeys = [];
            document.querySelectorAll('.vk-key.selected').forEach(el => el.classList.remove('selected'));
            
            if (savedKeys && savedKeys.length > 0) {
                savedKeys.forEach(param => {
                    // Quick fix: vk-key parameters are often in decimal but HTML onclick is also in decimal.
                    // We must match exactly.
                    const el = document.querySelector(`.vk-key[onclick*="${param}"]`);
                    if (el) {
                        const label = el.textContent;
                        selectedVkKeys.push({ param, label, element: el });
                        el.classList.add('selected');
                    }
                });
            }
            
            if (selectedVkKeys.length === 0) {
                targetChip.innerHTML = '<span style="color: #666;">未选择</span>';
            } else {
                targetChip.innerHTML = selectedVkKeys.map(k => `<span class="mini-chip">${k.label}</span>`).join('<span style="color:#555;font-size:0.8rem;">+</span>');
            }
            updateActionBar();
        }

        function updateActionBar() {
            const wrapper = document.getElementById('actionBarWrapper');
            if (editingKeyIdx !== -1) {
                if (wrapper) wrapper.style.width = '390px'; // 360px + 30px margin
            } else {
                if (wrapper) wrapper.style.width = '0';
            }
        }

        function selectPhysicalKey(idx) {
            document.querySelectorAll('.key.editing, .knob-container.editing').forEach(el => el.classList.remove('editing'));
            
            editingKeyIdx = idx;
            const el = document.getElementById(`physical_key_${idx}`);
            if (el) el.classList.add('editing');

            const actionBarWrapper = document.getElementById('actionBarWrapper');
            const actionBar = document.getElementById('actionBar');
            
            if (idx >= 9) {
                actionBarWrapper.classList.add('right-side');
                actionBar.classList.add('right-side', 'knob-mode');
                sourceChip.textContent = `旋钮 ${idx === 9 ? '1 (左)' : '2 (右)'}`;
                selectKnobTab(0);
                return;
            } else {
                actionBarWrapper.classList.remove('right-side');
                actionBar.classList.remove('right-side', 'knob-mode');
                sourceChip.textContent = `物理键 K${idx + 1}`;
                knobActionSubIndex = -1;
            }

            const customNames = JSON.parse(localStorage.getItem('zmk_macroCustomNames') || '{}');
            let currentSlot = -1;
            if (activeKeymap && activeKeymap.layers[activeLayer]) {
                const b = activeKeymap.layers[activeLayer].bindings[idx];
                if (b && typeof dynMacroBehaviorId !== 'undefined' && b.behaviorId === dynMacroBehaviorId) {
                    currentSlot = b.param1;
                }
            }
            if (currentSlot !== -1) {
                document.getElementById('macroNameInput').value = customNames[currentSlot] || '';
            } else {
                document.getElementById('macroNameInput').value = '';
            }
            
            // Re-load normal key's selected keys from physical layout
            selectedVkKeys = [];
            document.querySelectorAll('.vk-key.selected').forEach(el => el.classList.remove('selected'));
            if (currentSlot !== -1) {
                const macroMap = JSON.parse(localStorage.getItem('zmk_macroKeyParamsMap') || '{}');
                const savedKeys = macroMap[currentSlot];
                if (savedKeys && savedKeys.length > 0) {
                    savedKeys.forEach(param => {
                        const el = document.querySelector(`.vk-key[onclick*="${param}"]`);
                        if (el) {
                            const label = el.textContent;
                            selectedVkKeys.push({ param, label, element: el });
                            el.classList.add('selected');
                        }
                    });
                }
            }
            
            if (selectedVkKeys.length === 0) {
                targetChip.innerHTML = '<span style="color: #666;">未选择</span>';
                document.getElementById('macroSettings').style.display = 'none';
            } else if (selectedVkKeys.length === 1) {
                targetChip.innerHTML = `<span class="mini-chip">${selectedVkKeys[0].label}</span>`;
                document.getElementById('macroSettings').style.display = 'none';
            } else {
                targetChip.innerHTML = selectedVkKeys.map(k => `<span class="mini-chip">${k.label}</span>`).join('<span style="color:#555;font-size:0.8rem;">+</span>');
                document.getElementById('macroSettings').style.display = 'block';
            }
            updateActionBar();
        }

        function selectVkKey(param, element, label) {
            const existingIdx = selectedVkKeys.findIndex(k => k.param === param);
            if (existingIdx !== -1) {
                // Deselect
                selectedVkKeys.splice(existingIdx, 1);
                element.classList.remove('selected');
            } else {
                // Select
                selectedVkKeys.push({ param, label, element });
                element.classList.add('selected');
                
                // Cap at 16 keys (macro limit)
                if (selectedVkKeys.length > 16) {
                    const removed = selectedVkKeys.shift();
                    removed.element.classList.remove('selected');
                }
            }
            
            if (selectedVkKeys.length === 0) {
                targetChip.innerHTML = '<span style="color: #666;">未选择</span>';
                document.getElementById('macroSettings').style.display = 'flex';
            }
            updateActionBar();
        }

        document.getElementById('saveMappingBtn').addEventListener('click', async () => {
            try {
                if (editingKeyIdx === -1) return;
                
                if (editingKeyIdx >= 9) {
                    // Knob handling
                    const targetSlot = 50 + (activeLayer * 8) + (editingKeyIdx === 9 ? 0 : 4) + knobActionSubIndex;
                    const len = selectedVkKeys.length;
                    const finalMode = len > 1 ? 1 : 0; // Sequence for macros, simultaneous for single key
                    
                    let payload = [0xBB, targetSlot, finalMode, len];
                    const paramsList = [];
                    for (let i = 0; i < len; i++) {
                        const p = selectedVkKeys[i].param;
                        paramsList.push(p);
                        payload.push((p >>> 24) & 0xFF);
                        payload.push((p >>> 16) & 0xFF);
                        payload.push((p >>> 8) & 0xFF);
                        payload.push(p & 0xFF);
                    }
                    payload.push(0xBD);
                    
                    const buffer = new Uint8Array(payload);
                    if (serialWriter) {
                        await serialWriter.write(buffer);
                        
                        const macroMap = JSON.parse(localStorage.getItem('zmk_macroKeyParamsMap') || '{}');
                        macroMap[targetSlot] = paramsList;
                        localStorage.setItem('zmk_macroKeyParamsMap', JSON.stringify(macroMap));
                    }
                    
                    setStatus('配置已保存 (旋转/按压动作)', true);
                    setTimeout(() => setStatus('已连接', true), 2000);
                    return; // Keep UI open for knobs so they can configure other tabs
                }

                setStatus('正在保存映射...', true);

                if (selectedVkKeys.length === 0) {
                    let behaviorId = transBehaviorId !== -1 ? transBehaviorId : (kpBehaviorId !== -1 ? kpBehaviorId : 24);
                    const oldB = activeKeymap.layers[activeLayer].bindings[editingKeyIdx];
                    if (oldB && typeof dynMacroBehaviorId !== 'undefined' && oldB.behaviorId === dynMacroBehaviorId) {
                        const oldSlot = oldB.param1;
                        const macroKeyParamsMap = JSON.parse(localStorage.getItem('zmk_macroKeyParamsMap') || '{}');
                        if (macroKeyParamsMap[oldSlot]) {
                            delete macroKeyParamsMap[oldSlot];
                            localStorage.setItem('zmk_macroKeyParamsMap', JSON.stringify(macroKeyParamsMap));
                        }
                    }
                    await sendSetBindingRequest(activeLayer, editingKeyIdx, behaviorId, 0);
                    setStatus('按键已清空为未配置', true);
                } else if (selectedVkKeys.length === 1) {
                    // Single key -> Standard &kp
                    setStatus('正在保存单键映射...', true);
                    const finalParam = selectedVkKeys[0].param;
                    let behaviorId = kpBehaviorId;
                    if (typeof behaviorId === 'undefined' || behaviorId === -1 || behaviorId === dynMacroBehaviorId) {
                        console.log("[DEBUG] kpBehaviorId was invalid! Falling back to ID 24 (common for Key Press). Please check logs.");
                        behaviorId = 24; // Fallback to common key_press ID if all else fails
                        // Or 0? Let's try to find it in the current layer mappings just in case!
                        const layer = activeKeymap.layers[activeLayer];
                        if (layer && layer.bindings) {
                            for (let b of layer.bindings) {
                                let bid = b.behaviorId || b.behavior_id;
                                if (bid !== undefined && bid !== dynMacroBehaviorId) {
                                    behaviorId = bid; // Best guess
                                    break;
                                }
                            }
                        }
                    }
                    
                    const oldB = activeKeymap.layers[activeLayer].bindings[editingKeyIdx];
                    if (oldB && typeof dynMacroBehaviorId !== 'undefined' && oldB.behaviorId === dynMacroBehaviorId) {
                        const oldSlot = oldB.param1;
                        const macroKeyParamsMap = JSON.parse(localStorage.getItem('zmk_macroKeyParamsMap') || '{}');
                        if (macroKeyParamsMap[oldSlot]) {
                            delete macroKeyParamsMap[oldSlot];
                            localStorage.setItem('zmk_macroKeyParamsMap', JSON.stringify(macroKeyParamsMap));
                        }
                    }
                    
                    await sendSetBindingRequest(activeLayer, editingKeyIdx, behaviorId, finalParam);
                } else {
                    // Multiple keys -> Dynamic Simultaneous Macro (mode 0)
                    if (typeof dynMacroBehaviorId === 'undefined' || dynMacroBehaviorId === -1) {
                        alert('此固件不支持动态宏行为 (未找到 dynamic-macro)');
                        clearSelection();
                        return;
                    }
                    let targetSlot = -1;
                    const b = activeKeymap.layers[activeLayer].bindings[editingKeyIdx];
                    if (b && b.behaviorId === dynMacroBehaviorId) {
                        targetSlot = b.param1; // Reuse existing slot
                    } else {
                        let usedSlots = new Set();
                        activeKeymap.layers.forEach(l => {
                            l.bindings.forEach(binding => {
                                if (binding.behaviorId === dynMacroBehaviorId) {
                                    usedSlots.add(binding.param1);
                                }
                            });
                        });
                        for (let i = 0; i <= 49; i++) {
                            if (!usedSlots.has(i)) {
                                targetSlot = i;
                                break;
                            }
                        }
                        if (targetSlot === -1) {
                            alert("硬件宏槽位 (0-49) 已分配完毕。请先将其他层的宏按键改回普通按键后再试。");
                            clearSelection();
                            return;
                        }
                    }
                    
                    const len = selectedVkKeys.length;
                    const modeVal = parseInt(document.getElementById('macroModeSelect').value || "0");
                    const customName = document.getElementById('macroNameInput').value.trim();
                    const customNames = JSON.parse(localStorage.getItem('zmk_macroCustomNames') || '{}');
                    if (customName) {
                        customNames[targetSlot] = customName;
                    } else {
                        delete customNames[targetSlot];
                    }
                    localStorage.setItem('zmk_macroCustomNames', JSON.stringify(customNames));
                    let payload = [0xBB, targetSlot, modeVal, len]; // 0 is Simultaneous Mode, 1 is Sequence
                    const paramsList = [];
                    for (let i = 0; i < len; i++) {
                        const p = selectedVkKeys[i].param;
                        paramsList.push(p);
                        payload.push((p >>> 24) & 0xFF);
                        payload.push((p >>> 16) & 0xFF);
                        payload.push((p >>> 8) & 0xFF);
                        payload.push(p & 0xFF);
                    }
                    payload.push(0xBD);
                    
                    const buffer = new Uint8Array(payload);
                    if (serialWriter) {
                        await serialWriter.write(buffer);

                        await sendSetBindingRequest(activeLayer, editingKeyIdx, dynMacroBehaviorId, targetSlot);

                        const macroKeyParamsMap = JSON.parse(localStorage.getItem('zmk_macroKeyParamsMap') || '{}');
                        macroKeyParamsMap[targetSlot] = paramsList;
                        localStorage.setItem('zmk_macroKeyParamsMap', JSON.stringify(macroKeyParamsMap));
                    }
                }
                
                // Clean up UI
                clearSelection();
            } catch (error) {
                alert("保存失败，发生内部错误：" + error.message);
                console.error(error);
            }
        });

    async function sendSetBindingRequest(layerId, keyPosition, behaviorId, param1) {
            try {
                console.log(`[DEBUG] sendSetBindingRequest: layer=${layerId}, pos=${keyPosition}, behaviorId=${behaviorId}, param1=${param1}`);
                document.getElementById('debug_info').innerText = `[DEBUG] Sending behaviorId: ${behaviorId}, param: ${param1} (kpBehaviorId=${kpBehaviorId}, dynMacroBehaviorId=${dynMacroBehaviorId})`;
                
                if (behaviorId === dynMacroBehaviorId) {
                    console.log(`[DEBUG] WARNING: Sending MACRO behavior ID ${behaviorId} to position ${keyPosition}!`);
                }

                const payload = { requestId: requestIdCounter++ };
                payload.keymap = {
                    setLayerBinding: {
                        layerId: layerId,
                        keyPosition: keyPosition,
                        binding: {
                            behaviorId: behaviorId,
                            param1: param1,
                            param2: 0
                        }
                    }
                };
                const message = zmkStudioMessage.create(payload);
                const buffer = zmkStudioMessage.encode(message).finish();
                const framedBuffer = frameData(buffer);
                
                if (serialWriter) {
                    await serialWriter.write(framedBuffer);
                }
            } catch (error) {
                console.error("发送 setLayerBinding 请求失败:", error);
            }
        }

        async function sendSaveChangesRequest() {
            await sendRpcRequest('keymap', 'saveChanges');
        }

        async function disconnectSerial() {
            await sendRpcRequest('keymap', 'saveChanges');
        }
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const code = e.code || e.key;

            let targetKnobIdx = -1;
            let isRotation = false;
            let rotationDelta = 0;
            let isPress = false;

            // 旋钮的旋转(Sensor bindings)在我们的 UI 中不可编辑，所以仍然硬编码匹配
            if (code === "AudioVolumeUp" || code === "VolumeUp") { targetKnobIdx = 9; isRotation = true; rotationDelta = 18; }
            if (code === "AudioVolumeDown" || code === "VolumeDown") { targetKnobIdx = 9; isRotation = true; rotationDelta = -18; }
            if (code === "PageUp") { targetKnobIdx = 10; isRotation = true; rotationDelta = -18; }
            if (code === "PageDown") { targetKnobIdx = 10; isRotation = true; rotationDelta = 18; }

            // 旋钮的按下是矩阵按键(9和10)，支持用户动态改键，所以去 activeKeymap 里查
            const param = CODE_TO_ZMK_PARAM[code];
            
            // --- 全键盘 (Virtual Keyboard) 按键高亮联动 ---
            if (param !== undefined) {
                // 在全键盘面板中寻找对应的按键并点亮
                const vkKeys = document.querySelectorAll(`.vk-key[data-param="${param}"]`);
                vkKeys.forEach(vk => vk.classList.add('pressed'));
            }
            // ---------------------------------------------

            if (param !== undefined && activeKeymap && activeKeymap.layers && activeKeymap.layers.length > 0) {
                const layer = activeKeymap.layers[activeLayer];
                if (layer && layer.bindings) {
                    if (layer.bindings[9] && (layer.bindings[9].param1 === param || layer.bindings[9].param2 === param)) {
                        targetKnobIdx = 9;
                        isPress = true;
                    }
                    if (layer.bindings[10] && (layer.bindings[10].param1 === param || layer.bindings[10].param2 === param)) {
                        targetKnobIdx = 10;
                        isPress = true;
                    }
                }
            }

            if (targetKnobIdx === -1) return;

            if (targetKnobIdx !== -1) {
                const el = document.getElementById(`physical_key_${targetKnobIdx}`);
                if (el) {
                    const knob = el.querySelector('.knob');
                    if (knob) {
                        let currentRotation = parseInt(knob.getAttribute('data-rotation') || '0');
                        if (isRotation) {
                            currentRotation += rotationDelta;
                            knob.setAttribute('data-rotation', currentRotation);
                        }
                        // 如果同时有旋转和按下（比如按住旋转），先旋转再缩放
                        let transformStr = `rotate(${currentRotation}deg)`;
                        if (isPress || knob.classList.contains('knob-pressed')) {
                            transformStr += ' scale(0.85)';
                        }
                        if (isPress) {
                            knob.classList.add('knob-pressed');
                            // 给底座也加一点效果
                            el.classList.add('pressed');
                        }
                        knob.style.transform = transformStr;
                    }
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const code = e.code || e.key;
            
            let targetKnobIdx = -1;

            const param = CODE_TO_ZMK_PARAM[code];
            
            // --- 全键盘 (Virtual Keyboard) 按键释放联动 ---
            if (param !== undefined) {
                const vkKeys = document.querySelectorAll(`.vk-key[data-param="${param}"]`);
                vkKeys.forEach(vk => vk.classList.remove('pressed'));
            }
            // ---------------------------------------------

            if (param !== undefined && activeKeymap && activeKeymap.layers && activeKeymap.layers.length > 0) {
                const layer = activeKeymap.layers[activeLayer];
                if (layer && layer.bindings) {
                    if (layer.bindings[9] && (layer.bindings[9].param1 === param || layer.bindings[9].param2 === param)) {
                        targetKnobIdx = 9;
                    }
                    if (layer.bindings[10] && (layer.bindings[10].param1 === param || layer.bindings[10].param2 === param)) {
                        targetKnobIdx = 10;
                    }
                }
            }

            // Fallback for hardcoded original bindings if not connected or not parsed
            if (code === "AudioVolumeMute") targetKnobIdx = 9;
            if (code === "MediaPlayPause") targetKnobIdx = 10;

            if (targetKnobIdx !== -1) {
                const el = document.getElementById(`physical_key_${targetKnobIdx}`);
                if (el) {
                    const knob = el.querySelector('.knob');
                    if (knob) {
                        knob.classList.remove('knob-pressed');
                        el.classList.remove('pressed');
                        let currentRotation = parseInt(knob.getAttribute('data-rotation') || '0');
                        knob.style.transform = `rotate(${currentRotation}deg)`;
                    }
                }
            }
        });


        // --- Log Serial Port Handlers ---
        let logSerialPort;
        let logSerialReader;
        let keepReadingLog = true;

        document.getElementById('clearLogBtn').addEventListener('click', () => {
            document.getElementById('serialLogOutput').value = '';
        });

        document.getElementById('connectLogBtn').addEventListener('click', async () => {
            if (!navigator.serial) {
                alert('您的浏览器不支持 Web Serial API。');
                return;
            }
            try {
                logSerialPort = await navigator.serial.requestPort();
                await logSerialPort.open({ baudRate: 115200 });
                document.getElementById('connectLogBtn').style.display = 'none';
                document.getElementById('disconnectLogBtn').style.display = 'inline-block';
                document.getElementById('serialLogOutput').value += "--- 已连接到日志串口 ---\n";
                
                keepReadingLog = true;
                logSerialReader = logSerialPort.readable.getReader();
                readLogLoop();
            } catch (err) {
                console.error(err);
                alert('连接日志串口失败');
            }
        });

        document.getElementById('disconnectLogBtn').addEventListener('click', async () => {
            keepReadingLog = false;
            if (logSerialReader) {
                await logSerialReader.cancel();
            }
        });

        async function readLogLoop() {
            const decoder = new TextDecoder();
            try {
                while (keepReadingLog) {
                    const { value, done } = await logSerialReader.read();
                    if (done) break;
                    if (value) {
                        let text = decoder.decode(value);
                        let logArea = document.getElementById('serialLogOutput');
                        logArea.value += text;
                        logArea.scrollTop = logArea.scrollHeight;
                    }
                }
            } catch (error) {
                console.error("Log 读取错误:", error);
            } finally {
                logSerialReader.releaseLock();
                await logSerialPort.close();
                document.getElementById('connectLogBtn').style.display = 'inline-block';
                document.getElementById('disconnectLogBtn').style.display = 'none';
                document.getElementById('serialLogOutput').value += "\n--- 已断开日志串口 ---\n";
            }
        }
    