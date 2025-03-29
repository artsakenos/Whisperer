# Whisperer TelePrompter 🎙️

[![GitHub](https://img.shields.io/badge/license-GNU-blue.svg)](https://github.com/artsakenos/Whisperer/blob/master/LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.0-cyan.svg)](https://github.com/artsakenos/Whisperer/releases/tag/v0.2.0)
![Made With](https://img.shields.io/badge/made%20with-JavaScript-yellow)

Whisperer is an intelligent🤖 speech recognition💬 assistant that acts as your real-time conversation companion. 
It provides context-aware suggestions, interactive feedback, and operates entirely in your browser.

It can be tuned to listen to any speech channel, from your microphone, from a streaming video, a meeting app.
Perfect for realtime transcriptions ✍, translations 📜, interviews 💼, presentations 👥, 
or any scenario where you need a smart, discreet prompter by your side.

![Demo Banner](./assets/whisper_demo_banner.jpg)

> "Think of it as your personal speech Jedi Knight: 👨 it anticipates, adapts, and assists before you even finish your sentence🚀!" - Guglielmo Cancelli

> "I can't do without it. I just shine 🌞 on any interview!" - Pina Bellato

## Usage ⚡

Create a `config_user.js` file from `config_user (template).js` with your API keys (inside the config folder), 
or set them in the local storage with the command: 
`/config providers.<vendor>.api_key <api_key>`.

Activate the microphone / system listener as needed. 
Remember that you can also write on the input text and exploit the shortcuts:
* `CTRL+\` to emable / disable the microphone 
* `CTRL+ENTER` to input the text from the text area

### Commands Table  

| Command        | Description |
|---------------|-------------|
| `/help`       | Displays the list of available commands. |
| `/config`     | Reads configuration variables. |
| `/config [key]` | Reads the value of the `[key]`. |
| `/config [key] [value]` | Sets the value of `[key]` to `[value]`. |
| `/config tts [true\|false]` | Enables or disables TTS (text-to-speech). |
| `/config providers.<vendor>.api_key <api_key>` | Updates the API key for the provider `<vendor>`. |  

---

### Examples Table  

| Command Example | Effect |
|----------------|--------|
| `/config tts true` | Enables text-to-speech - only in conversation mode, and right now you need to use headphones ;). |
| `/config language` | Retrieves the current language setting. |
| `/config language en` | Sets the language to English. |
| `/config providers.groq.api_key sk-123456` | Updates the API key for Groq. |

**Custom Tweaks**:

*Define more providers* - LLM providers must be defined in `config/config_system.js`. 
- Any OpenAI-compatible LLM is ready to use out of the box. 
  If a request is wrapped differently, you can easily extend the `js/llm.js::queryLLM(...)` function;
  Examples are provided within the code.

*Define more workflows* - Given a *mode* you can 
  define the workflow inside `js/agents.js::handleOutput()`. 
- All the useful context parameters are available and include 
  transcripts, interim text, final phrases, classifications, language and 
  previous responses provided up to that point.
- You can customize the agent prompts inside `config/config_prompts.js`::window.prompt.{mode}.{agent}. 
  Note that it used to be a hierarchical nested structure before,
  but I think it was too messy, you can still call agents sequentially and in parallel
  in the workflow, just defining further sibling-modes to call within the handler. 


## Macro Architecture 🏗️

This application is intentionally designed to run standalone locally, without ES6 modules and the need for a server. 
For a handsome browser navigation assistant, see [Browser McWingspan](https://github.com/artsakenos/BrowserMcWingspan).

### Speech Processing
- **Collection and Segmentation**: Select the audio channel as needed. 
  The transcript is divided into meaningful units (e.g., by sentence or question), based on speech endpoints or detected pause signals.

### Interactive Suggestion Mode
The panels show:
- The Conversation flow
- Brief, direct comments
- Detailed responses with examples or deep dives
- Context-aware assistance

The Assistant supports multiple assistance modes. Based on the mode, it performs, e.g.:

- **Conversation Classification**: Each transcript segment is analyzed for context. For example, in interview mode:
  - General questions ("Tell me about yourself")
  - Technical questions ("Let's talk about Java frameworks")
  - Situational questions ("How would you handle this situation?")

- **Response Generation**: Once classified, the segment is passed to an agent that generates a response. 
  The suggester works like a teleprompter, providing assistance on a panel that must maintain stability. It can't constantly change the response, so it acts as a kind of low-pass filter based on the input context.


## Credits 🙏
* [Browser McWingspan](https://github.com/artsakenos/BrowserMcWingspan)
* [AI Interview Assistant](https://github.com/pixelpump/Ai-Interview-Assistant-Chrome-Extension)
* Powered by [Groq](https://groq.com/), [Cerebras](https://cerebras.ai/), [OpenAI](https://labs.openai.com/), et al.

---
🚧 Under Active Development - Watch this space! 👀


# Code Tweaks ⚗️

## js/script.js

Declares the core functions.

## js/llm.js

Declares the functions to query LLM.

## js/agents.js

Handles the business logics of the agents.

Check the function `handleOutput` and use its parameters to make the agent behave.

## js/audio.js

Handler the microphone events.


# 🚧 TODO 🗺️
- [ ] Refine the prompts and add a personal context (e.g., a CV) to the context window
- [ ] Add a presentation mode, where it suggests you what to say during a presentation
- [ ] Restore the Interview Mode
- [ ] Put the whole conversation in a variable, not only the user's messages.

**NOTE** I did a complete refactoring of the libraries, 
the modes Interview, Phonecall, Conversational partner, are coming back soon.

