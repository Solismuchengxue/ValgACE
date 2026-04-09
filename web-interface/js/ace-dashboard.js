// ValgACE Dashboard JavaScript

const { createApp } = Vue;

createApp({
    data() {
        return {
            currentLanguage: localStorage.getItem('valgace-language') || 'zh', // 默认中文
            translations: {
                zh: {
                    header: {
                        title: '🎨 ValgACE 控制面板',
                        connectionLabel: '状态',
                        connected: '已连接',
                        disconnected: '已断开'
                    },
                    cards: {
                        deviceStatus: '设备状态',
                        dryer: '烘干控制',
                        slots: '耗材槽位',
                        quickActions: '快捷操作'
                    },
                    deviceInfo: {
                        model: '型号',
                        firmware: '固件版本',
                        status: '状态',
                        temp: '温度',
                        fan: '风扇转速',
                        rfid: 'RFID',
                        rfidOn: '已启用',
                        rfidOff: '已禁用'
                    },
                    dryer: {
                        status: '状态',
                        targetTemp: '目标温度',
                        duration: '设定时间',
                        remainingTime: '剩余时间',
                        currentTemperature: '当前温度',
                        inputs: {
                            temp: '温度 (°C):',
                            duration: '持续时间 (分钟):'
                        },
                        buttons: {
                            start: '开始烘干',
                            stop: '停止烘干'
                        }
                    },
                    slots: {
                        slot: '槽位',
                        status: '状态',
                        type: '类型',
                        sku: 'SKU',
                        rfid: 'RFID'
                    },
                    quickActions: {
                        unload: '卸载耗材',
                        stopAssist: '停止辅助',
                        refresh: '刷新状态'
                    },
                    buttons: {
                        load: '加载',
                        park: '停泊',
                        assistOn: '辅助开启',
                        assistOff: '辅助关闭',
                        feed: '送料',
                        retract: '回抽'
                    },
                    dialogs: {
                        feedTitle: '送料 - 槽位 {slot}',
                        retractTitle: '回抽 - 槽位 {slot}',
                        length: '长度 (mm):',
                        speed: '速度 (mm/s):',
                        execute: '执行',
                        cancel: '取消'
                    },
                    notifications: {
                        websocketConnected: 'WebSocket 已连接',
                        websocketDisconnected: 'WebSocket 已断开',
                        apiError: 'API 错误: {error}',
                        loadError: '状态加载错误: {error}',
                        commandSuccess: '命令 {command} 执行成功',
                        commandSent: '命令 {command} 已发送',
                        commandError: '错误: {error}',
                        commandErrorGeneric: '命令执行错误',
                        executeError: '命令执行错误: {error}',
                        feedAssistOn: '槽位 {index} 送料辅助已开启',
                        feedAssistOff: '槽位 {index} 送料辅助已关闭',
                        feedAssistAllOff: '所有槽位送料辅助已关闭',
                        feedAssistAllOffError: '无法关闭送料辅助',
                        refreshStatus: '状态已刷新',
                        validation: {
                            tempRange: '温度必须在 20-55°C 之间',
                            durationMin: '持续时间至少需要 1 分钟',
                            feedLength: '长度至少需要 1 mm',
                            retractLength: '长度至少需要 1 mm'
                        }
                    },
                    statusMap: {
                        ready: '就绪',
                        busy: '忙碌',
                        unknown: '未知',
                        disconnected: '已断开'
                    },
                    dryerStatusMap: {
                        drying: '烘干中',
                        stop: '已停止'
                    },
                    slotStatusMap: {
                        ready: '就绪',
                        empty: '空闲',
                        busy: '忙碌',
                        unknown: '未知'
                    },
                    rfidStatusMap: {
                        0: '未找到',
                        1: '错误',
                        2: '已识别',
                        3: '识别中...'
                    },
                    common: {
                        unknown: '未知'
                    },
                    time: {
                        hours: '小时',
                        minutes: '分钟',
                        minutesShort: '分',
                        secondsShort: '秒'
                    }
                },
                ru: {
                    header: {
                        title: '🎨 ValgACE Control Panel',
                        connectionLabel: 'Статус',
                        connected: 'Подключено',
                        disconnected: 'Отключено'
                    },
                    cards: {
                        deviceStatus: 'Статус устройства',
                        dryer: 'Управление сушкой',
                        slots: 'Слоты филамента',
                        quickActions: 'Быстрые действия'
                    },
                    deviceInfo: {
                        model: 'Модель',
                        firmware: 'Прошивка',
                        status: 'Статус',
                        temp: 'Температура',
                        fan: 'Вентилятор',
                        rfid: 'RFID',
                        rfidOn: 'Включен',
                        rfidOff: 'Выключен'
                    },
                    dryer: {
                        status: 'Статус',
                        targetTemp: 'Целевая температура',
                        duration: 'Заданное время',
                        remainingTime: 'Осталось времени',
                        currentTemperature: 'Текущая температура',
                        inputs: {
                            temp: 'Температура (°C):',
                            duration: 'Длительность (мин):'
                        },
                        buttons: {
                            start: 'Запустить сушку',
                            stop: 'Остановить'
                        }
                    },
                    slots: {
                        slot: 'Слот',
                        status: 'Статус',
                        type: 'Тип',
                        sku: 'SKU',
                        rfid: 'RFID'
                    },
                    quickActions: {
                        unload: 'Выгрузить филамент',
                        stopAssist: 'Стоп ассист!',
                        refresh: 'Обновить статус'
                    },
                    buttons: {
                        load: 'Загрузить',
                        park: 'Парковка',
                        assistOn: 'Асист ВКЛ',
                        assistOff: 'Асист',
                        feed: 'Подача',
                        retract: 'Откат'
                    },
                    dialogs: {
                        feedTitle: 'Подача филамента - Слот {slot}',
                        retractTitle: 'Откат филамента - Слот {slot}',
                        length: 'Длина (мм):',
                        speed: 'Скорость (мм/с):',
                        execute: 'Выполнить',
                        cancel: 'Отмена'
                    },
                    notifications: {
                        websocketConnected: 'WebSocket подключен',
                        websocketDisconnected: 'WebSocket отключен',
                        apiError: 'Ошибка API: {error}',
                        loadError: 'Ошибка загрузки статуса: {error}',
                        commandSuccess: 'Команда {command} выполнена успешно',
                        commandSent: 'Команда {command} отправлена',
                        commandError: 'Ошибка: {error}',
                        commandErrorGeneric: 'Ошибка выполнения команды',
                        executeError: 'Ошибка выполнения команды: {error}',
                        feedAssistOn: 'Feed assist включен для слота {index}',
                        feedAssistOff: 'Feed assist выключен для слота {index}',
                        feedAssistAllOff: 'Feed assist выключен для всех слотов',
                        feedAssistAllOffError: 'Не удалось отключить feed assist',
                        refreshStatus: 'Статус обновлен',
                        validation: {
                            tempRange: 'Температура должна быть от 20 до 55°C',
                            durationMin: 'Длительность должна быть минимум 1 минута',
                            feedLength: 'Длина должна быть минимум 1 мм',
                            retractLength: 'Длина должна быть минимум 1 мм'
                        }
                    },
                    statusMap: {
                        ready: 'Готов',
                        busy: 'Занят',
                        unknown: 'Неизвестно',
                        disconnected: 'Отключено'
                    },
                    dryerStatusMap: {
                        drying: 'Сушка',
                        stop: 'Остановлена'
                    },
                    slotStatusMap: {
                        ready: 'Готов',
                        empty: 'Пустой',
                        busy: 'Занят',
                        unknown: 'Неизвестно'
                    },
                    rfidStatusMap: {
                        0: 'Не найдено',
                        1: 'Ошибка',
                        2: 'Идентифицировано',
                        3: 'Идентификация...'
                    },
                    common: {
                        unknown: 'Неизвестно'
                    },
                    time: {
                        hours: 'ч',
                        minutes: 'мин',
                        minutesShort: 'м',
                        secondsShort: 'с'
                    }
                },
                en: {
                    header: {
                        title: '🎨 ValgACE Control Panel',
                        connectionLabel: 'Status',
                        connected: 'Connected',
                        disconnected: 'Disconnected'
                    },
                    cards: {
                        deviceStatus: 'Статус устройства',
                        dryer: 'Управление сушкой',
                        slots: 'Слоты филамента',
                        quickActions: 'Быстрые действия'
                    },
                    deviceInfo: {
                        model: 'Модель',
                        firmware: 'Прошивка',
                        status: 'Статус',
                        temp: 'Температура',
                        fan: 'Вентилятор',
                        rfid: 'RFID',
                        rfidOn: 'Включен',
                        rfidOff: 'Выключен'
                    },
                    dryer: {
                        status: 'Статус',
                        targetTemp: 'Целевая температура',
                        duration: 'Заданное время',
                        remainingTime: 'Осталось времени',
                        currentTemperature: 'Текущая температура',
                        inputs: {
                            temp: 'Температура (°C):',
                            duration: 'Длительность (мин):'
                        },
                        buttons: {
                            start: 'Запустить сушку',
                            stop: 'Остановить'
                        }
                    },
                    slots: {
                        slot: 'Слот',
                        status: 'Статус',
                        type: 'Тип',
                        sku: 'SKU',
                        rfid: 'RFID'
                    },
                    quickActions: {
                        unload: 'Выгрузить филамент',
                        stopAssist: 'Стоп ассист!',
                        refresh: 'Обновить статус'
                    },
                    buttons: {
                        load: 'Загрузить',
                        park: 'Парковка',
                        assistOn: 'Асист ВКЛ',
                        assistOff: 'Асист',
                        feed: 'Подача',
                        retract: 'Откат'
                    },
                    dialogs: {
                        feedTitle: 'Подача филамента - Слот {slot}',
                        retractTitle: 'Откат филамента - Слот {slot}',
                        length: 'Длина (мм):',
                        speed: 'Скорость (мм/с):',
                        execute: 'Выполнить',
                        cancel: 'Отмена'
                    },
                    notifications: {
                        websocketConnected: 'WebSocket подключен',
                        websocketDisconnected: 'WebSocket отключен',
                        apiError: 'Ошибка API: {error}',
                        loadError: 'Ошибка загрузки статуса: {error}',
                        commandSuccess: 'Команда {command} выполнена успешно',
                        commandSent: 'Команда {command} отправлена',
                        commandError: 'Ошибка: {error}',
                        commandErrorGeneric: 'Ошибка выполнения команды',
                        executeError: 'Ошибка выполнения команды: {error}',
                        feedAssistOn: 'Feed assist включен для слота {index}',
                        feedAssistOff: 'Feed assist выключен для слота {index}',
                        feedAssistAllOff: 'Feed assist выключен для всех слотов',
                        feedAssistAllOffError: 'Не удалось отключить feed assist',
                        refreshStatus: 'Статус обновлен',
                        validation: {
                            tempRange: 'Температура должна быть от 20 до 55°C',
                            durationMin: 'Длительность должна быть минимум 1 минута',
                            feedLength: 'Длина должна быть минимум 1 мм',
                            retractLength: 'Длина должна быть минимум 1 мм'
                        }
                    },
                    statusMap: {
                        ready: 'Готов',
                        busy: 'Занят',
                        unknown: 'Неизвестно',
                        disconnected: 'Отключено'
                    },
                    dryerStatusMap: {
                        drying: 'Сушка',
                        stop: 'Остановлена'
                    },
                    slotStatusMap: {
                        ready: 'Готов',
                        empty: 'Пустой',
                        busy: 'Занят',
                        unknown: 'Неизвестно'
                    },
                    rfidStatusMap: {
                        0: 'Не найдено',
                        1: 'Ошибка',
                        2: 'Идентифицировано',
                        3: 'Идентификация...'
                    },
                    common: {
                        unknown: 'Неизвестно'
                    },
                    time: {
                        hours: 'ч',
                        minutes: 'мин',
                        minutesShort: 'м',
                        secondsShort: 'с'
                    }
                },
                en: {
                    header: {
                        title: '🎨 ValgACE Control Panel',
                        connectionLabel: 'Status',
                        connected: 'Connected',
                        disconnected: 'Disconnected'
                    },
                    cards: {
                        deviceStatus: 'Device Status',
                        dryer: 'Dryer Control',
                        slots: 'Filament Slots',
                        quickActions: 'Quick Actions'
                    },
                    deviceInfo: {
                        model: 'Model',
                        firmware: 'Firmware',
                        status: 'Status',
                        temp: 'Temperature',
                        fan: 'Fan Speed',
                        rfid: 'RFID',
                        rfidOn: 'Enabled',
                        rfidOff: 'Disabled'
                    },
                    dryer: {
                        status: 'Status',
                        targetTemp: 'Target Temperature',
                        duration: 'Set Duration',
                        remainingTime: 'Remaining Time',
                        currentTemperature: 'Current Temperature',
                        inputs: {
                            temp: 'Temperature (°C):',
                            duration: 'Duration (min):'
                        },
                        buttons: {
                            start: 'Start Drying',
                            stop: 'Stop Drying'
                        }
                    },
                    slots: {
                        slot: 'Slot',
                        status: 'Status',
                        type: 'Type',
                        sku: 'SKU',
                        rfid: 'RFID'
                    },
                    quickActions: {
                        unload: 'Unload Filament',
                        stopAssist: 'Stop Assist',
                        refresh: 'Refresh Status'
                    },
                    buttons: {
                        load: 'Load',
                        park: 'Park',
                        assistOn: 'Assist ON',
                        assistOff: 'Assist',
                        feed: 'Feed',
                        retract: 'Retract'
                    },
                    dialogs: {
                        feedTitle: 'Feed Filament - Slot {slot}',
                        retractTitle: 'Retract Filament - Slot {slot}',
                        length: 'Length (mm):',
                        speed: 'Speed (mm/s):',
                        execute: 'Execute',
                        cancel: 'Cancel'
                    },
                    notifications: {
                        websocketConnected: 'WebSocket connected',
                        websocketDisconnected: 'WebSocket disconnected',
                        apiError: 'API error: {error}',
                        loadError: 'Status load error: {error}',
                        commandSuccess: 'Command {command} executed successfully',
                        commandSent: 'Command {command} sent',
                        commandError: 'Error: {error}',
                        commandErrorGeneric: 'Command execution error',
                        executeError: 'Command execution error: {error}',
                        feedAssistOn: 'Feed assist enabled for slot {index}',
                        feedAssistOff: 'Feed assist disabled for slot {index}',
                        feedAssistAllOff: 'Feed assist disabled for all slots',
                        feedAssistAllOffError: 'Failed to disable feed assist',
                        refreshStatus: 'Status refreshed',
                        validation: {
                            tempRange: 'Temperature must be between 20 and 55°C',
                            durationMin: 'Duration must be at least 1 minute',
                            feedLength: 'Length must be at least 1 mm',
                            retractLength: 'Length must be at least 1 mm'
                        }
                    },
                    statusMap: {
                        ready: 'Ready',
                        busy: 'Busy',
                        unknown: 'Unknown',
                        disconnected: 'Disconnected'
                    },
                    dryerStatusMap: {
                        drying: 'Drying',
                        stop: 'Stopped'
                    },
                    slotStatusMap: {
                        ready: 'Ready',
                        empty: 'Empty',
                        busy: 'Busy',
                        unknown: 'Unknown'
                    },
                    rfidStatusMap: {
                        0: 'Not found',
                        1: 'Error',
                        2: 'Identified',
                        3: 'Identifying...'
                    },
                    common: {
                        unknown: 'Unknown'
                    },
                    time: {
                        hours: 'h',
                        minutes: 'min',
                        minutesShort: 'm',
                        secondsShort: 's'
                    }
                }
            },
            // Connection
            wsConnected: false,
            ws: null,
            apiBase: ACE_DASHBOARD_CONFIG?.apiBase || window.location.origin,
            
            // Device Status
            deviceStatus: {
                status: 'unknown',
                model: '',
                firmware: '',
                temp: 0,
                fan_speed: 0,
                enable_rfid: 0
            },
            
            // Dryer
            dryerStatus: {
                status: 'stop',
                target_temp: 0,
                duration: 0,
                remain_time: 0
            },
            dryingTemp: ACE_DASHBOARD_CONFIG?.defaults?.dryingTemp || 50,
            dryingDuration: ACE_DASHBOARD_CONFIG?.defaults?.dryingDuration || 240,
            
            // Slots
            slots: [],
            currentTool: -1,
            feedAssistSlot: -1,  // Индекс слота с активным feed assist (-1 = выключен)
            
            // Modals
            showFeedModal: false,
            showRetractModal: false,
            feedSlot: 0,
            feedLength: ACE_DASHBOARD_CONFIG?.defaults?.feedLength || 50,
            feedSpeed: ACE_DASHBOARD_CONFIG?.defaults?.feedSpeed || 25,
            retractSlot: 0,
            retractLength: ACE_DASHBOARD_CONFIG?.defaults?.retractLength || 50,
            retractSpeed: ACE_DASHBOARD_CONFIG?.defaults?.retractSpeed || 25,
            
            // Notifications
            notification: {
                show: false,
                message: '',
                type: 'info'
            }
        };
    },
    
    mounted() {
        this.connectWebSocket();
        this.loadStatus();
        this.updateDocumentTitle();
        
            // Auto-refresh
        const refreshInterval = ACE_DASHBOARD_CONFIG?.autoRefreshInterval || 5000;
        setInterval(() => {
            if (this.wsConnected) {
                this.loadStatus();
            }
        }, refreshInterval);
    },
    
    methods: {
        t(path, params = {}) {
            const keys = path.split('.');
            let value = this.translations[this.currentLanguage];
            for (const key of keys) {
                if (value && Object.prototype.hasOwnProperty.call(value, key)) {
                    value = value[key];
                } else {
                    return undefined;
                }
            }
            if (typeof value === 'string') {
                return value.replace(/\{(\w+)\}/g, (match, token) => {
                    return Object.prototype.hasOwnProperty.call(params, token) ? params[token] : match;
                });
            }
            return undefined;
        },

        setLanguage(lang) {
            this.currentLanguage = lang;
            localStorage.setItem('valgace-language', lang);
            this.updateDocumentTitle();
        },

        updateDocumentTitle() {
            document.title = this.t('header.title');
        },

        // WebSocket Connection
        connectWebSocket() {
            const wsUrl = getWebSocketUrl();
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.wsConnected = true;
                this.showNotification(this.t('notifications.websocketConnected'), 'success');
                this.subscribeToStatus();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.wsConnected = false;
            };
            
            this.ws.onclose = () => {
                this.wsConnected = false;
                this.showNotification(this.t('notifications.websocketDisconnected'), 'error');
                // Reconnect after configured timeout
                const reconnectTimeout = ACE_DASHBOARD_CONFIG?.wsReconnectTimeout || 3000;
                setTimeout(() => this.connectWebSocket(), reconnectTimeout);
            };
        },
        
        subscribeToStatus() {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
            
            this.ws.send(JSON.stringify({
                jsonrpc: "2.0",
                method: "printer.objects.subscribe",
                params: {
                    objects: {
                        "ace": null
                    }
                },
                id: 5434
            }));
        },
        
        handleWebSocketMessage(data) {
            if (data.method === "notify_status_update") {
                const aceData = data.params[0]?.ace;
                if (aceData) {
                    this.updateStatus(aceData);
                }
            }
        },
        
        // API Calls
        async loadStatus() {
            try {
                const response = await fetch(`${this.apiBase}/server/ace/status`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                if (ACE_DASHBOARD_CONFIG?.debug) {
                    console.log('Status response:', result);
                }
                
                if (result.error) {
                    console.error('API error:', result.error);
                    this.showNotification(this.t('notifications.apiError', { error: result.error }), 'error');
                    return;
                }
                
                // API может возвращать данные напрямую или в result.result
                // Обрабатываем оба случая
                const statusData = result.result || result;
                
                // Проверяем, что это действительно данные статуса (есть хотя бы одно из полей)
                if (statusData && typeof statusData === 'object' && 
                    (statusData.status !== undefined || statusData.slots !== undefined || statusData.dryer !== undefined)) {
                    this.updateStatus(statusData);
                } else {
                    console.warn('Invalid status data in response:', result);
                }
            } catch (error) {
                console.error('Error loading status:', error);
                this.showNotification(this.t('notifications.loadError', { error: error.message }), 'error');
            }
        },
        
        updateStatus(data) {
            if (!data || typeof data !== 'object') {
                console.warn('Invalid status data:', data);
                return;
            }
            
            if (ACE_DASHBOARD_CONFIG?.debug) {
                console.log('Updating status with data:', data);
            }
            
            // Обновляем статус устройства (обновляем только если поля присутствуют)
            if (data.status !== undefined) {
                this.deviceStatus.status = data.status;
            }
            if (data.model !== undefined) {
                this.deviceStatus.model = data.model;
            }
            if (data.firmware !== undefined) {
                this.deviceStatus.firmware = data.firmware;
            }
            if (data.temp !== undefined) {
                this.deviceStatus.temp = data.temp;
            }
            if (data.fan_speed !== undefined) {
                this.deviceStatus.fan_speed = data.fan_speed;
            }
            if (data.enable_rfid !== undefined) {
                this.deviceStatus.enable_rfid = data.enable_rfid;
            }
            
            // Обновляем статус сушилки
            const dryer = data.dryer || data.dryer_status;
            
            if (dryer && typeof dryer === 'object') {
                // duration всегда в минутах (данные из ace.py уже нормализованы)
                if (dryer.duration !== undefined) {
                    this.dryerStatus.duration = Math.floor(dryer.duration); // Целое число минут
                }
                
                // remain_time: данные из ace.py уже конвертированы из секунд в минуты
                // Но на всякий случай проверяем: если значение слишком большое (> 1440 минут = 24 часа),
                // значит оно не было конвертировано и все еще в секундах
                if (dryer.remain_time !== undefined) {
                    let remain_time = dryer.remain_time;
                    
                    // Если remain_time > 1440 (24 часа в минутах), это точно секунды, конвертируем
                    if (remain_time > 1440) {
                        remain_time = remain_time / 60;
                    }
                    // Также проверяем: если remain_time значительно больше duration (в минутах), 
                    // и значение > 60, вероятно это секунды
                    else if (this.dryerStatus.duration > 0 && remain_time > this.dryerStatus.duration * 1.5 && remain_time > 60) {
                        remain_time = remain_time / 60;
                    }
                    
                    this.dryerStatus.remain_time = remain_time; // Может быть дробным (минуты.секунды)
                }
                if (dryer.status !== undefined) {
                    this.dryerStatus.status = dryer.status;
                }
                if (dryer.target_temp !== undefined) {
                    this.dryerStatus.target_temp = dryer.target_temp;
                }
            }
            
            // Обновляем слоты (если данные присутствуют)
            if (data.slots !== undefined) {
                if (Array.isArray(data.slots)) {
                    // Обновляем слоты, даже если массив пустой
                    this.slots = data.slots.map(slot => ({
                        index: slot.index !== undefined ? slot.index : -1,
                        status: slot.status || 'unknown',
                        type: slot.type || '',
                        color: Array.isArray(slot.color) ? slot.color : [0, 0, 0],
                        sku: slot.sku || '',
                        rfid: slot.rfid !== undefined ? slot.rfid : 0
                    }));
                } else {
                    // Если slots есть, но это не массив - предупреждение, но не очищаем данные
                    console.warn('Slots data is not an array:', data.slots);
                }
            }
            // Если data.slots === undefined, просто не обновляем слоты (сохраняем текущие)
            
            // Обновляем состояние feed assist из статуса
            if (data.feed_assist_slot !== undefined) {
                this.feedAssistSlot = data.feed_assist_slot;
            } else if (data.feed_assist_count !== undefined && data.feed_assist_count > 0) {
                // Если feed_assist_slot не указан, но feed_assist_count > 0,
                // значит feed assist активен, но мы не знаем для какого слота
                // Оставляем текущее значение или пытаемся определить по другим признакам
                if (this.feedAssistSlot === -1) {
                    // Если не знаем, какой слот активен, но assist работает,
                    // можно попробовать определить по текущему инструменту
                    if (this.currentTool !== -1 && this.currentTool < 4) {
                        this.feedAssistSlot = this.currentTool;
                    }
                }
            } else {
                // Если feed_assist_count = 0, значит assist выключен
                this.feedAssistSlot = -1;
            }
            
            if (ACE_DASHBOARD_CONFIG?.debug) {
                console.log('Status updated:', {
                    deviceStatus: this.deviceStatus,
                    dryerStatus: this.dryerStatus,
                    slotsCount: this.slots.length,
                    feedAssistSlot: this.feedAssistSlot
                });
            }
        },
        
        async executeCommand(command, params = {}) {
            try {
                const response = await fetch(`${this.apiBase}/server/ace/command`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        command: command,
                        params: params
                    })
                });
                
                const result = await response.json();
                
                if (ACE_DASHBOARD_CONFIG?.debug) {
                    console.log('Command response:', result);
                }
                
                if (result.error) {
                    this.showNotification(this.t('notifications.apiError', { error: result.error }), 'error');
                    return false;
                }
                
                if (result.result) {
                    if (result.result.success !== false && !result.result.error) {
                        this.showNotification(this.t('notifications.commandSuccess', { command }), 'success');
                        // Reload status after command
                        setTimeout(() => this.loadStatus(), 1000);
                        return true;
                    } else {
                        const errorMsg = result.result.error || result.result.message || this.t('notifications.commandErrorGeneric');
                        this.showNotification(this.t('notifications.commandError', { error: errorMsg }), 'error');
                        return false;
                    }
                }
                
                // Если нет result, но и нет ошибки - считаем успехом
                this.showNotification(this.t('notifications.commandSent', { command }), 'success');
                setTimeout(() => this.loadStatus(), 1000);
                return true;
            } catch (error) {
                console.error('Error executing command:', error);
                this.showNotification(this.t('notifications.executeError', { error: error.message }), 'error');
                return false;
            }
        },
        
        // Device Actions
        async changeTool(tool) {
            const success = await this.executeCommand('ACE_CHANGE_TOOL', { TOOL: tool });
            if (success) {
                this.currentTool = tool;
            }
        },
        
        async unloadFilament() {
            await this.changeTool(-1);
        },

        async stopAssist() {
            let anySuccess = false;
            for (let index = 0; index < 4; index++) {
                const success = await this.executeCommand('ACE_DISABLE_FEED_ASSIST', { INDEX: index });
                if (success) {
                    anySuccess = true;
                }
            }
            if (anySuccess) {
                this.feedAssistSlot = -1;
                this.showNotification(this.t('notifications.feedAssistAllOff'), 'success');
            } else {
                this.showNotification(this.t('notifications.feedAssistAllOffError'), 'error');
            }
        },
        
        async parkToToolhead(index) {
            await this.executeCommand('ACE_PARK_TO_TOOLHEAD', { INDEX: index });
        },
        
        // Feed Assist Actions
        async toggleFeedAssist(index) {
            if (this.feedAssistSlot === index) {
                // Выключаем feed assist для текущего слота
                await this.disableFeedAssist(index);
            } else {
                // Включаем feed assist для нового слота
                // Сначала выключаем предыдущий, если был активен
                if (this.feedAssistSlot !== -1) {
                    await this.disableFeedAssist(this.feedAssistSlot);
                }
                await this.enableFeedAssist(index);
            }
        },
        
        async enableFeedAssist(index) {
            const success = await this.executeCommand('ACE_ENABLE_FEED_ASSIST', { INDEX: index });
            if (success) {
                this.feedAssistSlot = index;
                this.showNotification(this.t('notifications.feedAssistOn', { index }), 'success');
            }
        },
        
        async disableFeedAssist(index) {
            const success = await this.executeCommand('ACE_DISABLE_FEED_ASSIST', { INDEX: index });
            if (success) {
                this.feedAssistSlot = -1;
                this.showNotification(this.t('notifications.feedAssistOff', { index }), 'success');
            }
        },
        
        // Dryer Actions
        async startDrying() {
            if (this.dryingTemp < 20 || this.dryingTemp > 55) {
                this.showNotification(this.t('notifications.validation.tempRange'), 'error');
                return;
            }
            
            if (this.dryingDuration < 1) {
                this.showNotification(this.t('notifications.validation.durationMin'), 'error');
                return;
            }
            
            await this.executeCommand('ACE_START_DRYING', {
                TEMP: this.dryingTemp,
                DURATION: this.dryingDuration
            });
        },
        
        async stopDrying() {
            await this.executeCommand('ACE_STOP_DRYING');
        },
        
        // Feed/Retract Actions
        showFeedDialog(slot) {
            this.feedSlot = slot;
            this.feedLength = ACE_DASHBOARD_CONFIG?.defaults?.feedLength || 50;
            this.feedSpeed = ACE_DASHBOARD_CONFIG?.defaults?.feedSpeed || 25;
            this.showFeedModal = true;
        },
        
        closeFeedDialog() {
            this.showFeedModal = false;
        },
        
        async executeFeed() {
            if (this.feedLength < 1) {
                this.showNotification(this.t('notifications.validation.feedLength'), 'error');
                return;
            }
            
            const success = await this.executeCommand('ACE_FEED', {
                INDEX: this.feedSlot,
                LENGTH: this.feedLength,
                SPEED: this.feedSpeed
            });
            
            if (success) {
                this.closeFeedDialog();
            }
        },
        
        showRetractDialog(slot) {
            this.retractSlot = slot;
            this.retractLength = ACE_DASHBOARD_CONFIG?.defaults?.retractLength || 50;
            this.retractSpeed = ACE_DASHBOARD_CONFIG?.defaults?.retractSpeed || 25;
            this.showRetractModal = true;
        },
        
        closeRetractDialog() {
            this.showRetractModal = false;
        },
        
        async executeRetract() {
            if (this.retractLength < 1) {
                this.showNotification(this.t('notifications.validation.retractLength'), 'error');
                return;
            }
            
            const success = await this.executeCommand('ACE_RETRACT', {
                INDEX: this.retractSlot,
                LENGTH: this.retractLength,
                SPEED: this.retractSpeed
            });
            
            if (success) {
                this.closeRetractDialog();
            }
        },
        
        async refreshStatus() {
            await this.loadStatus();
            this.showNotification(this.t('notifications.refreshStatus'), 'success');
        },
        
        // Utility Functions
        getStatusText(status) {
            return this.t(`statusMap.${status}`) || status;
        },
        
        getDryerStatusText(status) {
            return this.t(`dryerStatusMap.${status}`) || status;
        },
        
        getSlotStatusText(status) {
            return this.t(`slotStatusMap.${status}`) || status;
        },
        
        getRfidStatusText(rfid) {
            const value = this.t(`rfidStatusMap.${rfid}`);
            return value === `rfidStatusMap.${rfid}` ? this.t('common.unknown') : value;
        },
        
        getColorHex(color) {
            if (!color || !Array.isArray(color) || color.length < 3) {
                return '#000000';
            }
            const r = Math.max(0, Math.min(255, color[0])).toString(16).padStart(2, '0');
            const g = Math.max(0, Math.min(255, color[1])).toString(16).padStart(2, '0');
            const b = Math.max(0, Math.min(255, color[2])).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        },
        
        formatTime(minutes) {
            if (!minutes || minutes <= 0) return `0 ${this.t('time.minutes')}`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (hours > 0) {
                return `${hours}${this.t('time.hours')} ${mins}${this.t('time.minutesShort')}`;
            }
            return `${mins} ${this.t('time.minutes')}`;
        },
        
        formatRemainingTime(minutes) {
            // Форматирует оставшееся время сушки в формате "119м 59с"
            // minutes может быть дробным числом (119.983 = 119 минут 59 секунд)
            if (!minutes || minutes <= 0) return `0${this.t('time.minutesShort')} 0${this.t('time.secondsShort')}`;
            
            const totalMinutes = Math.floor(minutes);
            const fractionalPart = minutes - totalMinutes;
            const seconds = Math.round(fractionalPart * 60);
            
            if (totalMinutes > 0) {
                if (seconds > 0) {
                    return `${totalMinutes}${this.t('time.minutesShort')} ${seconds}${this.t('time.secondsShort')}`;
                }
                return `${totalMinutes}${this.t('time.minutesShort')}`;
            }
            return `${seconds}${this.t('time.secondsShort')}`;
        },
        
        showNotification(message, type = 'info') {
            this.notification = {
                show: true,
                message: message,
                type: type
            };
            
            setTimeout(() => {
                this.notification.show = false;
            }, 3000);
        }
    }
}).mount('#app');

