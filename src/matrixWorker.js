//@ts-check
const { Worker, isMainThread, parentPort } = require('worker_threads');
const matrix = require('../lib/matrix');

if (isMainThread) throw new Error("Workers não podem ser executados como Main Thread");

if (!parentPort) throw new Error("Falha em se conectar com o Main Thread");

const handlers = {
    matrixSum: (a, b) => {
        const c = matrix.sum(a, b);
        
        return {
            type: "result",
            body: {
                result: c
            }
        }
    },

    matrixMult: (a, b) => {
        const c = matrix.mult(a, b);
        
        return {
            type: "result",
            body: {
                result: c
            }
        }
    }
}

/**
 * @param {{id: string, type: string, body: object}} message 
 */
function handleMessage(message) {
    if (!parentPort) throw new Error("Falha em se conectar com o Main Thread");
    
    if (message.type === "close") {
        parentPort.close();
    } else if (message.type === "matrix_mul") {
        const { a, b } = message.body;

        const response = handlers.matrixMult(a, b);
    
        parentPort.postMessage({
            id: message.id,
            body: response
        });
    } else if (message.type === "matrix_sum") {
        const { a, b } = message.body;

        const response = handlers.matrixSum(a, b);
    
        parentPort.postMessage({
            id: message.id,
            body: response
        });
    }
}

parentPort.addListener("message", handleMessage)