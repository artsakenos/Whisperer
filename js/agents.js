/**
 * The handleOutput function queries the appropriate agents based on the current transcript of the conversation.
 * It uses the queryLLM function, which selects the correct prompt depending on the current mode and the agent responsible for the response.
 * The flow may vary depending on the selected mode.
 *
 * @param {string} mode The current mode (e.g., interview, translate, etc.)
 * @param {array} lastSentences An array containing the most recent transcripted sentences
 * @param {string} lastSentence The latest transcripted sentence
 * @param {string} lastAssistantAnswer The last response provided by the assistant
 *  (This is useful to avoid calling the LLM or changing the response if the assistant's answer hasn't changed)
 * @returns {string} The response from the LLM
 */
function handleOutput(mode, lastSentences, lastSentence, lastAssistantAnswer) {
    txtOutput.innerHTML += `\n<hr><strong>An Agent</strong> will analyze the following text: <i>${lastSentence}</i> with mode <i>${mode}</i>`;

    if (mode === '') {
        txtOutput.innerHTML = '<font color="red">Please select a mode first</font>';
        return '';
    }

    if (mode === 'translate') {
        const agent = 'listener';
        // queryLLM calls the appropriate endpoint and builds the required prompts based on the mode and agent
        queryLLM(mode, agent, lastSentence, (error, response) => {
            if (error) {
                console.error('LLM error:', error);
            } else {
                txtOutput.innerHTML += `<hr><strong>${mode}:</strong><br>${response.replace(/\n/g, '<br>')}`;
                return response;
            }
        });
    }

    if (mode === 'interview') {
        const agentListener = 'listener';
        const agentGenerator = 'generator';

        // Call the listener agent to analyze the transcript and classify it
        queryLLM(mode, agentListener, lastSentence, (error, listenerResponse) => {
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
                queryLLM(mode, agentGenerator, JSON.stringify(structuredInput), (genError, generatorResponse) => {
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
