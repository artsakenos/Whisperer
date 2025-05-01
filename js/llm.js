const config_system = window.config_system; // Loaded from config_system.js
const config_prompts = window.config_prompts; // Loaded from config_prompts.js

const max_completion_tokens = 512;

function retrieveAgent(mode, lastTranscripts, userInput, lastAssistantAnswer) {
    const agentWorkflow = config_prompts[mode]; // The Agent Workflow. Has provider and prompts.
    const provider = agentWorkflow.provider; // Contains the provider url and model
    const model = config_get("providers." + provider + ".model");
    const url = config_get("providers." + provider + ".url");
    const apiKey = config_get("providers." + provider + ".api_key");

    const prompt_system = agentWorkflow.prompt_system
        .replace("{lastTranscripts}", lastTranscripts.join("\n * "))
        .replace("{lastAssistantAnswer}", lastAssistantAnswer);

    // console.log(prompt_system);
    const prompt_user = agentWorkflow.prompt_user ?? userInput;

    if (apiKey === null || apiKey.length < 10) {
        // TODO: Usare log_error
        console.error(`LLM ${provider} API key Not Set</i>.`);
        txtOutput.innerHTML += `<br/><font color=red>Error: You need to set up the  <b>${provider} provider</b> for <b>${mode}</b> mode.</font>`;
        txtOutput.innerHTML += `<br/><font color=red>You can setup the api key in the command: <i>config_user.js</i> file or with the <br/><b>/config providers.${provider}.api_key YOUR_APIKEY</b>.</font><br />`;
        return null;
    }

    return {
        provider: provider,
        model: model,
        url: url,
        api_key: apiKey,
        prompt_system: prompt_system,
        prompt_user: prompt_user
    };
}


/**
 * Query the LLM model.
 * 
 * @param {string} mode The mode
 * @param {string} agentName, The Agent Name
 * @param {string} userInput The User Input
 * @param {function} callback The Callback function: (error, result) => {}
 */
async function queryLLM(agent, callback) {

    const data = {
        messages: [
            {
                role: "system",
                content: agent.prompt_system
            },
            {
                role: "user",
                content: agent.prompt_user
            }
        ],
        model: agent.model,
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
        const response = await fetch(agent.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${agent.api_key}`
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