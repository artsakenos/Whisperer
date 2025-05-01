
/**
 * The handleOutput function queries the appropriate agents based on the current transcript of the conversation.
 * It uses the queryLLM function, which selects the correct prompt depending on the current mode 
 * and the agent responsible for the response.
 * The flow may vary depending on the selected mode.
 * <i>queryLLM(...)</i> calls the appropriate endpoint and builds the required prompts based on the mode and agent.
 * 
 * It modifies lastAssistantAnswer as a side effect, 
 * txtOutput, and txtStatus to display the results of the conversation.
 *
 * @param {string} mode The current mode (e.g., interview, translate, etc.)
 * @param {string} language The current language (e.g., it-IT, en-US, etc.)
 * @param {array} lastTranscripts An array containing the most recent transcripted sentences
 * @param {string} userInput The latest transcripted sentence
 */
function handleOutput(mode, language, lastTranscripts, userInput) {

    if (mode === '') {
        txtOutput.innerHTML = '<font color="red">Please select a mode first</font>';
        return '';
    }

    if (!userInput || userInput === '') {
        return '';
    }

    if (userInput.toLowerCase() === '/help' || userInput.toLowerCase() === '/?') {
        window.open('https://github.com/artsakenos/Whisperer?tab=readme-ov-file#usage-', '_blank');
        return '';
    }

    if (userInput.startsWith('/config')) {
        return handleConfig(userInput);
    }

    // Trsscription Mode: Only show the transcribed text.
    if (mode === 'transcription') {
        txtOutput.innerHTML += `<br><strong>${mode} ✍️ in ${language}:</strong> ${userInput}`;
        return userInput;
    }

    txtStatus.innerHTML += `\n<hr><strong>The Agents</strong> are 🤔 thinking in mode <i>${mode}</i>`;
    var agent = retrieveAgent(mode, lastTranscripts, userInput, lastAssistantAnswer);

    if (agent === null) {
        console.error('Error while retrieving agent for mode:', mode);
        return;
    }

    if (mode === 'translate') {
        queryLLM(agent, (error, response) => {
            if (error) {
                console.error('LLM error:', error);
            } else {
                txtOutput.innerHTML += `<br/><strong>📚 ${mode}: </strong>${response.replace(/\n/g, '<br>')}`;
                const maxLength = 5000;
                while (txtOutput.innerHTML.length > maxLength) { // Cut the output to avoid overflow.
                    const firstBreak = txtOutput.innerHTML.indexOf('<br>');
                    if (firstBreak === -1) break;
                    txtOutput.innerHTML = txtOutput.innerHTML.slice(firstBreak + 4);
                }
                lastAssistantAnswer = response;
            }
        });
    }

    if (mode === 'brainstorming') {
        queryLLM(agent, (error, response) => {
            if (error) {
                console.error('LLM error:', error);
            } else {
                txtOutput.innerHTML = `<strong>📚 ${mode}: </strong>${response.replace(/\n/g, '<br>')}`;
                lastAssistantAnswer = response;
            }
        });
    }

    if (mode === 'conversation') {
        queryLLM(agent, (error, response) => {
            if (error) {
                console.error('LLM error:', error);
            } else {
                txtOutput.innerHTML = `<strong>📚 ${mode}: </strong>${response.replace(/\n/g, '<br>')}`;
                lastAssistantAnswer = response;
                tts(response);
            }
        });
    }

    // console.log('Agent:', agent);
    return '';

    // After refactoring I need to rewrite all the following.


    if (mode === 'presentation') {
        const agent = 'listener';
        queryLLM(mode, agent, lastTranscripts, userInput, (error, response) => {
            if (error) {
                console.error('LLM error:', error);
            } else {
                txtOutput.innerHTML += `<hr><strong>${mode}:</strong><br>${response.replace(/\n/g, '<br>')}`;
                return response;
            }
        });
    }

    if (mode === 'interview') {
        return handleInterview(mode, lastTranscripts, userInput);
    }
}

