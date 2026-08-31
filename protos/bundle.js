const zmkProtoBundle = {
  "nested": {
    "zmk": {
      "nested": {
        "studio": {
          "nested": {
            "Request": {
              "oneofs": {
                "subsystem": {
                  "oneof": [
                    "core",
                    "behaviors",
                    "keymap"
                  ]
                }
              },
              "fields": {
                "requestId": {
                  "type": "uint32",
                  "id": 1,
                  "protoName": "request_id"
                },
                "core": {
                  "type": "zmk.core.Request",
                  "id": 3
                },
                "behaviors": {
                  "type": "zmk.behaviors.Request",
                  "id": 4
                },
                "keymap": {
                  "type": "zmk.keymap.Request",
                  "id": 5
                }
              }
            },
            "Response": {
              "oneofs": {
                "type": {
                  "oneof": [
                    "requestResponse",
                    "notification"
                  ]
                }
              },
              "fields": {
                "requestResponse": {
                  "type": "RequestResponse",
                  "id": 1,
                  "protoName": "request_response"
                },
                "notification": {
                  "type": "Notification",
                  "id": 2
                }
              }
            },
            "RequestResponse": {
              "oneofs": {
                "subsystem": {
                  "oneof": [
                    "meta",
                    "core",
                    "behaviors",
                    "keymap"
                  ]
                }
              },
              "fields": {
                "requestId": {
                  "type": "uint32",
                  "id": 1,
                  "protoName": "request_id"
                },
                "meta": {
                  "type": "zmk.meta.Response",
                  "id": 2
                },
                "core": {
                  "type": "zmk.core.Response",
                  "id": 3
                },
                "behaviors": {
                  "type": "zmk.behaviors.Response",
                  "id": 4
                },
                "keymap": {
                  "type": "zmk.keymap.Response",
                  "id": 5
                }
              }
            },
            "Notification": {
              "oneofs": {
                "subsystem": {
                  "oneof": [
                    "core",
                    "keymap"
                  ]
                }
              },
              "fields": {
                "core": {
                  "type": "zmk.core.Notification",
                  "id": 2
                },
                "keymap": {
                  "type": "zmk.keymap.Notification",
                  "id": 5
                }
              }
            }
          }
        },
        "meta": {
          "nested": {
            "ErrorConditions": {
              "values": {
                "GENERIC": 0,
                "UNLOCK_REQUIRED": 1,
                "RPC_NOT_FOUND": 2,
                "MSG_DECODE_FAILED": 3,
                "MSG_ENCODE_FAILED": 4
              }
            },
            "Response": {
              "oneofs": {
                "responseType": {
                  "oneof": [
                    "noResponse",
                    "simpleError"
                  ]
                }
              },
              "fields": {
                "noResponse": {
                  "type": "bool",
                  "id": 1,
                  "protoName": "no_response"
                },
                "simpleError": {
                  "type": "ErrorConditions",
                  "id": 2,
                  "protoName": "simple_error"
                }
              }
            }
          }
        },
        "core": {
          "nested": {
            "LockState": {
              "values": {
                "ZMK_STUDIO_CORE_LOCK_STATE_LOCKED": 0,
                "ZMK_STUDIO_CORE_LOCK_STATE_UNLOCKED": 1
              }
            },
            "Request": {
              "oneofs": {
                "requestType": {
                  "oneof": [
                    "getDeviceInfo",
                    "getLockState",
                    "lock",
                    "resetSettings"
                  ]
                }
              },
              "fields": {
                "getDeviceInfo": {
                  "type": "bool",
                  "id": 1,
                  "protoName": "get_device_info"
                },
                "getLockState": {
                  "type": "bool",
                  "id": 2,
                  "protoName": "get_lock_state"
                },
                "lock": {
                  "type": "bool",
                  "id": 3
                },
                "resetSettings": {
                  "type": "bool",
                  "id": 4,
                  "protoName": "reset_settings"
                }
              }
            },
            "Response": {
              "oneofs": {
                "responseType": {
                  "oneof": [
                    "getDeviceInfo",
                    "getLockState",
                    "resetSettings"
                  ]
                }
              },
              "fields": {
                "getDeviceInfo": {
                  "type": "GetDeviceInfoResponse",
                  "id": 1,
                  "protoName": "get_device_info"
                },
                "getLockState": {
                  "type": "LockState",
                  "id": 2,
                  "protoName": "get_lock_state"
                },
                "resetSettings": {
                  "type": "bool",
                  "id": 4,
                  "protoName": "reset_settings"
                }
              }
            },
            "GetDeviceInfoResponse": {
              "fields": {
                "name": {
                  "type": "string",
                  "id": 1
                },
                "serialNumber": {
                  "type": "bytes",
                  "id": 2,
                  "protoName": "serial_number"
                }
              }
            },
            "Notification": {
              "oneofs": {
                "notificationType": {
                  "oneof": [
                    "lockStateChanged"
                  ]
                }
              },
              "fields": {
                "lockStateChanged": {
                  "type": "LockState",
                  "id": 1,
                  "protoName": "lock_state_changed"
                }
              }
            }
          }
        },
        "behaviors": {
          "nested": {
            "Request": {
              "oneofs": {
                "requestType": {
                  "oneof": [
                    "listAllBehaviors",
                    "getBehaviorDetails"
                  ]
                }
              },
              "fields": {
                "listAllBehaviors": {
                  "type": "bool",
                  "id": 1,
                  "protoName": "list_all_behaviors"
                },
                "getBehaviorDetails": {
                  "type": "GetBehaviorDetailsRequest",
                  "id": 2,
                  "protoName": "get_behavior_details"
                }
              }
            },
            "GetBehaviorDetailsRequest": {
              "fields": {
                "behaviorId": {
                  "type": "uint32",
                  "id": 1,
                  "protoName": "behavior_id"
                }
              }
            },
            "Response": {
              "oneofs": {
                "responseType": {
                  "oneof": [
                    "listAllBehaviors",
                    "getBehaviorDetails"
                  ]
                }
              },
              "fields": {
                "listAllBehaviors": {
                  "type": "ListAllBehaviorsResponse",
                  "id": 1,
                  "protoName": "list_all_behaviors"
                },
                "getBehaviorDetails": {
                  "type": "GetBehaviorDetailsResponse",
                  "id": 2,
                  "protoName": "get_behavior_details"
                }
              }
            },
            "ListAllBehaviorsResponse": {
              "fields": {
                "behaviors": {
                  "rule": "repeated",
                  "type": "uint32",
                  "id": 1
                }
              }
            },
            "GetBehaviorDetailsResponse": {
              "fields": {
                "id": {
                  "type": "uint32",
                  "id": 1
                },
                "displayName": {
                  "type": "string",
                  "id": 2,
                  "protoName": "display_name"
                },
                "metadata": {
                  "rule": "repeated",
                  "type": "BehaviorBindingParametersSet",
                  "id": 3
                }
              }
            },
            "BehaviorBindingParametersSet": {
              "fields": {
                "param1": {
                  "rule": "repeated",
                  "type": "BehaviorParameterValueDescription",
                  "id": 1
                },
                "param2": {
                  "rule": "repeated",
                  "type": "BehaviorParameterValueDescription",
                  "id": 2
                }
              }
            },
            "BehaviorParameterValueDescriptionRange": {
              "fields": {
                "min": {
                  "type": "int32",
                  "id": 1
                },
                "max": {
                  "type": "int32",
                  "id": 2
                }
              }
            },
            "BehaviorParameterNil": {
              "fields": {}
            },
            "BehaviorParameterLayerId": {
              "fields": {}
            },
            "BehaviorParameterHidUsage": {
              "fields": {
                "keyboardMax": {
                  "type": "uint32",
                  "id": 1,
                  "protoName": "keyboard_max"
                },
                "consumerMax": {
                  "type": "uint32",
                  "id": 2,
                  "protoName": "consumer_max"
                }
              }
            },
            "BehaviorParameterValueDescription": {
              "oneofs": {
                "valueType": {
                  "oneof": [
                    "nil",
                    "constant",
                    "range",
                    "hidUsage",
                    "layerId"
                  ]
                }
              },
              "fields": {
                "name": {
                  "type": "string",
                  "id": 1
                },
                "nil": {
                  "type": "BehaviorParameterNil",
                  "id": 2
                },
                "constant": {
                  "type": "uint32",
                  "id": 3
                },
                "range": {
                  "type": "BehaviorParameterValueDescriptionRange",
                  "id": 4
                },
                "hidUsage": {
                  "type": "BehaviorParameterHidUsage",
                  "id": 5,
                  "protoName": "hid_usage"
                },
                "layerId": {
                  "type": "BehaviorParameterLayerId",
                  "id": 6,
                  "protoName": "layer_id"
                }
              }
            }
          }
        },
        "keymap": {
          "nested": {
            "Request": {
              "oneofs": {
                "requestType": {
                  "oneof": [
                    "getKeymap",
                    "setLayerBinding",
                    "checkUnsavedChanges",
                    "saveChanges",
                    "discardChanges",
                    "getPhysicalLayouts",
                    "setActivePhysicalLayout",
                    "moveLayer",
                    "addLayer",
                    "removeLayer",
                    "restoreLayer",
                    "setLayerProps"
                  ]
                }
              },
              "fields": {
                "getKeymap": {
                  "type": "bool",
                  "id": 1,
                  "protoName": "get_keymap"
                },
                "setLayerBinding": {
                  "type": "SetLayerBindingRequest",
                  "id": 2,
                  "protoName": "set_layer_binding"
                },
                "checkUnsavedChanges": {
                  "type": "bool",
                  "id": 3,
                  "protoName": "check_unsaved_changes"
                },
                "saveChanges": {
                  "type": "bool",
                  "id": 4,
                  "protoName": "save_changes"
                },
                "discardChanges": {
                  "type": "bool",
                  "id": 5,
                  "protoName": "discard_changes"
                },
                "getPhysicalLayouts": {
                  "type": "bool",
                  "id": 6,
                  "protoName": "get_physical_layouts"
                },
                "setActivePhysicalLayout": {
                  "type": "uint32",
                  "id": 7,
                  "protoName": "set_active_physical_layout"
                },
                "moveLayer": {
                  "type": "MoveLayerRequest",
                  "id": 8,
                  "protoName": "move_layer"
                },
                "addLayer": {
                  "type": "AddLayerRequest",
                  "id": 9,
                  "protoName": "add_layer"
                },
                "removeLayer": {
                  "type": "RemoveLayerRequest",
                  "id": 10,
                  "protoName": "remove_layer"
                },
                "restoreLayer": {
                  "type": "RestoreLayerRequest",
                  "id": 11,
                  "protoName": "restore_layer"
                },
                "setLayerProps": {
                  "type": "SetLayerPropsRequest",
                  "id": 12,
                  "protoName": "set_layer_props"
                }
              }
            },
            "Response": {
              "oneofs": {
                "responseType": {
                  "oneof": [
                    "getKeymap",
                    "setLayerBinding",
                    "checkUnsavedChanges",
                    "saveChanges",
                    "discardChanges",
                    "getPhysicalLayouts",
                    "setActivePhysicalLayout",
                    "moveLayer",
                    "addLayer",
                    "removeLayer",
                    "restoreLayer",
                    "setLayerProps"
                  ]
                }
              },
              "fields": {
                "getKeymap": {
                  "type": "Keymap",
                  "id": 1,
                  "protoName": "get_keymap"
                },
                "setLayerBinding": {
                  "type": "SetLayerBindingResponse",
                  "id": 2,
                  "protoName": "set_layer_binding"
                },
                "checkUnsavedChanges": {
                  "type": "bool",
                  "id": 3,
                  "protoName": "check_unsaved_changes"
                },
                "saveChanges": {
                  "type": "SaveChangesResponse",
                  "id": 4,
                  "protoName": "save_changes"
                },
                "discardChanges": {
                  "type": "bool",
                  "id": 5,
                  "protoName": "discard_changes"
                },
                "getPhysicalLayouts": {
                  "type": "PhysicalLayouts",
                  "id": 6,
                  "protoName": "get_physical_layouts"
                },
                "setActivePhysicalLayout": {
                  "type": "SetActivePhysicalLayoutResponse",
                  "id": 7,
                  "protoName": "set_active_physical_layout"
                },
                "moveLayer": {
                  "type": "MoveLayerResponse",
                  "id": 8,
                  "protoName": "move_layer"
                },
                "addLayer": {
                  "type": "AddLayerResponse",
                  "id": 9,
                  "protoName": "add_layer"
                },
                "removeLayer": {
                  "type": "RemoveLayerResponse",
                  "id": 10,
                  "protoName": "remove_layer"
                },
                "restoreLayer": {
                  "type": "RestoreLayerResponse",
                  "id": 11,
                  "protoName": "restore_layer"
                },
                "setLayerProps": {
                  "type": "SetLayerPropsResponse",
                  "id": 12,
                  "protoName": "set_layer_props"
                }
              }
            },
            "Notification": {
              "oneofs": {
                "notificationType": {
                  "oneof": [
                    "unsavedChangesStatusChanged"
                  ]
                }
              },
              "fields": {
                "unsavedChangesStatusChanged": {
                  "type": "bool",
                  "id": 1,
                  "protoName": "unsaved_changes_status_changed"
                }
              }
            },
            "SaveChangesResponse": {
              "oneofs": {
                "result": {
                  "oneof": [
                    "ok",
                    "err"
                  ]
                }
              },
              "fields": {
                "ok": {
                  "type": "bool",
                  "id": 1
                },
                "err": {
                  "type": "SaveChangesErrorCode",
                  "id": 2
                }
              }
            },
            "SaveChangesErrorCode": {
              "values": {
                "SAVE_CHANGES_ERR_OK": 0,
                "SAVE_CHANGES_ERR_GENERIC": 1,
                "SAVE_CHANGES_ERR_NOT_SUPPORTED": 2,
                "SAVE_CHANGES_ERR_NO_SPACE": 3
              }
            },
            "SetLayerBindingResponse": {
              "values": {
                "SET_LAYER_BINDING_RESP_OK": 0,
                "SET_LAYER_BINDING_RESP_INVALID_LOCATION": 1,
                "SET_LAYER_BINDING_RESP_INVALID_BEHAVIOR": 2,
                "SET_LAYER_BINDING_RESP_INVALID_PARAMETERS": 3
              }
            },
            "SetActivePhysicalLayoutResponse": {
              "oneofs": {
                "result": {
                  "oneof": [
                    "ok",
                    "err"
                  ]
                }
              },
              "fields": {
                "ok": {
                  "type": "Keymap",
                  "id": 1
                },
                "err": {
                  "type": "SetActivePhysicalLayoutErrorCode",
                  "id": 2
                }
              }
            },
            "MoveLayerErrorCode": {
              "values": {
                "MOVE_LAYER_ERR_OK": 0,
                "MOVE_LAYER_ERR_GENERIC": 1,
                "MOVE_LAYER_ERR_INVALID_LAYER": 2,
                "MOVE_LAYER_ERR_INVALID_DESTINATION": 3
              }
            },
            "MoveLayerResponse": {
              "oneofs": {
                "result": {
                  "oneof": [
                    "ok",
                    "err"
                  ]
                }
              },
              "fields": {
                "ok": {
                  "type": "Keymap",
                  "id": 1
                },
                "err": {
                  "type": "MoveLayerErrorCode",
                  "id": 2
                }
              }
            },
            "AddLayerResponse": {
              "oneofs": {
                "result": {
                  "oneof": [
                    "ok",
                    "err"
                  ]
                }
              },
              "fields": {
                "ok": {
                  "type": "AddLayerResponseDetails",
                  "id": 1
                },
                "err": {
                  "type": "AddLayerErrorCode",
                  "id": 2
                }
              }
            },
            "AddLayerErrorCode": {
              "values": {
                "ADD_LAYER_ERR_OK": 0,
                "ADD_LAYER_ERR_GENERIC": 1,
                "ADD_LAYER_ERR_NO_SPACE": 2
              }
            },
            "AddLayerResponseDetails": {
              "fields": {
                "index": {
                  "type": "uint32",
                  "id": 1
                },
                "layer": {
                  "type": "Layer",
                  "id": 2
                }
              }
            },
            "RemoveLayerResponse": {
              "oneofs": {
                "result": {
                  "oneof": [
                    "ok",
                    "err"
                  ]
                }
              },
              "fields": {
                "ok": {
                  "type": "RemoveLayerOk",
                  "id": 1
                },
                "err": {
                  "type": "RemoveLayerErrorCode",
                  "id": 2
                }
              }
            },
            "RemoveLayerOk": {
              "fields": {}
            },
            "RemoveLayerErrorCode": {
              "values": {
                "REMOVE_LAYER_ERR_OK": 0,
                "REMOVE_LAYER_ERR_GENERIC": 1,
                "REMOVE_LAYER_ERR_INVALID_INDEX": 2
              }
            },
            "RestoreLayerResponse": {
              "oneofs": {
                "result": {
                  "oneof": [
                    "ok",
                    "err"
                  ]
                }
              },
              "fields": {
                "ok": {
                  "type": "Layer",
                  "id": 1
                },
                "err": {
                  "type": "RestoreLayerErrorCode",
                  "id": 2
                }
              }
            },
            "RestoreLayerErrorCode": {
              "values": {
                "RESTORE_LAYER_ERR_OK": 0,
                "RESTORE_LAYER_ERR_GENERIC": 1,
                "RESTORE_LAYER_ERR_INVALID_ID": 2,
                "RESTORE_LAYER_ERR_INVALID_INDEX": 3
              }
            },
            "SetLayerPropsResponse": {
              "values": {
                "SET_LAYER_PROPS_RESP_OK": 0,
                "SET_LAYER_PROPS_RESP_ERR_GENERIC": 1,
                "SET_LAYER_PROPS_RESP_ERR_INVALID_ID": 2
              }
            },
            "SetActivePhysicalLayoutErrorCode": {
              "values": {
                "SET_ACTIVE_PHYSICAL_LAYOUT_ERR_OK": 0,
                "SET_ACTIVE_PHYSICAL_LAYOUT_ERR_GENERIC": 1,
                "SET_ACTIVE_PHYSICAL_LAYOUT_ERR_INVALID_LAYOUT_INDEX": 2
              }
            },
            "SetLayerBindingRequest": {
              "fields": {
                "layerId": {
                  "type": "uint32",
                  "id": 1,
                  "protoName": "layer_id"
                },
                "keyPosition": {
                  "type": "int32",
                  "id": 2,
                  "protoName": "key_position"
                },
                "binding": {
                  "type": "BehaviorBinding",
                  "id": 3
                }
              }
            },
            "MoveLayerRequest": {
              "fields": {
                "startIndex": {
                  "type": "uint32",
                  "id": 1,
                  "protoName": "start_index"
                },
                "destIndex": {
                  "type": "uint32",
                  "id": 2,
                  "protoName": "dest_index"
                }
              }
            },
            "AddLayerRequest": {
              "fields": {}
            },
            "RemoveLayerRequest": {
              "fields": {
                "layerIndex": {
                  "type": "uint32",
                  "id": 1,
                  "protoName": "layer_index"
                }
              }
            },
            "RestoreLayerRequest": {
              "fields": {
                "layerId": {
                  "type": "uint32",
                  "id": 1,
                  "protoName": "layer_id"
                },
                "atIndex": {
                  "type": "uint32",
                  "id": 2,
                  "protoName": "at_index"
                }
              }
            },
            "SetLayerPropsRequest": {
              "fields": {
                "layerId": {
                  "type": "uint32",
                  "id": 1,
                  "protoName": "layer_id"
                },
                "name": {
                  "type": "string",
                  "id": 2
                }
              }
            },
            "Keymap": {
              "fields": {
                "layers": {
                  "rule": "repeated",
                  "type": "Layer",
                  "id": 1
                },
                "availableLayers": {
                  "type": "uint32",
                  "id": 2,
                  "protoName": "available_layers"
                },
                "maxLayerNameLength": {
                  "type": "uint32",
                  "id": 3,
                  "protoName": "max_layer_name_length"
                }
              }
            },
            "Layer": {
              "fields": {
                "id": {
                  "type": "uint32",
                  "id": 1
                },
                "name": {
                  "type": "string",
                  "id": 2
                },
                "bindings": {
                  "rule": "repeated",
                  "type": "BehaviorBinding",
                  "id": 3
                }
              }
            },
            "BehaviorBinding": {
              "fields": {
                "behaviorId": {
                  "type": "sint32",
                  "id": 1,
                  "protoName": "behavior_id"
                },
                "param1": {
                  "type": "uint32",
                  "id": 2
                },
                "param2": {
                  "type": "uint32",
                  "id": 3
                }
              }
            },
            "PhysicalLayouts": {
              "fields": {
                "activeLayoutIndex": {
                  "type": "uint32",
                  "id": 1,
                  "protoName": "active_layout_index"
                },
                "layouts": {
                  "rule": "repeated",
                  "type": "PhysicalLayout",
                  "id": 2
                }
              }
            },
            "PhysicalLayout": {
              "fields": {
                "name": {
                  "type": "string",
                  "id": 1
                },
                "keys": {
                  "rule": "repeated",
                  "type": "KeyPhysicalAttrs",
                  "id": 2
                }
              }
            },
            "KeyPhysicalAttrs": {
              "fields": {
                "width": {
                  "type": "sint32",
                  "id": 1
                },
                "height": {
                  "type": "sint32",
                  "id": 2
                },
                "x": {
                  "type": "sint32",
                  "id": 3
                },
                "y": {
                  "type": "sint32",
                  "id": 4
                },
                "r": {
                  "type": "sint32",
                  "id": 5
                },
                "rx": {
                  "type": "sint32",
                  "id": 6
                },
                "ry": {
                  "type": "sint32",
                  "id": 7
                }
              }
            }
          }
        }
      }
    }
  }
};
