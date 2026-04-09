// ValgACE 仪表板配置
// 配置 Moonraker API 和 WebSocket 地址

const ACE_DASHBOARD_CONFIG = {
    // Moonraker API 地址
    // 默认使用当前主机，但可以明确指定
    // 示例：
    // apiBase: 'http://localhost:7125',
    apiBase: 'http://192.168.0.15:7125',
    // apiBase: 'https://moonraker.example.com',
    // apiBase: window.location.origin,
    
    // WebSocket 地址
    // 默认基于 apiBase 自动确定
    // 示例：
    // wsBase: 'ws://localhost:7125',
    // wsBase: 'wss://moonraker.example.com',
    wsBase: null, // null = 自动确定
    
    // 自动更新状态的间隔（毫秒）
    // 默认：5000（5秒）
    autoRefreshInterval: 5000,
    
    // WebSocket 重新连接超时（毫秒）
    // 默认：3000（3秒）
    wsReconnectTimeout: 3000,
    
    // 启用控制台调试消息
    // 设置为 true 以调试状态加载问题
    debug: false,
    
    // 命令的默认设置
    defaults: {
        feedLength: 50,      // 默认进给长度（mm）
        feedSpeed: 25,       // 默认进给速度（mm/s）
        retractLength: 50,   // 默认回退长度（mm）
        retractSpeed: 25,    // 默认回退速度（mm/s）
        dryingTemp: 50,      // 默认干燥温度（°C）
        dryingDuration: 240  // 默认干燥持续时间（分钟）
    }
};

// 获取 WebSocket 地址的函数
function getWebSocketUrl() {
    if (ACE_DASHBOARD_CONFIG.wsBase) {
        return ACE_DASHBOARD_CONFIG.wsBase;
    }
    
    // 基于 apiBase 的自动确定
    const apiBase = ACE_DASHBOARD_CONFIG.apiBase;
    if (apiBase.startsWith('https://')) {
        return apiBase.replace('https://', 'wss://') + '/websocket';
    } else if (apiBase.startsWith('http://')) {
        return apiBase.replace('http://', 'ws://') + '/websocket';
    } else {
        // 回退到当前主机
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/websocket`;
    }
}

// 导出配置（供其他文件使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ACE_DASHBOARD_CONFIG, getWebSocketUrl };
}

