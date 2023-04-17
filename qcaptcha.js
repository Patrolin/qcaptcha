// private scope
(() => {
    // random
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
    // checks
    function setCanvasSize(canvasTag, width, height) {
        canvasTag.style = "width: 300px; height: 150px";
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
    // TODO: make different checks
    const CHECKS = [readNumber];
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
