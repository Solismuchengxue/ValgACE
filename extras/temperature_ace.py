# 支持 ACE 设备温度传感器
#
# Copyright (C) 2025
#
# 本文件可根据 GNU GPLv3 许可证条款分发。
#
# 本模块为 Anycubic Color Engine (ACE) 提供温度传感器支持
# 从 ACE 设备状态中读取温度数据

import logging

ACE_REPORT_TIME = 1.0  # 每秒报告一次温度


class TemperatureACE:
    """
    从 ACE 设备读取温度的传感器
    与 Klipper 的温度监控系统集成
    """

    def __init__(self, config):
        self.printer = config.get_printer()
        self.reactor = self.printer.get_reactor()
        self.name = config.get_name().split()[-1]

        # ACE 模块引用（将在 handle_ready 中设置）
        self.ace = None

        # 温度状态
        self.temp = 0.0
        self.min_temp = 0.0
        self.max_temp = 70.0
        self.measured_min = 99999999.
        self.measured_max = 0.

        # 温度更新回调函数
        self._callback = None

        # 注册对象
        self.printer.add_object("temperature_ace " + self.name, self)

        # 如果在调试模式下，跳过定时器设置
        if self.printer.get_start_args().get('debugoutput') is not None:
            return

        # 注册定时器用于周期性读取温度
        self.sample_timer = self.reactor.register_timer(
            self._sample_ace_temperature)

        # 注册事件处理器，在连接建立后启动
        self.printer.register_event_handler("klippy:connect",
                                            self.handle_connect)
        self.printer.register_event_handler("klippy:ready",
                                            self.handle_ready)

    def handle_ready(self):
        """当 Klipper 准备就绪时，获取 ACE 模块的引用"""
        try:
            self.ace = self.printer.lookup_object('ace')
            logging.info("ACE temperature sensor: ACE module found and linked")
        except self.printer.config_error:
            logging.warning("ACE temperature sensor: ACE module not found, sensor will report 0")
            self.ace = None
        except Exception as e:
            logging.error(f"ACE temperature sensor: Error linking to ACE module: {e}")
            self.ace = None

        # 启动温度采样定时器（如果不在调试模式下）
        if hasattr(self, 'sample_timer'):
            self.reactor.update_timer(self.sample_timer, self.reactor.NOW)

    def handle_connect(self):
        """当 Klipper 连接时，启动温度采样"""
        if hasattr(self, 'sample_timer'):
            self.reactor.update_timer(self.sample_timer, self.reactor.NOW)

    def setup_minmax(self, min_temp, max_temp):
        """设置温度上下限（heaters 系统所需）"""
        self.min_temp = min_temp
        self.max_temp = max_temp

    def setup_callback(self, cb):
        """设置温度更新回调函数（heaters 系统所需）"""
        self._callback = cb

    def get_report_time_delta(self):
        """返回温度报告的时间间隔（heaters 系统所需）"""
        return ACE_REPORT_TIME

    def _sample_ace_temperature(self, eventtime):
        """从 ACE 设备周期性采样温度"""
        # 记录首次成功采样
        if not hasattr(self, '_sample_logged'):
            self._sample_logged = False

        try:
            if self.ace and hasattr(self.ace, '_info'):
                # 从 ACE 设备信息中获取温度
                ace_temp = self.ace._info.get('temp', 0.0)

                # 记录首次成功读取的温度
                if not self._sample_logged and ace_temp > 0:
                    logging.info(f"ACE temperature sensor: Started sampling, current temp={ace_temp}°C")
                    self._sample_logged = True

                self.temp = float(ace_temp)

                # 追踪最高/最低温度
                if self.temp > 0:  # 仅追踪有效温度
                    self.measured_min = min(self.measured_min, self.temp)
                    self.measured_max = max(self.measured_max, self.temp)

                # 检查温度是否超出限制
                if self.temp < self.min_temp and self.temp > 0:
                    self.printer.invoke_shutdown(
                        "ACE temperature %.1f below minimum temperature of %.1f"
                        % (self.temp, self.min_temp))
                if self.temp > self.max_temp:
                    self.printer.invoke_shutdown(
                        "ACE temperature %.1f above maximum temperature of %.1f"
                        % (self.temp, self.max_temp))
            else:
                # ACE 不可用，报告 0
                if not hasattr(self, '_warning_shown'):
                    logging.warning(f"temperature_ace: ACE module not available or _info not set (ace={self.ace}, has_info={hasattr(self.ace, '_info') if self.ace else False})")
                    self._warning_shown = True
                self.temp = 0.0
        except Exception:
            logging.exception("temperature_ace: Error reading temperature from ACE")
            self.temp = 0.0

        # 如果已设置，调用温度回调函数
        if self._callback:
            mcu = self.printer.lookup_object('mcu')
            measured_time = self.reactor.monotonic()
            self._callback(mcu.estimated_print_time(measured_time), self.temp)

        # 调度下一次采样
        return eventtime + ACE_REPORT_TIME

    def get_temp(self, eventtime):
        """获取当前温度（兼容 temperature_sensor 接口所需）"""
        return self.temp, 0.0

    def stats(self, eventtime):
        """返回用于日志记录的统计字符串"""
        return False, 'temperature_ace %s: temp=%.1f' % (self.name, self.temp)

    def get_status(self, eventtime):
        """返回供 Moonraker/API 使用的状态信息"""
        return {
            'temperature': round(self.temp, 2),
            'measured_min_temp': round(self.measured_min, 2),
            'measured_max_temp': round(self.measured_max, 2),
        }


def load_config(config):
    """注册 temperature_ace 传感器工厂"""
    # 向 heaters 系统注册传感器工厂
    pheaters = config.get_printer().load_object(config, "heaters")
    pheaters.add_sensor_factory("temperature_ace", TemperatureACE)
