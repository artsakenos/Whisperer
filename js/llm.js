const config_system = window.config_system; // Loaded from config_system.js
const config_prompts = window.prompt; // Loaded from config_prompts.js

const max_completion_tokens = 512;

/**
 * Query the LLM model.
 * 
 * @param {string} mode The mode
 * @param {string} agentName, The Agent Name
 * @param {string} userInput The User Input
 * @param {function} callback The Callback function: (error, result) => {}
 */
async function queryLLM(mode, agentName, userInput, callback) {
    const agent = config_prompts[mode][agentName]; // Contains prompt and provider
    const provider = config_system.providers[agent.provider]; // Contains the provider url and model
    const apiKey = window.api_key[agent.provider]; // Contains the API key

    if (apiKey === null) {
        callback(`Set your LLM ${agentName} API key in the <i>config_user.js</i>.`, null);
        return;
    }

    const data = {
        messages: [
            {
                role: "system",
                content: agent.prompt
            },
            {
                role: "user",
                content: userInput
            }
        ],
        model: provider.model,
        temperature: 1,
        top_p: 1,
        stream: false,
        stop: null
    };

    switch (agent.provider) {
        case 'cerebras':
            data['max_completion_tokens'] = max_completion_tokens;
            break;
        default:
            data['max_tokens'] = max_completion_tokens;
    }

    try {
        const response = await fetch(provider.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonResponse = await response.json();
        const content = jsonResponse.choices[0].message.content;

        callback(null, content);
    } catch (error) {
        callback(error, null);
    }
}

// Export the function globally for testing:
// window.queryLLM = queryLLM;