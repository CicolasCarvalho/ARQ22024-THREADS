//@ts-check
const SERVER_URL = "http://127.0.0.1:3000";

let lastUpdate = new Date(0);

const handlers = {
    /**
     * @param {{
     *  after?: Date,
     *  before?: Date
     * }} filter 
     */
    getMessage: async (filter) => {
        const params = new URLSearchParams({
            "after": filter.after?.getTime().toString()??"null",
            "before": filter.before?.getTime().toString()??"null",
        });

        const response = await fetch(`${SERVER_URL}/message?${params.toString()}`, {
            method: "GET"
        }).then(res => {
            return res.json();
        }).then((body) => {
            return body.map((post) => {return {
                ...post,
                createdAt: new Date(post.createdAt),
            }})
        });

        return response;
    },

    /**
     * @param {string} user 
     * @param {string} message 
     */
    postMessage: async (user, message) => {
        await fetch(`${SERVER_URL}/message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user,
                message
            }),
        });
    },

    /**
     * @param {number} interval
     * @param {(post: {user: string, message: string, createdAt: Date}[]) => void} callback
     */
    poll: async (interval, callback) => {
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        while(true) {
            const posts = await handlers.getMessage({
                after: lastUpdate,
            });

            lastUpdate = new Date();

            callback(posts);

            await wait(interval);
        };
    },
}

module.exports = handlers;