# ACE 温度传感器 Klipper 模块

## 描述

**temperature_ace** 模块提供了 ACE 设备温度与 Klipper 温度传感器系统的集成。这使得您可以通过标准的 Klipper 界面（Mainsail、Fluidd、KlipperScreen）监控 ACE 温度，并在宏中使用它。

## 功能特性

- ✅ 在 Web 界面中显示 ACE 温度
- ✅ 监控最低和最高温度
- ✅ 在 G-code 宏中使用
- ✅ 过热保护（自动关机）
- ✅ 温度统计日志记录
- ✅ Moonraker API 集成

## 安装

### 1. 文件已创建

模块位于：
```
klippy/extras/temperature_ace.py
```

### 2. 加载模块

**重要！** 必须先加载模块，然后才能使用 sensor_type。

在 `printer.cfg` 中按**以下顺序**添加：

```ini
# 步骤 1：加载 temperature_ace 模块
[temperature_ace]

# 步骤 2：使用 sensor_type
[temperature_sensor ace_chamber]
sensor_type: temperature_ace
min_temp: 0
max_temp: 70
```

**或者通过 include：**

```ini
# 步骤 1：加载模块
[include temperature_ace.cfg]

# 步骤 2：使用 sensor_type
[temperature_sensor ace_chamber]
sensor_type: temperature_ace
min_temp: 0
max_temp: 70
```

### 3. 重启 Klipper

```gcode
RESTART
```

## 配置

### 基本配置

```ini
[temperature_sensor ace_chamber]
sensor_type: temperature_ace  # 传感器类型（必需）
min_temp: 0                   # 最低温度（°C）
max_temp: 70                  # 最高温度（°C）
```

### 参数说明

| 参数 | 必需 | 描述 | 默认值 |
|----------|--------------|----------|----------------------|
| `sensor_type` | ✅ 是 | 传感器类型 | `temperature_ace` |
| `min_temp` | ✅ 是 | 最小允许温度（°C） | - |
| `max_temp` | ✅ 是 | 最大允许温度（°C） | - |

### 推荐值

```ini
# 用于腔室监控
min_temp: 0
max_temp: 70

# 用于烘干监控
min_temp: 0
max_temp: 60  # ACE 最大烘干温度 = 55°C
```

**重要：** 如果温度超出 `min_temp`/`max_temp` 范围，Klipper 将执行**紧急关机**！

## 使用方法

### 在 Web 界面中查看

配置完成后，ACE 温度将显示在：

**Mainsail/Fluidd：**
- 主页面板的 "Temperature" 部分
- 实时温度图表
- 温度历史记录

**KlipperScreen：**
- 主屏幕
- Temperature 菜单

### 在 G-code 宏中使用

```gcode
[gcode_macro CHECK_CHAMBER_TEMP]
gcode:
    {% set ace_temp = printer["temperature_sensor ace_chamber"].temperature %}
    M118 ACE 温度：{ace_temp}°C
```

### 访问统计数据

```gcode
[gcode_macro ACE_TEMP_STATS]
gcode:
    {% set sensor = printer["temperature_sensor ace_chamber"] %}
    {% set current = sensor.temperature %}
    {% set min = sensor.measured_min_temp %}
    {% set max = sensor.measured_max_temp %}
    
    M118 当前：{current}°C
    M118 最低：{min}°C
    M118 最高：{max}°C
```

## 使用示例

### 示例 1：腔室温度监控

```ini
[temperature_sensor ace_chamber]
sensor_type: temperature_ace
min_temp: 0
max_temp: 70
```

```gcode
[gcode_macro START_PRINT]
gcode:
    {% set chamber_temp = printer["temperature_sensor ace_chamber"].temperature %}
    
    M118 开始打印，腔室温度：{chamber_temp}°C
    
    # 您的 start_print 逻辑
    # ...
```

### 示例 2：过热警告

```ini
[temperature_sensor ace_monitor]
sensor_type: temperature_ace
min_temp: 0
max_temp: 65  # 超温时关机
```

```gcode
[gcode_macro MONITOR_ACE_TEMP]
gcode:
    {% set temp = printer["temperature_sensor ace_monitor"].temperature %}
    
    {% if temp > 55 %}
        M118 警告：ACE 温度过高（{temp}°C）
        # 可选：停止烘干
        ACE_STOP_DRYING
    {% elif temp > 60 %}
        M118 严重：ACE 温度临界（{temp}°C）！
        PAUSE
    {% endif %}
```

### 示例 3：定期监控

