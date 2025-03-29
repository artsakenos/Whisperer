window.config_system = {
    providers: {
        deepseek: {
            url: "https://api.deepseek.com/chat/completions",
            model: "deepseek-chat",
            api_key: "ds_key"
        },
        groq: {
            url: "https://api.groq.com/openai/v1/chat/completions",
            model: "llama-3.3-70b-versatile",
            api_key: "gq_key"
        },
        cerebras: {
            url: "https://api.cerebras.ai/v1/chat/completions",
            model: "llama-3.3-70b",
        },
        openai: {
            url: "https://api.openai.com/v1/chat/completions",
            model: "gpt-3.5-turbo",
        }
    },
    language: "en-US",
    tts: false,
    labels: {
        "en-US": {
            btn_mic_on: "🎙️ Listen Microphone",
            btn_mic_off: "🛑 Pause Microphone",
            btn_system_on: "🔊 Listen System",
            btn_system_off: "🛑 Pause System",
            btn_cleanup: "🧹 Cleanup"
        }
    },
    help: {
        "en-US": `
            📄 Your content will appear here...<br>
            type /help for help!
            Visit <a href="http://github.com">Readme</a> for more.
        `
    }
};

window.config_user = window.config_user || {}; // Ensure config_user exists

function getNestedProperty(obj, path, defaultValue) {
    return path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : undefined, obj) ?? defaultValue;
}

// e.g., config_get('providers.deepseek');
function config_get(key, defaultValue = null) {
    if (localStorage.getItem(key) !== null) {
        return JSON.parse(localStorage.getItem(key));
    }
    let value = getNestedProperty(window.config_user, key);
    if (value !== undefined) return value;
    value = getNestedProperty(window.config_system, key);
    if (value !== undefined) return value;
    return defaultValue;
}

/**
 * Note that the key will be saved in a flattened way to the local storage.
 */
function config_set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
