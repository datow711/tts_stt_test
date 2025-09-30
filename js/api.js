// js/api.js

async function callTTS(text, apiUrl, retries = 3, delay = 150) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tts_lang: 'tb',
                tts_data: text,
            }),
        });
        if (!response.ok) {
            // If the response is not OK, and we still have retries left, then retry.
            if (retries > 1) {
                console.warn(`TTS API call to ${apiUrl} failed with status ${response.status}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return callTTS(text, apiUrl, retries - 1, delay * 2); // Exponential backoff
            }
            // If no retries left, throw the final error.
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const base64Audio = await response.text();
        return `data:audio/wav;base64,${base64Audio}`;
    } catch (error) {
        console.error(`Error calling TTS API at ${apiUrl}:`, error);
        throw error;
    }
}

async function callSTT(base64Audio) {
    try {
        const response = await fetch(STT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                stt_data: base64Audio,
                stt_lang: 'tw',
                stt_type: 'base64',
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result.message;
    } catch (error) {
        console.error('Error calling STT API:', error);
        throw error;
    }
}