```gcode
[delayed_gcode ace_temp_monitor]
initial_duration: 60.0
gcode:
    {% set sensor = printer["temperature_sensor ace_chamber"] %}
    {% set temp = sensor.temperature %}
    {% set min = sensor.measured_min_temp %}
    {% set max = sensor.measured_max_temp %}
    
    M118 ACE：{temp}°C（最低：{min}°C，最高：{max}°C）
    
    # 每 5 分钟继续监控
    UPDATE_DELAYED_GCODE ID=ace_temp_monitor DURATION=300
```

### 示例 4：条件启动打印

```gcode
[gcode_macro SMART_START_PRINT]
gcode:
    {% set target_chamber = params.CHAMBER|default(30)|float %}
    {% set chamber_temp = printer["temperature_sensor ace_chamber"].temperature %}
    
    # 检查腔室温度
    {% if chamber_temp < target_chamber %}
        M118 腔室温度过低（{chamber_temp}°C），需要加热
        # 开启腔室加热或等待
        TEMPERATURE_WAIT SENSOR="temperature_sensor ace_chamber" MINIMUM={target_chamber}
    {% endif %}
    
    M118 腔室就绪（{chamber_temp}°C）
    # 继续打印
```

### 示例 5：与烘干集成

```gcode
[gcode_macro START_DRYING_MONITORED]
gcode:
    {% set TEMP = params.TEMP|default(50)|int %}
    {% set DURATION = params.DURATION|default(120)|int %}
    
    M118 开始以 {TEMP}°C 烘干 {DURATION} 分钟
    ACE_START_DRYING TEMP={TEMP} DURATION={DURATION}
    
    # 烘干期间监控温度
    UPDATE_DELAYED_GCODE ID=drying_monitor DURATION=60

[delayed_gcode drying_monitor]
gcode:
    {% set dryer = printer.ace._info.dryer %}
    {% set temp = printer["temperature_sensor ace_chamber"].temperature %}
    
    {% if dryer.status == 'run' %}
        M118 烘干中：{temp}°C / {dryer.target_temp}°C（剩余：{dryer.remain_time/60}分钟）
        UPDATE_DELAYED_GCODE ID=drying_monitor DURATION=60
    {% else %}
        M118 烘干完成
    {% endif %}
```

## 技术细节

### 模块工作原理

1. **传感器注册：**
   - 模块在 `heaters` 系统中注册为传感器工厂
   - 创建对象 `temperature_ace <name>`

2. **周期性读取：**
   - 每秒一次（`ACE_REPORT_TIME = 1.0`）
   - 从 ACE 模块读取 `ace._info['temp']`
   - 使用新的温度值调用回调函数

3. **统计跟踪：**
   - 自启动以来的最低温度
   - 自启动以来的最高温度
   - 当前温度

4. **越界保护：**
   - 检查 `min_temp` 和 `max_temp`
   - 超限时执行紧急关机

### 温度来源

温度从以下位置读取：
```python
ace._info['temp']
```

该值由 ACE 模块通过以下方式更新：
- 周期性 `get_status` 请求（正常模式下每秒 1 次）
- 停放期间的频繁请求（每 0.2 秒）

### 更新间隔

- **从 ACE 读取：** 每 1 秒（通过 `_writer_loop`）
- **传感器更新：** 每 1 秒（`ACE_REPORT_TIME`）
- **UI 显示：** 取决于 UI 设置（通常 1-2 秒）

### 精度

来自 ACE 设备的温度：
- **分辨率：** 1°C（设备提供的整数值）
- **精度：** 取决于 ACE 传感器（约 ±1-2°C）
- **范围：** 0-70°C

## Moonraker API

温度可通过 Moonraker API 获取：

```python
# 当前温度
printer.temperature_sensor.ace_chamber.temperature

# 最低温度
printer.temperature_sensor.ace_chamber.measured_min_temp

# 最高温度
printer.temperature_sensor.ace_chamber.measured_max_temp
```

### API 请求示例

```bash
# HTTP GET 请求
curl http://localhost:7125/printer/objects/query?temperature_sensor
```

**响应：**
```json
{
  "result": {
    "status": {
      "temperature_sensor": {
        "ace_chamber": {
          "temperature": 28.0,
          "measured_min_temp": 24.5,
          "measured_max_temp": 55.3
        }
      }
    }
  }
}
```

## 故障排除

### 问题：温度始终为 0

**原因：**
1. ACE 模块未加载
2. ACE 设备未连接
3. 未从设备获取状态

**解决方案：**
```gcode
# 检查 ACE 模块
ACE_STATUS

# 检查连接
ACE_DEBUG METHOD=get_status

# 查看日志
# journalctl -u klipper -f | grep -i "temperature_ace"
```

### 问题：温度不更新

**原因：**
1. ACE 模块未接收状态更新
2. 串口连接问题

