//@ts-check
const { Worker, isMainThread, parentPort } = require('worker_threads');
const post = require('./service/post');

if (isMainThread) throw new Error("Workers não podem ser executados como Main Thread");

if (!parentPort) throw new Error("Falha em se conectar com o Main Thread");

(async () => {
    await post.poll(1000, (posts) => {
        parentPort?.postMessage(posts);
    });
})()