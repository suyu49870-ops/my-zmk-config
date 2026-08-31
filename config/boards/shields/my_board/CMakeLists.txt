if(CONFIG_ZMK_DISPLAY_STATUS_SCREEN_CUSTOM)
  target_sources(app PRIVATE custom_status_screen.c)
endif()

target_sources(app PRIVATE physical_key_reporter.c)
