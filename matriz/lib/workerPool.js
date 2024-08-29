//@ts-check

const { Worker } = require('worker_threads');
const crypto = require("crypto");

let UUID = 0;

/**
 * @param {number} workerPoolSize 
 * @param {string | URL} file
 */
module.exports = (workerPoolSize, file) => {
    /** @type {{worker: Worker, isIdle: boolean, isClose: boolean}[]} */
    const workerPool = [];
    /** @type {{id: number, message: {type: string, body: object}, handler}[]} */
    const messageQueue = [];
    /** @type {Record<number, {message: {type: string, body: object}, handler}>} */
    const activeThreads = {};

    for (let i = 0; i < workerPoolSize; i++) {
        workerPool[i] = {
            worker: new Worker(file),
            isIdle: true,
            isClose: false,
        };

        workerPool[i].worker.on("error", (err) => {
            throw err;
        });

        workerPool[i].worker.on("message", (message) => {
            const threadObj = activeThreads[message.id];
            
            if (!threadObj) throw new Error("Unknown message ID");
            
            delete activeThreads[message.id];
            
            threadObj.handler(message.response);

            const nextMessage = messageQueue.shift();
            if (!nextMessage) return;

            assignMessage(workerPool[i], nextMessage);
        });
    }

    /**
     * @param {{worker: Worker, isIdle: boolean, isClose: boolean}} workerObj 
     * @param {{id: number, message: {type: string, body: object}, handler}} messageObj
     */
    const assignMessage = (workerObj, messageObj) => {
        workerObj.isIdle = false;

        activeThreads[messageObj.id] = messageObj;

        const message = {
            id: messageObj.id,
            ...messageObj.message,
        };

        workerObj.worker.postMessage(message);
    }

    const updateWorkers = () => {
        const idleWorkers = workerPool.filter(worker => worker.isIdle);
        if (!idleWorkers.length) return;

        const actualWorker = idleWorkers[0];
        
        const nextMessage = messageQueue.shift();
        if (!nextMessage) return;

        assignMessage(actualWorker, nextMessage);
    }

    return {
        /**
         * @param {{type: string, body: object}} message
         * @param {(message: {type: string, body: object}) => void} handler 
         */
        enqueue: async (message, handler) => {            
            const obj = {
                id: UUID++,
                message,
                handler
            };

            messageQueue.push(obj);
            
            updateWorkers();
        },

        close: () => {
            for (const workerObj of workerPool) {
                if (!workerObj.isClose) {
                    workerObj.worker.postMessage({
                        type: "close"
                    })
                    workerObj.isClose = true;
                }
            }        
        }
    }
}