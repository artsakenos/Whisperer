const edtTranscription = document.getElementById('edt_transcription');
const btnMic = document.getElementById('btn_mic');
const btnSystem = document.getElementById('btn_system');
const btnClean = document.getElementById('btn_clean');
const cmbLanguage = document.getElementById('cmb_language');
const txtOutput = document.getElementById('txt_output');

let recognition = null;
let lastTranscripts = [];
let lastTranscriptTime = Date.now();
let currentTranscript = '';

function setupRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = cmbLanguage.value || 'it-IT';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        const currentTime = Date.now();

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim();

            if (event.results[i].isFinal ||
                currentTime - lastTranscriptTime > 10000 ||
                transcript.length > 200) {

                finalTranscript += transcript + '\n';
                handleOutput(transcript);
                lastTranscriptTime = currentTime;
                currentTranscript = '';
            } else {
                interimTranscript += transcript;
                currentTranscript = transcript;
            }
        }

        handleTranscription(interimTranscript, finalTranscript);
    };

    recognition.onerror = (event) => {
        console.error(`Error: ${event.error}`);
    };
}

function handleTranscription(interim, final) {
    if (edtTranscription) {
        edtTranscription.value = `Interim: ${interim}\nFinal: ${final}`.trim();
        edtTranscription.scrollTop = edtTranscription.scrollHeight;
    }
}

function handleOutput(finalTranscript) {
    if (finalTranscript.trim().length === 0) return;
    lastTranscripts.push(finalTranscript);
    if (lastTranscripts.length > 5) lastTranscripts.shift();

    txtOutput.innerHTML = `<strong>Final:</strong> ${finalTranscript}<hr>`;
    txtOutput.innerHTML += `<strong>Last Transcripts:</strong><br>${lastTranscripts.join('<br>')}`;
    txtOutput.scrollTop = txtOutput.scrollHeight;

    queryLLM('translate', 'listener', finalTranscript, (error, response) => {
        if (error) {
            console.error('LLM error:', error);
        } else {
            console.log('LLM response:', response);
            txtOutput.innerHTML += `<hr><strong>Translation:</strong><br>${response}`;
        }
    });
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
