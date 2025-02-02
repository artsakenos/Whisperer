// Rimuovi le importazioni e definisci le variabili manualmente
const config_system = window.config_system; // Verrà caricato da config_system.js
const prompt = window.prompt; // Verrà caricato da config_prompts.js

const max_completion_tokens = 512;

// Definisci la funzione queryLLM
async function queryLLM(mode, agentName, userInput, callback) {
    const agent = config_system.agents[agentName];
    const apiKey = window.api_key[agent.provider];

    if (apiKey === null) {
        callback(`Set your LLM ${agentName} API key in the <i>config_user.js</i>.`, null);
        return;
    }

    const data = {
        messages: [
            {
                role: "system",
                content: prompt[mode][agentName]
            },
            {
                role: "user",
                content: userInput
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

// Esponi la funzione globalmente per i test:
// window.queryLLM = queryLLM;