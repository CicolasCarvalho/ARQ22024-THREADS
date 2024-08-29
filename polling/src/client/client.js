//@ts-check
const { Worker, isMainThread, parentPort } = require('worker_threads');
const { exit } = require('process');
const readline = require('readline');
const post = require('./service/post');
const { query } = require('express');

if (!isMainThread) throw new Error("Main Thread não podem ser executado como Worker");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const input = async (query) => new Promise((resolve, reject) => { 
    rl.question(query, (answer) => {
        resolve(answer);
    });
});

(async () => {

    const name = await input("Qual é o seu nome: ");

    const runWorker = await input("Deseja executar polling com worker threads? (s/n) ") == "s";

    if (!runWorker) {
        console.log("Instância rodando sem worker thread!");
        console.log("! Note que não será possível mandar mensagens ao servidor");
    
        await post.poll(1000, printPosts);

        console.log("fluxo finalizado");
    } else {
        console.log("Instância rodando com um worker thread!");

        const worker = new Worker("./src/client/worker.js");

        worker.on("message", (posts) => {
            printPosts(posts);
        });

        while (true) {
            const msg = await input("");

            await post.postMessage(name, msg);
        }
    }
})();

/**
 * @param {{user: string, message: string, createdAt: Date}[]} posts 
 */
function printPosts(posts) {
    for (const p of posts) {
        console.log(`${p.user}: ${p.message}`);
    }
}