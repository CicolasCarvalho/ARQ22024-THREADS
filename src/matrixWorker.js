//@ts-check
const { Worker, isMainThread, parentPort } = require('worker_threads');
const matrix = require('../lib/matrix');

if (isMainThread) throw new Error("Workers não podem ser executados como Main Thread");

if (!parentPort) throw new Error("Falha em se conectar com o Main Thread");

const handlers = {
    /**
     * @param {number[][]} a 
     * @param {number[][]} b 
     * @returns {{ type: string, body: { result: number[][] }}}
     */
    matrixSum: (a, b) => {
        const c = matrix.sum(a, b);
        
        return {
            type: "result",
            body: {
                result: c
            }
        }
    },

    /**
     * @param {number[]} a 
     * @param {number[]} b 
     * @returns {{ type: string, body: { result: number[] }}}
     */
    arraySum: (a, b) => {
        const c = a.map((val, i) => val + b[i]);
        
        return {
            type: "result",
            body: {
                result: c
            }
        }
    },

    /**
     * @param {number[][]} a 
     * @param {number[][]} b 
     * @returns {{ type: string, body: { result: number[][] }}}
     */
    matrixMult: (a, b) => {
        const c = matrix.mult(a, b);
        
        return {
            type: "result",
            body: {
                result: c
            }
        }
    },

    /**
     * @param {number[]} a 
     * @param {number[]} b 
     * @returns {{ type: string, body: { result: number }}}
     */
    arrayDot: (a, b) => {
        let c = a
            .map((val, i) => val + b[i])
            .reduce((acc, cur) => acc + cur, 0);
        
        return {
            type: "result",
            body: {
                result: c
            }
        }
    },
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
            response
        });
    } else if (message.type === "array_dot") {
        const { a, b } = message.body;

        const response = handlers.arrayDot(a, b);
    
        parentPort.postMessage({
            id: message.id,
            response
        });
    } else if (message.type === "matrix_sum") {
        const { a, b } = message.body;

        const response = handlers.matrixSum(a, b);
    
        parentPort.postMessage({
            id: message.id,
            response
        });
    } else if (message.type === "array_sum") {
        const { a, b } = message.body;

        const response = handlers.arraySum(a, b);
    
        parentPort.postMessage({
            id: message.id,
            response
        });
    } else if (message.type === "bulk_mult") {
        const { a, b, c, i, j } = message.body;
    
        for (let k = i.min; k < i.max; k++) {
            for (let l = j.min; l < j.max; l++) {
                matrixMultStep(a, b, c, k, l); 
            }
        }

        parentPort.postMessage({
            id: message.id,
            response: {
                type: "result",
                body: {
                    result: c,
                    i,
                    j,
                }
            }
        });
    }
}

parentPort.addListener("message", handleMessage)

//-Utils------------------------------------------------------------------------

/**
 * @param {number[][]} a 
 * @param {number[][]} b 
 * @param {number[][]} c 
 * @param {number} i 
 * @param {number} j 
 */
function matrixMultStep(a, b, c, i, j) {
    const lin = a[i];

    c[i][j] = lin
        .map((val, k) => val + b[k][j])
        .reduce((acc, cur) => acc + cur, 0);
}