window.config_system = {
    agents: {
        listener: {
            provider: "deepseek",
            url: "https://api.deepseek.com/chat/completions",
            model: "deepseek-chat",
            api_key: null,
        },
        generator: {
            provider: "groq",
            url: "https://api.groq.com/openai/v1/chat/completions",
            model: "llama-3.3-70b-versatile",
            api_key: null,
        }
    },
    language: "it-IT",
    labels: {
        "en-US": {
            btn_mic_on: "🎙️ Listen Microphone",
            btn_mic_off: "🛑 Stop Microphone",
            btn_system_on: "🔊 Listen System",
            btn_system_off: "🛑 Stop System",
            btn_cleanup: "🧹 Cleanup"
        }
    }
};