**解决方案：**
```gcode
# 检查 ACE 是否接收更新
ACE_STATUS

# 日志中应显示：
# "ACE temperature sensor: ACE module found"
```

### 问题：因温度导致 Klipper 关机

**症状：**
```
ACE temperature 71.0 above maximum temperature of 70.0
```

**解决方案：**
```ini
# 增加配置中的 max_temp
[temperature_sensor ace_chamber]
sensor_type: temperature_ace
min_temp: 0
max_temp: 75  # 已增加
```

### 问题：多个传感器显示相同值

**这是正常的！** 所有类型为 `temperature_ace` 的传感器都从同一源读取温度（ACE 设备只有一个温度传感器）。

如果需要不同的值，请使用不同的源：
```ini
[temperature_sensor ace]
sensor_type: temperature_ace

[temperature_sensor raspberry_pi]
sensor_type: temperature_host

[temperature_sensor mcu]
sensor_type: temperature_mcu
```

## 温度图表

### 在 Mainsail/Fluidd 中

ACE 温度将自动出现在：
1. 温度图表（Temperature Chart）
2. 主页的传感器列表
3. 温度历史记录

### 显示设置

在 Mainsail/Fluidd 中可以：
- 启用/禁用图表显示
- 配置线条颜色
- 设置自动缩放

## 与其他模块集成

### 与 temperature_fan 集成

基于 ACE 温度控制风扇：

```ini
[temperature_fan ace_cooling_fan]
sensor_type: temperature_ace
pin: PB15  # 风扇引脚
min_temp: 0
max_temp: 70
target_temp: 40.0  # 目标温度
max_speed: 1.0
min_speed: 0.3
control: watermark
```

当 ACE 温度超过 40°C 时，风扇将自动启动。

### 与 heater_generic 集成

**注意：** ACE 不是 PWM 控制的加热器，因此 `heater_generic` 不直接适用。但可用于监控：

```ini
# 仅用于监控，不用于控制！
[temperature_sensor ace_monitor]
sensor_type: temperature_ace
min_temp: 0
max_temp: 70
```

### 与 gcode_macro 集成

```gcode
[gcode_macro WAIT_FOR_CHAMBER]
gcode:
    {% set target = params.TARGET|default(30)|float %}
    
    M118 等待腔室温度达到：{target}°C
    TEMPERATURE_WAIT SENSOR="temperature_sensor ace_chamber" MINIMUM={target}
    M118 腔室就绪！
```

## 烘干监控

### 自动监控烘干过程

```gcode
[gcode_macro START_DRYING_WITH_MONITOR]
gcode:
    {% set TEMP = params.TEMP|default(50)|int %}
    {% set DURATION = params.DURATION|default(120)|int %}
    
    # 启动烘干
    ACE_START_DRYING TEMP={TEMP} DURATION={DURATION}
    
    # 启动监控
    UPDATE_DELAYED_GCODE ID=drying_monitor DURATION=60

[delayed_gcode drying_monitor]
gcode:
    {% set ace_temp = printer["temperature_sensor ace_chamber"].temperature %}
    {% set dryer = printer.ace._info.dryer %}
    
    {% if dryer.status == 'run' %}
        M118 烘干中：{ace_temp}°C / {dryer.target_temp}°C
        M118 剩余时间：{dryer.remain_time // 60} 分钟
        
        # 检查过热
        {% if ace_temp > dryer.target_temp + 10 %}
            M118 警告：温度过高！
            ACE_STOP_DRYING
        {% else %}
            UPDATE_DELAYED_GCODE ID=drying_monitor DURATION=60
        {% endif %}
    {% else %}
        M118 烘干完成，最终温度：{ace_temp}°C
    {% endif %}
```

## 日志记录

### Klipper 日志中的统计信息

模块会自动将统计信息写入日志：

```
Stats 123.4: temperature_ace ace_chamber: temp=28.5
```

查看方法：
```bash
journalctl -u klipper | grep "temperature_ace"
```

### 日志级别

```python
# Info 级别 - 初始化时
"ACE temperature sensor: ACE module found"

# Warning 级别 - 出现问题时
"ACE temperature sensor: ACE module not found, sensor will report 0"

# Exception 级别 - 读取错误时
"temperature_ace: Error reading temperature from ACE"
```

## 高级示例

### 腔室加热控制

```gcode
[gcode_macro HEAT_CHAMBER]
gcode:
    {% set target = params.TARGET|default(40)|float %}
    
    M118 加热腔室至 {target}°C
    
    # 开启加热（您的逻辑）
    SET_HEATER_TEMPERATURE HEATER=chamber_heater TARGET={target}
    
    # 等待达到温度
    TEMPERATURE_WAIT SENSOR="temperature_sensor ace_chamber" MINIMUM={target}
    
    M118 腔室已加热至 {target}°C
```

