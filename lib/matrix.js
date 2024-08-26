/**
 * @param {number} m 
 * @param {number} n 
 * @param {(i: number, j: number) => number}
 * @returns {number[][]}
 */
function generate(m, n, func) {
    const c = [];

    for (let i = 0; i < m; i++) {
        c[i] = [];
        for (let j = 0; j < n; j++) {
            c[i][j] = func(i, j);   
        }
    }

    return c
}

module.exports = {
    gen: generate,

    /**
     * @param {number} m 
     * @param {number} n 
     * @returns {number[][]}
     */
    zeros: (m, n) => {
        return generate(m, n, () => 0);
    },

    /**
     * @param {number} m 
     * @param {number} n 
     * @returns {number[][]}
     */
    identity: (m, n) => {
        return generate(m, n, (i, j) => +(i === j));
    },
    
    /**
     * @param {number} m 
     * @param {number} n 
     * @returns {number[][]}
     */
    random: (m, n) => {
        return generate(m, n, () => Math.random() * 2 - 1);
    },
    
    /**
     * @param {number[][]} a 
     * @param {number[][]} b 
     * @returns {number[][]}
     */
    sum: (a, b) => {
        return generate(a.length, a[0].length, (i, j) => {
            return a[i][j] + b[i][j];
        });
    },

    /**
     * @param {number[][]} a 
     * @param {number[][]} b 
     * @returns {number[][]}
     */
    mult: (a, b) => {
        if(a[0].length !== b.length) {
            throw new Error("colunas de A devem ser igual a linhas de B");
        }

        return generate(a.length, b[0].length, (i, j) => {
            /** @type{number[][]} */
            let cont = 0;

            for (let k = 0; k < a[0].length; k++) {
                cont += a[i][k] * b[k][j];
            }

            return cont;
        });
    }
}