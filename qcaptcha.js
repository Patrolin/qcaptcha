// private scope
(() => {
    // math
    function randInt(n) {
        const min_r = 2**32 % n;
        while (true) {
            const arr = new Uint32Array(1);
            window.crypto.getRandomValues(arr);
            const r = arr[0];
            if (r >= min_r) return r % n;
        }
    }
    function rand() {
        const arr = new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        return arr[0] / 2**32;
    }
    function choose(arr) {
        return arr[Math.floor(rand() * arr.length)];
    }
    function shuffle(arr) {
        let acc = [...arr];
        for (let i = 0; i < acc.length; i++) {
            const j = randInt(acc.length);
            const tmp = acc[i];
            acc[i] = acc[j]
            acc[j] = tmp;
        }
        return acc;
    }
    function lerp(t, x, y) {
        return (1-t)*x + t*y;
    }
    // canvas
    function setCanvasSize(canvasTag, width, height) {
        canvasTag.style = `width: ${width}px; height: ${height}px`;
        canvasTag.width = width;
        canvasTag.height = height;
    }
    function makeInput(parentTag, onChange) {
        const inputTag = document.createElement("input");
        inputTag.type = "number";
        inputTag.addEventListener("input", () => {
            inputTag.setCustomValidity("");
        })
        inputTag.addEventListener("change", onChange);
        parentTag.appendChild(inputTag);
        return (error) => {
            inputTag.setCustomValidity(error);
            inputTag.reportValidity();
        }
    }
    function reportValidity() {}
    // checks
    function readNumber(parentTag, canvasTag) {
        const state = { correct: false, reportValidity };
        const expectedNumber = randInt(1000);
        state.reportValidity = makeInput(parentTag, (event) => {
            state.correct = (+event.target.value === expectedNumber);
        });
        // fill black
        const width = 300, height = 150;
        setCanvasSize(canvasTag, width, height);
        const context = canvasTag.getContext("2d");
        context.fillStyle = "black";
        context.fillRect(0, 0, width, height);
        // randomly draw text
        context.fillStyle = "white";
        const fontStyle = choose(["", "italic "]);
        const fontWeight = choose(["", "bold "]);
        const fontSize = `${rand()*22 + 16}px `;
        const fontFamily = choose(["serif", "sans-serif", "monospace"]);
        const font = fontStyle + fontWeight + fontSize + fontFamily;
        context.font = font;
        context.textBaseline = "bottom";
        context.translate(width/2 - randInt(48), height/2 - randInt(48));
        context.rotate(rand() * Math.PI);
        const expectedNumberString = String(expectedNumber);
        const textWidth = context.measureText(expectedNumberString).width;
        context.fillText(expectedNumberString, 0, 0);
        context.fillRect(0, 2 - randInt(4), textWidth, 1);
        // add noise
        const imageData = context.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        for (let i = 0; i < width*height*4; i += 4) {
            pixels[i] += 2 - randInt(4);
            pixels[i+1] += 2 - randInt(4);
            pixels[i+2] += 2 - randInt(4);
        }
        context.putImageData(imageData, 0, 0);
        return state;
    }
    function ticTacToe(parentTag, canvasTag) {
        // setup
        const width = 250, height = 250;
        setCanvasSize(canvasTag, width, height);
        const context = canvasTag.getContext("2d");
        // game
        let game; // (empty | player | ai)[]
        let gameState; // in_progress | player_won | ai_won | draw
        const resetGame = () => {
            game = Array(9).fill(0);
            gameState = 0;
        }
        resetGame();
        const renderGame = () => {
            // board
            context.fillStyle = "black";
            context.fillRect(0, 0, width, height);
            context.fillStyle = "white";
            context.fillRect(lerp(1/3, 0, width), 0, 1, height);
            context.fillRect(lerp(2/3, 0, width), 0, 1, height);
            context.fillRect(0, lerp(1/3, 0, height), width, 1);
            context.fillRect(0, lerp(2/3, 0, height), width, 1);
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.font = "22px monospace";
            for (y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    const cell = game[3*y + x];
                    const letter = (cell === 1) ? "x" : (cell === 2 ? "o" : "");
                    context.fillText(letter, lerp(1/6 + x/3, 0, width), lerp(1/6 + y/3, 0, height));
                }
            }
        }
        renderGame();
        const WIN_LINES = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];
        const topLine = (forPlayer) => {
            let accLine = [WIN_LINES[0], 0];
            for (let line of shuffle(WIN_LINES)) {
                let accValue = 0;
                for (let index of line) {
                    const cell = game[index];
                    if (cell === forPlayer) accValue++;
                    else if (cell !== 0) accValue = -10;
                }
                if (accValue >= accLine[1]) {
                    accLine = [line, accValue];
                }
            }
            return accLine;
        }
        const wonGame = (forPlayer) => topLine(forPlayer)[1] === 3
        const gameOnClick = (event) => {
            if (gameState >= 2) {
                resetGame();
                renderGame();
                return;
            }
            if (gameState !== 0) return;
            // player
            const rect = canvasTag.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left) / width * 3);
            const y = Math.floor((event.clientY - rect.top) / height * 3);
            if (game[3*y + x] !== 0) return;
            game[3*y + x] = 1;
            if (wonGame(1)) {
                gameState = 1;
            } else {
                const allFreeIndices = game.map((v, i) => [v, i]).filter(([v, i]) => v === 0).map(([v, i]) => i);
                if (allFreeIndices.length === 0) {
                    gameState = 3;
                } else {
                    // ai
                    const topPlayerLine = topLine(1);
                    const topAiLine = topLine(2);
                    const line = (topAiLine[1] === 2) ? topAiLine : (topPlayerLine[1] === 2) ? topPlayerLine : topAiLine;
                    let freeIndices = line[0].filter(index => game[index] === 0);
                    if (freeIndices.length === 0) freeIndices = allFreeIndices;
                    const index = choose(freeIndices);
                    console.log(line, freeIndices, index);
                    game[index] = 2;
                    if (wonGame(2)) {
                        gameState = 2;
                    }
                }
            }
            renderGame();
        }
        const state = { correct: false, reportValidity };
        canvasTag.addEventListener("click", gameOnClick);
        return state;
    }
    const CHECKS = [ticTacToe];
    //const CHECKS = [readNumber, ticTacToe];
    function makeCaptcha(parentTag) {
        parentTag.style = "display: flex; flex-direction: column";
        const canvasTag = document.createElement("canvas");
        parentTag.appendChild(canvasTag);
        const check = choose(CHECKS);
        return check(parentTag, canvasTag);
    }
    // force window.makeCaptcha to be constant
    Object.freeze(makeCaptcha);
    Object.defineProperty(window, "makeCaptcha", {
        value: makeCaptcha,
        writable: false,
        configurable: false,
    });
})()
