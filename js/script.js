const edtTranscription = document.getElementById('edt_transcription');
const btnMic = document.getElementById('btn_mic');
const btnSystem = document.getElementById('btn_system');
const btnClean = document.getElementById('btn_clean');
const cmbLanguage = document.getElementById('cmb_language');
const cmbMode = document.getElementById('cmb_mode');
const txtOutput = document.getElementById('txt_output');

let recognition = null;
let lastTranscripts = [];
let lastTranscriptTime = Date.now();
let lastAssistantAnswer = '';

let recognitionStatus = "off"; // off | microphone | system

function log_error(verbose, error) {
    txtOutput.innerHTML += `<font color=red>${verbose}:</font>>${JSON.stringify(error)}<br>`;
    txtOutput.scrollTop = txtOutput.scrollHeight;
    console.error(verbose, error);
}

function setupRecognition() {
    keepAudioAlive();
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = cmbLanguage.value || 'en-US';
    cmbLanguage.disabled = true;
    recognition.continuous = true;
    recognition.interimResults = true;
    console.log(`Recognition Started with language ${recognition.lang}, and mode ${cmbMode.value}`);

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        const currentTime = Date.now();

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim();

            if (event.results[i].isFinal ||
                (currentTime - lastTranscriptTime) > 10000 ||
                transcript.length > 200) {

                finalTranscript += transcript + '\n';
                lastTranscriptTime = currentTime;
            } else {
                interimTranscript += transcript;
            }
        }

        handleTranscription(interimTranscript, finalTranscript, recognition.lang);
    };

    recognition.onerror = (event) => {
        log_error('Recognition Error', event.error);
    };

    recognition.onend = () => {
        console.warn('Recognition ended.');
        // if WebAPI decided to close, not the user I force a restart.
        if (recognitionStatus === 'microphone') startMicRecognition();
        if (recognitionStatus === 'system') startSystemRecognition();
    };

}

function handleTranscription(interim, final, language) {
    edtTranscription.value = `Interim: ${interim}\nFinal: ${final}`.trim();
    edtTranscription.scrollTop = edtTranscription.scrollHeight;

    if (final.trim().length === 0) return;
    lastTranscripts.push(final);
    if (lastTranscripts.length > 5) lastTranscripts.shift();

    // txtOutput.innerHTML = `<strong>Final:</strong> ${final}<hr>`;
    // txtOutput.innerHTML += `<strong>Last Transcripts:</strong><br>${lastTranscripts.join('<br>')}`;
    // txtOutput.scrollTop = txtOutput.scrollHeight;

    lastAssistantAnswer = handleOutput(cmbMode.value, language, lastTranscripts, final, lastAssistantAnswer);
}

async function startMicRecognition() {
    try {
        if (!recognition) setupRecognition();
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.start();
        btnMic.textContent = window.config_system.labels["en-US"].btn_mic_off;
        btnMic.onclick = stopRecognition;
        recognitionStatus = 'microphone';
    } catch (error) {
        log_error('Microphone Access Error', error);
        cmbLanguage.disabled = false;
    }
}

async function startSystemRecognition() {
    try {
        if (!recognition) setupRecognition();
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
                channelCount: 2
            }
        });

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) throw new Error('No audio track available');

        stream.getVideoTracks().forEach(track => track.stop());

        recognition.start();
        btnSystem.textContent = window.config_system.labels["en-US"].btn_system_off;
        btnSystem.onclick = () => {
            audioTrack.stop();
            stopRecognition();
        };
        recognitionStatus = 'system';

    } catch (error) {
        log_error('System Audio access error:', error);
        cmbLanguage.disabled = false;
    }
}

function stopRecognition() {
    isRecognitionActive = false;
    if (recognition) {
        recognitionStatus = 'off';
        recognition.stop();
        btnMic.textContent = window.config_system.labels["en-US"].btn_mic_on;
        btnMic.onclick = startMicRecognition;
        btnSystem.textContent = window.config_system.labels["en-US"].btn_system_on;
        btnSystem.onclick = startSystemRecognition;
        cmbLanguage.disabled = false;
        recognition = null;
    }
}

function cleanOutput() {
    edtTranscription.value = '';
    txtOutput.innerHTML = '';
}

/**
 * A limitation on the Web Speech API can close the Microphone after an inactivity timeout.
 * This function creates an audio context with a silent oscillator to keep the microphone alive.
 * There are other ways, but they all have shortcomings.
 */
function keepAudioAlive() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0.001; // La frequenza è arbitraria, il volume molto basso.

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    console.log("Audio context started to prevent timeout.");
}

