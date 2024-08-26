//@ts-check

const { Worker } = require('worker_threads');
const crypto = require("crypto");

/**
 * @param {number} workerPoolSize 
 * @param {string | URL} file
 */
module.exports = (workerPoolSize, file) => {
    /** @type {{worker: Worker, isIdle: boolean, isClose: boolean}[]} */
    const workerPool = [];
    /** @type {{id: string, message: {type: string, body: object}, handler}[]} */
    const messageQueue = [];
    /** @type {Record<string, {message: {type: string, body: object}, handler}>} */
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
            
            threadObj.handler(message.body);

            workerPool[i].isIdle = true;
            updateWorkers();
        });
    }

    const updateWorkers = () => {
        const idleWorkers = workerPool.filter(worker => worker.isIdle);

        if (!idleWorkers.length) return;

        const actualWorker = idleWorkers[0];
        actualWorker.isIdle = false;
        
        const nextMessage = messageQueue.shift();
        if (!nextMessage) return;

        const message = {
            id: nextMessage.id,
            ...nextMessage.message,
        };

        activeThreads[nextMessage.id] = nextMessage;

        actualWorker.worker.postMessage(message);
    }

    return {
        /**
         * @param {{type: string, body: object}} message
         * @param {(message: {type: string, body: object}) => void} handler 
         */
        enqueue: (message, handler) => {
            const obj = {
                id: crypto.randomBytes(8).toString("base64"),
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