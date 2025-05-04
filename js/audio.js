let recognitionStatus = "off"; // off | microphone | system
let mediastream = null;
let recognition = null;
let lastTranscriptTime = Date.now();

function setupRecognition() {
    keepAudioAlive();
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = cmbLanguage.value || 'en-US';
    cmbLanguage.disabled = true;
    recognition.continuous = true;
    recognition.interimResults = true;
    console.log(`Recognition Started with language ${recognition.lang}, and mode ${cmbMode.value}`);

    let lastProcessedTranscript = '';
    let processingTimeout = null;

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        const currentTime = Date.now();

        // Raccogliamo tutti i risultati
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim();

            if (event.results[i].isFinal) {
                finalTranscript += transcript + '\n';
                lastTranscriptTime = currentTime;
            } else {
                interimTranscript += transcript;
            }
        }

        // Gestiamo i transcript finali immediatamente
        if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
            lastProcessedTranscript = finalTranscript;
            clearTimeout(processingTimeout);
            handleTranscription('', finalTranscript, recognition.lang);
        }

        // Gestiamo gli interim transcript con un leggero debounce
        if (interimTranscript) {
            clearTimeout(processingTimeout);
            processingTimeout = setTimeout(() => {
                // Chiamiamo handleTranscription con final vuoto per gli interim
                handleTranscription(interimTranscript + "🖉", '', recognition.lang);
            }, 200); // Ridotto a 200ms per una risposta più reattiva
        }
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
    txtStatus.innerHTML = `<strong>Interim:</strong> ${interim}`;
    if (!interim || interim.trim() === '') txtStatus.innerHTML = "🔍 Status: User Input; Language: " + language + ";";
    if (final.trim().length === 0) return;
    lastTranscripts.push(final);
    if (lastTranscripts.length > 5) lastTranscripts.shift();
    txtStatus.innerHTML += `\n<hr><strong>Whisperer</strong> is 🤔 working in mode <i>${cmbMode.value}</i>`;
    handleOutput(cmbMode.value, language, lastTranscripts, final);
}

async function startMicRecognition() {
    try {
        if (!mediastream) mediastream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!recognition) setupRecognition();
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
            audio: true
        });

        // Verifica se c'è un audio track
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            throw new Error('No audio track available in the system stream');
        }

        console.log('System audio track obtained:', audioTracks[0].label);
        txtOutput.innerHTML += `<br>Audio system selected: ${audioTracks[0].label}<br>`;

        // Ferma le tracce video, manteniamo solo l'audio
        stream.getVideoTracks().forEach(track => track.stop());

        // Aggiungiamo un semplice verificatore dello stato dell'audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        // Buffer per analizzare i dati audio
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Controllo periodico che l'audio stia fluendo
        const audioCheckInterval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
            console.log('Audio level:', average);

            /* Possibile indicatore visivo del livello audio
            const indicator = document.createElement('div');
            indicator.style.width = '100%';
            indicator.style.height = '5px';
            indicator.style.backgroundColor = average > 5 ? 'green' : 'red';
            if (txtOutput.childElementCount > 50) txtOutput.removeChild(txtOutput.firstChild);
            txtOutput.appendChild(indicator);
            */
        }, 1000);

        recognition.start();
        btnSystem.textContent = window.config_system.labels["en-US"].btn_system_off;
        btnSystem.onclick = () => {
            clearInterval(audioCheckInterval);
            audioTracks.forEach(track => track.stop());
            stopRecognition();
        };
        recognitionStatus = 'system';

    } catch (error) {
        log_error('System Audio access error:', error);
        cmbLanguage.disabled = false;
    }
}

function stopRecognition(event, force = false) {
    recognitionStatus = 'off';
    if (recognition) {
        recognition.stop();
        btnMic.textContent = window.config_system.labels["en-US"].btn_mic_on;
        btnMic.onclick = startMicRecognition;
        btnSystem.textContent = window.config_system.labels["en-US"].btn_system_on;
        btnSystem.onclick = startSystemRecognition;
        cmbLanguage.disabled = false;
        if (force) {
            recognition = null;
            mediastream = null;
        }
        cleanup(false);
    }
}

/**
 * A limitation on the Web Speech API can close the Microphone after an inactivity timeout.
 * This function creates an audio context with a silent oscillator to keep the microphone alive.
 * There are other ways, but they all have shortcomings.
 */
function keepAudioAlive() {
    return; // Disabilitato per ora, non è necessario.
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
