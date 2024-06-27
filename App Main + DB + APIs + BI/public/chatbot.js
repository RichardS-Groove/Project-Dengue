const chatForm = document.getElementById('chatForm');
const promptInput = document.getElementById('prompt');
const chatMessages = document.getElementById('chatMessages');
const username = 'staff';
const password = 'Staff';
const credentials = `${username}:${password}`;
const base64Credentials = btoa(credentials);

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    const response = await fetch('/env');
    const env = await response.json();
    const chatApiUrl = env.chatApiUrl;

    if (prompt) {
        const userMessage = document.createElement('div');
        userMessage.textContent = `User: ${prompt}`;
        chatMessages.appendChild(userMessage);

        try {
            const response = await fetch(chatApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${base64Credentials}`
                },
                body: JSON.stringify({prompt}),
            });

            const data = await response.json();
            const botMessage = document.createElement('div');
            botMessage.textContent = `Bot: ${data.output}`;
            chatMessages.appendChild(botMessage);
        } catch (error) {
            console.error('Error en la solicitud:', error);
        }

        promptInput.value = '';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const promptInput = document.getElementById('prompt');
    const questionSelect = document.getElementById('questionSelect');

    questionSelect.addEventListener('change', function () {
        if (this.value) {
            promptInput.value = this.value;
            promptInput.focus();
        }
    });
});