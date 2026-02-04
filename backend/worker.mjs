export default {
    async fetch(request, env, ctx) {
        return new Response("Worker is alive and healthy! 🦾 - " + new Date().toISOString(), {
            headers: { 'Content-Type': 'text/plain' }
        });
    }
};
