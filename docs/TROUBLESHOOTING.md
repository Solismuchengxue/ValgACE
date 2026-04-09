# ValgACE 故障排除

ValgACE 常见问题解决指南。

## 目录

1. [设备无法连接](#设备无法连接)
2. [停靠问题](#停靠问题)
3. [换刀问题](#换刀问题)
4. [送料/回退问题](#送料回退问题)
5. [烘干问题](#烘干问题)
6. [性能问题](#性能问题)
7. [连接诊断](#连接诊断)

---

## 设备无法连接

### 症状

- 状态显示 `disconnected`
- 命令无法执行
- 日志中出现连接错误

### 解决方案

#### 1. 检查 USB 连接

```bash
# 检查系统是否识别设备
lsusb | grep -i anycubic

# 应显示 VID:PID 为 28e9:018a 的设备
```

如果看不到设备：
- 检查 USB 线缆
- 尝试其他 USB 端口
- 检查 ACE 设备供电

#### 2. 检查端口

```bash
# 查看所有 USB 设备
ls -la /dev/serial/by-id/

# 应看到类似以下设备：
# usb-ANYCUBIC_ACE_1-if00 -> ../../ttyACM0
```

**如果没有设备：**
- 系统未识别设备
- 检查权限：`sudo chmod 666 /dev/ttyACM0`（临时）

#### 3. 检查配置

确保 `ace.cfg` 中指定了正确的端口：

```ini
[ace]
serial: /dev/serial/by-id/usb-ANYCUBIC_ACE_1-if00
```

**或使用自动搜索：**
```ini
[ace]
# 未指定 serial - 模块将尝试自动查找
baud: 115200
```

#### 4. 检查权限

```bash
# 将用户添加到 dialout 组
sudo usermod -a -G dialout $USER

# 重新登录以应用更改
```

#### 5. 检查端口占用

```bash
# 检查端口是否被其他进程使用
lsof /dev/ttyACM0
```

如果端口被占用 - 终止进程或重启 Klipper。

---

## 停靠问题

### 症状：停靠未完成

**可能原因：**

1. **耗材未到达喷嘴**
   - 检查耗材是否能顺利通过整个路径
   - 检查 ACE 中的耗材张力
   - 确保热端已加热到工作温度

2. **`park_hit_count` 值过高**
   ```ini
   # 在 ace.cfg 中减小该值
   park_hit_count: 3  # 而不是 5
   ```

3. **喷嘴限位开关问题**
   - 检查喷嘴限位开关的工作状态
   - 确保正确连接

**诊断：**
```gcode
# 检查停靠状态
ACE_STATUS

# 查看 feed_assist_count 值
# 该值应在停靠期间增加
```

### 症状：停靠完成过快

**解决方案：**
```ini
# 增加 park_hit_count
park_hit_count: 7  # 而不是 5
```

### 症状：错误 "Feed assist not working"

**原因：**
- 耗材在路径中卡住
- ACE 机械问题
- 料槽中没有耗材

**解决方案：**
1. 检查料槽中是否有耗材
2. 检查料槽状态：`ACE_STATUS`
3. 尝试手动送料：`ACE_FEED INDEX=0 LENGTH=50 SPEED=20`
4. 如果问题仍然存在 - 检查 ACE 机械结构

---

## 换刀问题

### 症状：换刀卡住

**诊断：**
```bash
# 检查日志
tail -f ~/printer_data/logs/klippy.log | grep -i "toolchange\|park"
```

**可能原因：**

1. **回退后料槽未就绪**
   - 增加等待时间
   - 确保回退完全完成

2. **停靠未完成**
   - 参见"停靠问题"部分

3. **宏中有错误**
   - 检查宏 `_ACE_PRE_TOOLCHANGE` 和 `_ACE_POST_TOOLCHANGE`
   - 确保它们不会阻塞执行

**解决方案：**
```gcode
# 尝试手动换刀
ACE_CHANGE_TOOL TOOL=0

# 如果不工作 - 尝试分步操作：
ACE_DISABLE_FEED_ASSIST INDEX=0  # 禁用当前
ACE_RETRACT INDEX=0 LENGTH=100 SPEED=25  # 回退
# 等待...
ACE_PARK_TO_TOOLHEAD INDEX=1  # 停靠新料槽
```

### 症状：错误 "Slot is not ready"

**原因：**
- 料槽为空
- 耗材卡住
- ACE 机械问题

**解决方案：**
1. 检查料槽的物理状态
2. 确保耗材正确穿线
3. 尝试其他料槽
4. 检查状态：`ACE_STATUS`

---

## 送料/回退问题

### 症状：耗材未送出

**诊断：**
```gcode
# 尝试送料
ACE_FEED INDEX=0 LENGTH=50 SPEED=25

# 检查状态
ACE_STATUS
```

**可能原因：**

1. **料槽为空**
   - 检查是否有耗材
   - 检查料槽状态

2. **耗材卡住**
   - 检查耗材路径
   - 手动释放卡住的耗材

3. **速度不正确**
   ```ini
   # 尝试增加速度
   feed_speed: 25
   ```

### 症状：送料/回退缓慢

**解决方案：**
```ini
# 在配置中增加速度
feed_speed: 25  # ACE Pro 最大值为 25
retract_speed: 25
```

或在命令中指定速度：
```gcode
ACE_FEED INDEX=0 LENGTH=50 SPEED=25
```

### 症状：命令未执行

**诊断：**
```gcode
# 检查设备状态
ACE_STATUS

# 如果 disconnected - 参见"设备无法连接"部分
```

---

## 烘干问题

### 症状：烘干未启动

**检查：**
```gcode
# 检查状态
ACE_STATUS

# 尝试启动烘干
ACE_START_DRYING TEMP=50 DURATION=120
```

**可能原因：**

1. **超过最高温度**
   ```ini
   # 检查设置
   max_dryer_temperature: 55
   ```

2. **参数不正确**
   - 温度应为 20-55°C
   - 时间应为 1-240 分钟

### 症状：温度未达到

**可能原因：**
- ACE 加热器问题
- 功率不足
- 通风问题

**解决方案：**
- 检查设备的物理状态
- 确保风扇正常工作
- 尝试较低的温度

---

## 性能问题

### 症状：命令运行缓慢

**解决方案：**

1. **减少超时时间：**
   ```ini
   response_timeout: 1.5  # 而不是 2.0
   read_timeout: 0.05     # 而不是 0.1
   write_timeout: 0.3     # 而不是 0.5
   ```

2. **禁用日志记录：**
   ```ini
   disable_logging: True
   ```

3. **减小队列大小：**
   ```ini
   max_queue_size: 10  # 而不是 20
   ```

### 症状：CPU 负载高

**解决方案：**
- 禁用 DEBUG 日志记录
- 减少状态检查频率
- 检查系统上的其他进程

---

## 连接诊断

### 步骤 1：检查设备

```bash
# 检查 USB 设备
lsusb | grep -i anycubic

# 预期输出：
# Bus 001 Device 003: ID 28e9:018a Anycubic ACE
```

### 步骤 2：检查端口

```bash
# 检查端口是否存在
ls -la /dev/serial/by-id/ | grep -i ace

# 应显示：
# usb-ANYCUBIC_ACE_1-if00 -> ../../ttyACM0
```

### 步骤 3：检查访问权限

```bash
# 检查权限
ls -l /dev/ttyACM0

# 应类似以下内容：
# crw-rw---- 1 root dialout 166, 0 Jan 1 12:00 /dev/ttyACM0
```

### 步骤 4：测试连接

```bash
# 尝试打开端口（替换为您的端口）
python3 -c "import serial; s=serial.Serial('/dev/ttyACM0', 115200); print('OK'); s.close()"
```

如果出现错误 - 检查权限或端口占用。

### 步骤 5：通过 Klipper 检查

```gcode
# 检查状态
ACE_STATUS

# 检查信息
ACE_DEBUG METHOD=get_info
```

---

## 常见错误及解决方案

### 错误："Connection lost"

**原因：** 与设备失去连接

**解决方案：**
1. 检查 USB 线缆
2. 重启 Klipper：`sudo systemctl restart klipper`
3. 检查日志获取详细错误信息

### 错误："Queue overflow"

**原因：** 同时发送了太多命令

**解决方案：**
```ini
# 增加队列大小
max_queue_size: 30  # 而不是 20
```

或减少命令发送频率。

### 错误："CRC mismatch"

**原因：** 数据传输错误

**解决方案：**
1. 检查 USB 线缆（可能已损坏）
2. 尝试其他 USB 端口
3. 降低通信速度（不推荐）：
   ```ini
   baud: 57600  # 而不是 115200
   ```

### 错误："Slot is not ready"

**原因：** 料槽为空或耗材未就绪

**解决方案：**
1. 检查料槽中是否有耗材
2. 检查穿线是否正确
3. 尝试其他料槽
4. 检查状态：`ACE_STATUS`

---

## 收集调试信息

如果问题未解决，请收集以下信息：

### 1. Klipper 日志

```bash
# 最后 100 行日志
tail -100 ~/printer_data/logs/klippy.log > klipper_log.txt
```

### 2. 设备状态

```gcode
ACE_STATUS
```

保存输出。

### 3. 设备信息

```gcode
ACE_DEBUG METHOD=get_info
```

### 4. 系统信息

```bash
# Klipper 版本
cd ~/klipper && git log -1

# Python 版本
python3 --version

# USB 设备
lsusb > usb_devices.txt

# 串行端口
ls -la /dev/serial/by-id/ > serial_ports.txt
```

### 5. 配置文件

```bash
# 复制 ace.cfg
cp ~/printer_data/config/ace.cfg ace_config_backup.txt
```

---

## 获取帮助

如果问题仍未解决：

1. **查阅文档：**
   - [用户指南](USER_GUIDE.md)
   - [命令参考](COMMANDS.md)
   - [配置指南](CONFIGURATION.md)

2. **在讨论区搜索：**
   - [Telegram - perdoling3d](https://t.me/perdoling3d/45834)
   - [Telegram - ERCFcrealityACEpro](https://t.me/ERCFcrealityACEpro/21334)

3. **在 GitHub 上创建 Issue：**
   - 附上收集的信息
   - 描述重现步骤
   - 指明 Klipper 版本和打印机型号

---

*最后更新日期：2025*
