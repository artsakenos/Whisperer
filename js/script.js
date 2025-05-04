const btnMic = document.getElementById('btn_mic');
const btnSystem = document.getElementById('btn_system');
const btnClean = document.getElementById('btn_clean');
const btnSend = document.getElementById('btn_send');
const btnAction = document.getElementById('btn_action');

const cmbLanguage = document.getElementById('cmb_language');
const cmbMode = document.getElementById('cmb_mode');
const txtStatus = document.getElementById('txt_status');
const txtOutput = document.getElementById('txt_output');
const edtUserInput = document.getElementById('edt_input');

let lastTranscripts = []; // Contains the last 5 transcripts, check handleTranscription.
let lastAssistantAnswer = '';

function log_error(verbose, error) {
    txtOutput.innerHTML += `<font color=red>${verbose}:</font>>${JSON.stringify(error)}<br>`;
    txtOutput.scrollTop = txtOutput.scrollHeight;
    console.error(verbose, error);
}

function cleanup(cleanOutput = true, stopRec = false) {
    if (stopRec) {
        stopRecognition(null, true);
    }
    let language = cmbLanguage.value || 'en-US';
    let mode = cmbMode.value || 'transcription';
    let description = window.config_prompts[mode]?.description;
    if (description === undefined) description = 'Transcribes the text';
    txtStatus.innerHTML = `🔍 Status: Ready; Language: ${language}; Mode: ${mode} <small>(${description})</small>;`;
    if (cleanOutput) {
        // txtOutput.innerHTML = window.config_system.help["en-US"];
        txtOutput.innerHTML = "📄 Ready...<br />";
    }
}

/**
 * Shortcut CTRL+'\'
 */
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === '\\') {
        event.preventDefault();
        if (recognitionStatus === 'off') {
            startMicRecognition();
        } else {
            stopRecognition();
        }
    }
});

btnSend.addEventListener("click", function () {
    const userInput = edtUserInput.value;
    const language = cmbLanguage.value || 'en-US';
    if (userInput && userInput.trim() !== '') handleTranscription('', userInput, language);
    edtUserInput.value = '';
});

edtUserInput.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault(); // Impedisce l'inserimento di una nuova riga nell'area di testo
        const userInput = edtUserInput.value;
        const language = cmbLanguage.value || 'en-US';
        if (userInput && userInput.trim() !== '') handleTranscription('', userInput, language);
        edtUserInput.value = '';
    }
});

btnAction.addEventListener("click", function () {
    window.alert('Action button (to implement further custom actions)!');
});

cleanup();

function tts(text) {
    if ('speechSynthesis' in window) {
        const tts_status = config_get('tts');
        if (!tts_status || tts_status.toLowerCase() !== "on") return;
        // Remove spcial characters
        const filteredText = text.replace(/[#*_\[\](){}`><~|\\]/g, '');

        const utterance = new SpeechSynthesisUtterance(filteredText);
        utterance.lang = cmbLanguage.value || 'en-US';
        utterance.volume = 1; // Max Volume (range is 0 to 1)
        utterance.rate = 1;   // Normal Speed (range is 0.1 to 10)
        utterance.pitch = 1;  // Normal Pitch (range is 0 to 2)

        utterance.onstart = () => {
            console.log('TTS Started.');
        };

        utterance.onend = () => {
            console.log('TTS Finished.');
        };

        utterance.onerror = (event) => {
            console.error('Error during the vocal synthesis:', event.error);
        };

        window.speechSynthesis.speak(utterance);
    } else {
        console.error('This browser doesn\'t support API SpeechSynthesis.');
    }
}
