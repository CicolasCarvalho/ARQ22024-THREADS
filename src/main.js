//@ts-check
const { Worker, isMainThread, parentPort } = require('worker_threads');
const matrix = require('../lib/matrix');
const { exit } = require('process');
const workerPool = require('../lib/workerPool');

const WORKERS = 1;

if (!isMainThread) throw new Error("Main Thread não podem ser executado como Worker");

(async () => {
    const m = +process.argv[2];

    if (isNaN(m)) {
        console.log("Uso:\nnpm run start <m>");
        exit();
    }

    const a = matrix.random(m, m);
    const b = matrix.random(m, m);

    // console.log("Matriz A:", a);
    // console.log("Matriz B:", b);

    console.time("all");

    console.time("multiply");
    matrix.mult(a, b);
    console.timeEnd("multiply");

    console.time("multiply_thread");
    const mul = await matrixMultThreaded(a, b, m);
    console.timeEnd("multiply_thread");

    // console.log("A x B = ", mul);
    
    console.time("sum");
    matrix.sum(a, b);
    console.timeEnd("sum");

    console.time("sum_thread");
    const sum = await matrixSumThreaded(a, b, m);
    console.timeEnd("sum_thread");

    // console.log("A + B = ", sum);

    console.timeEnd("all");
})();

/**
 * @param {number[][]} a 
 * @param {number[][]} b 
 */
async function matrixMultThreaded(a, b, m) {
    const pool = workerPool(WORKERS, "./src/matrixWorker.js");
    let count = 0;
    let size = WORKERS;

    return new Promise((resolve, reject) => {              
        /** @type {number[][]} */
        let c = [];

        for(let i = 0; i < m; i++) {
            c[i] = [];
            for(let j = 0; j < m; j++) {
                c[i][j] = 0;
            }
        }

        const bs = (m / WORKERS) | 0;

        for (let i = 0; i < WORKERS; i++) {
            const iObj = {
                min: i * bs,
                max: (i + 1) * bs
            };
            
            const jObj = {
                min: 0,
                max: m
            };

            pool.enqueue({
                type: "bulk_mult",
                body: {
                    a: a, 
                    b: b,
                    c: c,
                    i: iObj,
                    j: jObj
                },
            }, (message) => {
                if (message.type !== "result") 
                    throw new Error("Tipo de mensagem não implementado" + message.type);
                
                c = matrix.sum(message.body.result, c);
            
                if(++count === size) {
                    pool.close();
                    resolve(c);
                }
            });
        }

        // // linhas
        // for (let i = 0; i < m; i++) {
        //     c[i] = [];
        //     // colunas
        //     for (let j = 0; j < m; j++) {
        //         /** @type {number[]} */
        //         const lin = a[i];
        //         /** @type {number[]} */
        //         const col = [];

        //         for (let k = 0; k < m; k++) {
        //             col[k] = b[k][j];
        //         }
        
        //         pool.enqueue({
        //             type: "array_dot",
        //             body: {
        //                 a: lin, 
        //                 b: col
        //             },
        //         }, (message) => {
        //             if (message.type !== "result") 
        //                 throw new Error("Tipo de mensagem não implementado" + message.type);
                
        //             c[i][j] = message.body.result;
                
        //             if(++count === size) {
        //                 pool.close();
        //                 resolve(c);
        //             }
        //         });
        //     }
        // }
    });
}

/**
 * @param {number[][]} a 
 * @param {number[][]} b 
 */
async function matrixSumThreaded(a, b, m) {
    const pool = workerPool(WORKERS, "./src/matrixWorker.js");
    let count = 0;
    let size = m;

    return new Promise((resolve, reject) => {              
        /** @type {number[][]} */
        const c = [];

        // linhas
        for (let i = 0; i < m; i++) {
            /** @type {number[]} */
            const lin1 = a[i];
            /** @type {number[]} */
            const lin2 = b[i];
    
            pool.enqueue({
                type: "array_sum",
                body: {
                    a: lin1, 
                    b: lin2
                },
            }, (message) => {
                if (message.type !== "result") 
                    throw new Error("Tipo de mensagem não implementado" + message.type);
            
                c[i] = message.body.result;
            
                if(++count === size) {
                    pool.close();
                    resolve(c);
                }
            });
        }
    });
}