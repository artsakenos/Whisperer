window.config_system = {
    providers: {
        deepseek: {
            url: "https://api.deepseek.com/chat/completions",
            model: "deepseek-chat",
        },
        groq: {
            url: "https://api.groq.com/openai/v1/chat/completions",
            model: "llama-3.3-70b-versatile",
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