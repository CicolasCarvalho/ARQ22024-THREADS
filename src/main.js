//@ts-check
const { Worker, isMainThread, parentPort } = require('worker_threads');
const matrix = require('../lib/matrix');
const { exit } = require('process');
const workerPool = require('../lib/workerPool');

const WORKERS = 4;

if (!isMainThread) throw new Error("Main Thread não podem ser executado como Worker");

(async () => {
    const m = +process.argv[2];

    if (isNaN(m)) {
        console.log("Uso:\nnpm run start <m>");
        exit();
    }

    const a = matrix.random(m, m);
    const b = matrix.random(m, m);

    console.log("Matriz A:", a);
    console.log("Matriz B:", b);

    console.time("all");

    console.time("multiply");
    const mul = await matrixMultThreaded(a, b, m);
    console.timeEnd("multiply");

    console.log("A x B = ", mul);
    
    console.time("sum");
    const sum = await matrixSumThreaded(a, b, m);
    console.timeEnd("sum");

    console.log("A + B = ", sum);

    console.timeEnd("all");
})();

/**
 * @param {number[][]} a 
 * @param {number[][]} b 
 */
async function matrixMultThreaded(a, b, m) {
    const pool = workerPool(WORKERS, "./src/matrixWorker.js");
    let count = 0;
    let size = m*m;

    return new Promise((resolve, reject) => {              
        /** @type {number[][]} */
        const c = [];

        // linhas
        for (let i = 0; i < m; i++) {
            // colunas
            for (let j = 0; j < m; j++) {
                /** @type {number[][]} */
                const lin = [a[i]];
                /** @type {number[][]} */
                const col = [];

                for (let k = 0; k < m; k++) {
                    col[k] = [];
                    col[k][0] = b[k][j];
                }
        
                pool.enqueue({
                    type: "matrix_mul",
                    body: {
                        a: lin, 
                        b: col
                    },
                }, (message) => {
                    if (message.type !== "result") 
                        throw new Error("Tipo de mensagem não implementado" + message.type);
                
                    if (!c[i]) c[i] = [];
                    c[i][j] = message.body.result[0][0];
                
                    if(++count === size) {
                        pool.close();
                        resolve(c);
                    }
                });
            }
        }
    });
}

async function matrixSumThreaded(a, b, m) {
    const pool = workerPool(WORKERS, "./src/matrixWorker.js");
    let count = 0;
    let size = m;

    return new Promise((resolve, reject) => {              
        /** @type {number[][]} */
        const c = [];

        // linhas
        for (let i = 0; i < m; i++) {
            /** @type {number[][]} */
            const lin1 = [a[i]];
            /** @type {number[][]} */
            const lin2 = [b[i]];
    
            pool.enqueue({
                type: "matrix_sum",
                body: {
                    a: lin1, 
                    b: lin2
                },
            }, (message) => {
                if (message.type !== "result") 
                    throw new Error("Tipo de mensagem não implementado" + message.type);
            
                c[i] = message.body.result[0];
            
                if(++count === size) {
                    pool.close();
                    resolve(c);
                }
            });
        }
    });
}