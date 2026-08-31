#include <zephyr/kernel.h>
#include <lvgl.h>
#include <zmk/display.h>
#include <zmk/display/widgets/output_status.h>
#include <zmk/display/widgets/battery_status.h>
#include <zmk/display/widgets/layer_status.h>
#include <zmk/display/widgets/wpm_status.h>

#if IS_ENABLED(CONFIG_ZMK_WIDGET_BATTERY_STATUS)
static struct zmk_widget_battery_status battery_status_widget;
#endif

#if IS_ENABLED(CONFIG_ZMK_WIDGET_OUTPUT_STATUS)
static struct zmk_widget_output_status output_status_widget;
#endif

#if IS_ENABLED(CONFIG_ZMK_WIDGET_LAYER_STATUS)
static struct zmk_widget_layer_status layer_status_widget;
#endif

lv_obj_t *zmk_display_status_screen() {
    lv_obj_t *screen = lv_obj_create(NULL);
    
    /* 深蓝背景色，与外壳搭配且不刺眼 */
    lv_obj_set_style_bg_color(screen, lv_color_hex(0x000040), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(screen, LV_OPA_COVER, LV_PART_MAIN);
    lv_obj_set_style_text_color(screen, lv_color_hex(0xFFFFFF), LV_PART_MAIN);

    /* 中间的状态文本 */
    lv_obj_t *title_label = lv_label_create(screen);
    lv_label_set_text(title_label, "ZMK Ready!\nColor TFT OK");
    lv_obj_align(title_label, LV_ALIGN_CENTER, 0, -10);

#if IS_ENABLED(CONFIG_ZMK_WIDGET_BATTERY_STATUS)
    zmk_widget_battery_status_init(&battery_status_widget, screen);
    lv_obj_align(zmk_widget_battery_status_obj(&battery_status_widget), LV_ALIGN_TOP_RIGHT, -2, 2);
    lv_obj_set_style_text_color(zmk_widget_battery_status_obj(&battery_status_widget), lv_color_hex(0xFFFFFF), LV_PART_MAIN);
#endif

#if IS_ENABLED(CONFIG_ZMK_WIDGET_OUTPUT_STATUS)
    zmk_widget_output_status_init(&output_status_widget, screen);
    lv_obj_align(zmk_widget_output_status_obj(&output_status_widget), LV_ALIGN_TOP_LEFT, 2, 2);
    lv_obj_set_style_text_color(zmk_widget_output_status_obj(&output_status_widget), lv_color_hex(0xFFFFFF), LV_PART_MAIN);
#endif

#if IS_ENABLED(CONFIG_ZMK_WIDGET_LAYER_STATUS)
    zmk_widget_layer_status_init(&layer_status_widget, screen);
    lv_obj_align(zmk_widget_layer_status_obj(&layer_status_widget), LV_ALIGN_BOTTOM_LEFT, 2, -2);
    lv_obj_set_style_text_color(zmk_widget_layer_status_obj(&layer_status_widget), lv_color_hex(0xFFFFFF), LV_PART_MAIN);
#endif

    return screen;
}
