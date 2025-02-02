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

function setupRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = cmbLanguage.value || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        const currentTime = Date.now();

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim();

            if (event.results[i].isFinal ||
                // currentTime - lastTranscriptTime > 10000 ||
                transcript.length > 200) {

                finalTranscript += transcript + '\n';
                lastTranscriptTime = currentTime;
            } else {
                interimTranscript += transcript;
            }
        }

        handleTranscription(interimTranscript, finalTranscript);
    };

    recognition.onerror = (event) => {
        console.error(`Error: ${event.error}`);
    };
}

function handleTranscription(interim, final) {
    edtTranscription.value = `Interim: ${interim}\nFinal: ${final}`.trim();
    edtTranscription.scrollTop = edtTranscription.scrollHeight;

    if (final.trim().length === 0) return;
    lastTranscripts.push(final);
    if (lastTranscripts.length > 5) lastTranscripts.shift();

    // txtOutput.innerHTML = `<strong>Final:</strong> ${final}<hr>`;
    // txtOutput.innerHTML += `<strong>Last Transcripts:</strong><br>${lastTranscripts.join('<br>')}`;
    // txtOutput.scrollTop = txtOutput.scrollHeight;

    lastAssistantAnswer = handleOutput(cmbMode.value, lastTranscripts, final, lastAssistantAnswer);
}

async function startMicRecognition() {
    try {
        if (!recognition) setupRecognition();
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.start();
        btnMic.textContent = window.config_system.labels["en-US"].btn_mic_off;
        btnMic.onclick = stopRecognition;
    } catch (error) {
        console.error('Microphone access error:', error);
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

    } catch (error) {
        console.error('System audio access error:', error);
    }
}

function stopRecognition() {
    if (recognition) {
        recognition.stop();
        btnMic.textContent = window.config_system.labels["en-US"].btn_mic_on;
        btnMic.onclick = startMicRecognition;
        btnSystem.textContent = window.config_system.labels["en-US"].btn_system_on;
        btnSystem.onclick = startSystemRecognition;
    }
}

function cleanOutput() {
    edtTranscription.value = '';
    txtOutput.innerHTML = '';
}
