// js/api.js

const TTS_API_URL = 'https://dev.taigiedu.com/backend/synthesize_speech';
const STT_API_URL = 'https://dev.taigiedu.com/backend/transcribe_speech';

async function callTTS(text) {
    try {
        const response = await fetch(TTS_API_URL, {
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const base64Audio = await response.text();
        return `data:audio/wav;base64,${base64Audio}`;
    } catch (error) {
        console.error('Error calling TTS API:', error);
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
