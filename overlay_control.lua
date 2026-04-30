obs = obslua

-- Script settings
local bat_path = ""
local auto_start = false  -- default: don’t auto-start
local platform = "linux" -- default platform

-- Helper to run a file depending on platform
local function run_file(path)
    if path == nil or path == "" then
        obs.script_log(obs.LOG_WARNING, "No start file path set.")
        return
    end

    local cmd
    if platform == "windows" then
        cmd = '"' .. path .. '"'
    else
        cmd = 'bash "' .. path .. '"'
    end

    obs.script_log(obs.LOG_INFO, "Running: " .. cmd)
    os.execute(cmd)
end

-- Start button callback
local function start_pressed(props, prop)
    run_file(bat_path)
end

-- OBS settings UI
function script_properties()
    local props = obs.obs_properties_create()

    -- Dropdown menu to select platform
    local p = obs.obs_properties_add_list(props, "platform", "Platform", obs.OBS_COMBO_TYPE_LIST, obs.OBS_COMBO_FORMAT_STRING)
    obs.obs_property_list_add_string(p, "Windows", "windows")
    obs.obs_property_list_add_string(p, "Linux", "linux")

    -- Text field for start file path
    obs.obs_properties_add_text(props, "bat_path", "Absolute Path to start file", obs.OBS_TEXT_DEFAULT)

    -- Boolean to enable/disable auto-start
    obs.obs_properties_add_bool(props, "auto_start", "Auto Start on OBS Launch")

    -- Start/Stop buttons
    obs.obs_properties_add_button(props, "start_button", "Start", start_pressed)

    return props
end

-- Save user input
function script_update(settings)
    bat_path = obs.obs_data_get_string(settings, "bat_path")
    auto_start = obs.obs_data_get_bool(settings, "auto_start")
    platform = obs.obs_data_get_string(settings, "platform")
end

-- OBS loads script
function script_load(settings)
    script_update(settings)
    if auto_start and bat_path ~= "" then
        obs.script_log(obs.LOG_INFO, "Auto-starting services...")
        run_file(bat_path)
    end
end

function script_description()
    return "OBS Lua script to start the chat overlay with platform selection."
end
