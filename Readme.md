# Whisperer TelePrompter 🎙️

Whisperer is an intelligent speech recognition assistant that acts as your real-time conversation companion. Unlike traditional speech-to-text tools, it provides context-aware suggestions, interactive feedback, and operates entirely in your browser. Perfect for interviews, presentations, or any scenario where you need a smart, discreet prompter by your side.

## Introduction

This application is intentionally designed to run standalone locally, without ES6 modules. For a full browser navigation assistant, see [Browser Mc Winspan](https://github.com/artsakenos/BrowserMcWingspan).

## Installation
1. Create a `config_user.js` file from `config_user_template.js` with your API keys (inside the config folder)
2. Customize other configuration files as needed
3. Launch `index.html`


## Macro Architecture

### Speech Processing
- **Collection and Segmentation**: Select the audio channel as needed. 
  The transcript is divided into meaningful units (e.g., by sentence or question), based on speech endpoints or detected pause signals.

### Interactive Suggestion Mode
The panels show:
- The Conversation flow
- Brief, direct comments
- Detailed responses with examples or deep dives
- Context-aware assistance

The Assistant supports multiple assistance modes. Based on the mode, it performs:

- **Conversation Classification**: Each transcript segment is analyzed for context. For example, in interview mode:
  - General questions ("Tell me about yourself")
  - Technical questions ("Let's talk about Java frameworks")
  - Situational questions ("How would you handle this situation?")

- **Response Generation**: Once classified, the segment is passed to an agent that generates a response. The agent can use models trained on:
  - Standard interview questions
  - Effective response patterns for professional contexts

This is why context parameters include transcripts, interim text, final phrases, classifications, and previous responses provided up to that point.

### The Prompter
The suggester works like a teleprompter, providing assistance on a panel that must maintain stability. It can't constantly change the response, so it acts as a kind of low-pass filter based on the input context.

## Credits
* [Ai Interview Assistant](https://github.com/pixelpump/Ai-Interview-Assistant-Chrome-Extension)
* [Browser McWingspan](https://github.com/artsakenos/BrowserMcWingspan)

---
 Work ❤️ in progress


# Test

    queryLLM("listener", "Ciao, come stai?", (error, response) => {
        if (error) {
            console.error("Errore:", error);
        } else {
            console.log("Risposta:", response);
        }
    });
