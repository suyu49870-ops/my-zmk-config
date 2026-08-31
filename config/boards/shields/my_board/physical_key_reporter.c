#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/device.h>
#include <zephyr/drivers/uart.h>
#include <stdio.h>
#include <zmk/events/position_state_changed.h>
#include <zmk/event_manager.h>

LOG_MODULE_DECLARE(zmk, CONFIG_ZMK_LOG_LEVEL);

#if DT_HAS_CHOSEN(zmk_studio_rpc_uart)
#define RPC_UART_NODE DT_CHOSEN(zmk_studio_rpc_uart)
#endif

static int position_state_changed_listener(const zmk_event_t *eh) {
    const struct zmk_position_state_changed *ev = as_zmk_position_state_changed(eh);
    if (ev) {
        printk("[PK:%d:%d]\n", ev->position, ev->state);

#if DT_HAS_CHOSEN(zmk_studio_rpc_uart)
        const struct device *rpc_dev = DEVICE_DT_GET(RPC_UART_NODE);
        if (device_is_ready(rpc_dev)) {
            char buf[32];
            int len = snprintf(buf, sizeof(buf), "[PK:%d:%d]\n", ev->position, ev->state);
            for (int i = 0; i < len; i++) {
                uart_poll_out(rpc_dev, buf[i]);
            }
        }
#endif
    }
    return 0;
}
#include <zmk/events/sensor_event.h>

static int sensor_event_listener(const zmk_event_t *eh) {
    const struct zmk_sensor_event *ev = as_zmk_sensor_event(eh);
    if (ev && ev->channel_data_size > 0) {
        int val = ev->channel_data[0].value.val1;
        printk("[KNOB:%d:%d]\n", ev->sensor_index, val);

#if DT_HAS_CHOSEN(zmk_studio_rpc_uart)
        const struct device *rpc_dev = DEVICE_DT_GET(RPC_UART_NODE);
        if (device_is_ready(rpc_dev)) {
            char buf[32];
            int len = snprintf(buf, sizeof(buf), "[KNOB:%d:%d]\n", ev->sensor_index, val);
            for (int i = 0; i < len; i++) {
                uart_poll_out(rpc_dev, buf[i]);
            }
        }
#endif
    }
    return 0;
}

ZMK_LISTENER(position_reporter, position_state_changed_listener);
ZMK_SUBSCRIPTION(position_reporter, zmk_position_state_changed);

ZMK_LISTENER(sensor_reporter, sensor_event_listener);
ZMK_SUBSCRIPTION(sensor_reporter, zmk_sensor_event);