function handleConfig(userInput) {
    const parts = userInput.split(' ');
    // If config has one parameter get the value of that parameter.
    if (parts.length === 2) {
        const key = parts[1];
        const value = config_get(key);
        if (value !== undefined) {
            txtOutput.innerHTML += `<br> <b>${key}</b> has value <i>${JSON.stringify(value)}</i>`;
        } else {
            txtOutput.innerHTML += `<br> <b>${key}</b> not found.`;
        }
        // If config has two or more parameters, the first parameter is a key and the rest is the value and the config will be set as that.
    } else if (parts.length >= 3) {
        const key = parts[1];
        const value = parts.slice(2).join(' ');
        config_set(key, value);
        txtOutput.innerHTML += `<br> <b>${key}</b> set to <i>${value}</i>`;
    } else {
        txtOutput.innerHTML += "<br>Usage: /config [key] (to read [key]) or /config [key] [value] (to set [key] with [value])";
        txtOutput.innerHTML += "<br>/help for more details.";
    }
    return '';
}

function handleInterview(mode, lastTranscripts, userInput) {
    const agentListener = 'guardrail';
    const agentGenerator = 'supporter';

    // Call the listener agent to analyze the transcript and classify it
    queryLLM(mode, agentListener, lastTranscripts, userInput, (error, listenerResponse) => {
        if (error) {
            console.error('Listener LLM error:', error);
        } else {
            // Parse the response from the Listener
            txtOutput.innerHTML += `<hr><strong>Listener Response:</strong><br>${listenerResponse.replace(/\n/g, '<br>')}`;

            // Extract key elements from Listener response
            const classificationTag = extractClassificationTag(listenerResponse); // Function to parse #category tag
            const structuredInput = extractStructuredInput(listenerResponse); // Extract the structured details

            if (!classificationTag || !structuredInput) {
                console.error('Failed to parse Listener response');
                return;
            }

            // Avoid regenerating a suggestion if the context is unchanged
            if (lastAssistantAnswer && lastAssistantAnswer.includes(structuredInput.SUMMARY)) {
                txtOutput.innerHTML += `<hr><strong>Suggestion unchanged:</strong> The current answer still applies.`;
                return;
            }

            // Call the generator agent to create a response based on the Listener's structured input
            queryLLM(mode, agentGenerator, lastTranscripts, JSON.stringify(structuredInput), (genError, generatorResponse) => {
                if (genError) {
                    console.error('Generator LLM error:', genError);
                } else {
                    txtOutput.innerHTML = `<hr><strong>Generated Response:</strong><br>${generatorResponse.replace(/\n/g, '<br>')}`;
                    return generatorResponse;
                }
            });
        }
    });
}

/**
 * Utility to extract the classification tag (e.g., #personal, #technical) from the Listener response.
 * @param {string} response - The response from the Listener agent.
 * @returns {string|null} The classification tag or null if not found.
 */
function extractClassificationTag(response) {
    const match = response.match(/#\w+/);
    return match ? match[0] : null;
}

/**
 * Utility to extract the structured details (TOPIC, SUMMARY, KEY POINTS) from the Listener response.
 * @param {string} response - The response from the Listener agent.
 * @returns {object|null} An object containing structured details or null if parsing fails.
 */
function extractStructuredInput(response) {
    const topicMatch = response.match(/TOPIC:\s*(.*)/i);
    const summaryMatch = response.match(/SUMMARY:\s*(.*)/i);
    const keyPointsMatch = response.match(/KEY POINTS:\s*([\s\S]*)/i);

    if (topicMatch && summaryMatch && keyPointsMatch) {
        return {
            TOPIC: topicMatch[1].trim(),
            SUMMARY: summaryMatch[1].trim(),
            KEY_POINTS: keyPointsMatch[1].trim()
        };
    }
    return null;
}