### 自适应冷却

```gcode
[gcode_macro ADAPTIVE_COOLING]
gcode:
    {% set temp = printer["temperature_sensor ace_chamber"].temperature %}
    
    {% if temp < 30 %}
        # 低温 - 最小冷却
        M106 S64  # 25% 风扇速度
    {% elif temp < 45 %}
        # 中等温度
        M106 S128  # 50% 速度
    {% else %}
        # 高温 - 最大冷却
        M106 S255  # 100% 速度
    {% endif %}
```

### ABS 预热

```gcode
[gcode_macro PREHEAT_ABS]
gcode:
    M118 为 ABS 预热
    
    # 热床加热
    M140 S100
    
    # 开启 ACE 烘干以预热腔室
    ACE_START_DRYING TEMP=50 DURATION=30
    
    # 等待腔室预热
    TEMPERATURE_WAIT SENSOR="temperature_sensor ace_chamber" MINIMUM=35
    
    M118 腔室预热完成，开始打印
```

## 与其他传感器比较

| 传感器 | 来源 | 间隔 | 应用 |
|--------|----------|----------|------------|
| `temperature_ace` | ACE 设备 | 1秒 | ACE 内部温度 |
| `temperature_host` | Raspberry Pi | 1秒 | 主机温度 |
| `temperature_mcu` | MCU | 0.3秒 | 微控制器温度 |
| `thermistor` | ADC 引脚 | 0.3秒 | 热床、热端等 |

## 限制

1. **单个 ACE 设备**
   - 模块仅支持一个 ACE 设备
   - 所有 `temperature_ace` 传感器从同一源读取

2. **只读**
   - 传感器仅显示温度
   - 无法通过此传感器控制 ACE 温度
   - 使用 `ACE_START_DRYING` 控制烘干

3. **依赖 ACE 模块**
   - 需要正常工作的 `ace.py` 模块
   - 如果 ACE 未连接，温度将为 0

4. **分辨率**
   - ACE 提供 1°C 分辨率的温度
   - 设备不支持小数值

## 调试

### 检查模块工作状态

```gcode
# 1. 检查模块是否已加载
# 日志中应显示：
# "ACE temperature sensor: ACE module found"

# 2. 检查温度
ACE_STATUS
# 查找 "temp": <数字>

# 3. 通过 Moonraker 检查传感器
# GET http://localhost:7125/printer/objects/query?temperature_sensor
```

### 启用调试日志

在 `printer.cfg` 中：
```ini
[temperature_sensor ace_debug]
sensor_type: temperature_ace
min_temp: 0
max_temp: 70

# 在 klippy/extras/temperature_ace.py 中临时修改：
# logging.info(...) → logging.debug(...)
```

然后在 `moonraker.conf` 中：
```ini
[debug]
log_level: debug
```

### 检查数值

```python
# 在 Klipper 控制台或通过 SSH
# 连接到 Klipper：
~/klippy-env/bin/python ~/klipper/scripts/whconsole.py

# 在控制台中执行：
ace = printer.lookup_object('ace')
print(ace._info['temp'])

sensor = printer.lookup_object('temperature_ace ace_chamber')
print(sensor.temp)
```

## 兼容性

| 组件 | 版本 | 状态 |
|-----------|--------|--------|
| Klipper | 最新版本 | ✅ 兼容 |
| Mainsail | 所有版本 | ✅ 正常工作 |
| Fluidd | 所有版本 | ✅ 正常工作 |
| KlipperScreen | 所有版本 | ✅ 正常工作 |
| Moonraker | 所有版本 | ✅ API 支持 |

## 额外功能

### 多个传感器

可以为不同目的创建多个传感器：

```ini
# 主要监控
[temperature_sensor ace]
sensor_type: temperature_ace
min_temp: 0
max_temp: 70

# 用于腔室
[temperature_sensor chamber]
sensor_type: temperature_ace
min_temp: 0
max_temp: 65

# 用于烘干
[temperature_sensor dryer]
sensor_type: temperature_ace
min_temp: 0
max_temp: 60
```

它们都将显示相同的温度，但具有不同的关机阈值。

### 温度历史

Mainsail/Fluidd 自动保存温度历史。可以查看以下时间段的图表：
- 过去 1 小时
- 过去 24 小时
- 自定义时间段

---

## 总结

`temperature_ace` 模块实现了 ACE 设备温度与 Klipper 生态系统的完全集成，允许：
- 实时监控温度
- 在自动化和宏中使用
- 防止过热
- 跟踪统计数据

---

**版本：** 1.0  
**日期：** 2025-01-07  
**作者：** ValgACE Project  
**许可证：** GNU GPLv3
