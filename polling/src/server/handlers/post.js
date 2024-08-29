/** @type {{user: string, message: string, createdAt: Date}[]} */
const posts = [];

module.exports = {
    /**
     * @param {{
     *  after?: Date,
     *  before?: Date
     * }} filter 
     */
    getPosts: (filter) => {
        let response = [...posts];
        
        if (filter.after) 
            response = response.filter(post => post.createdAt > filter.after);

        if (filter.before) 
            response = response.filter(post => post.createdAt < filter.before);

        return response;
    },

    /**
     * @param {string} user 
     * @param {string} message 
     */
    createPost: (user, message) => {
        const newPost = {
            user,
            message,
            createdAt: new Date()
        }

        posts.push(newPost);

        return newPost
    }
}