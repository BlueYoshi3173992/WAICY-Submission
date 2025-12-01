const URL = "./model/";

const button = document.getElementById("model-start");
const type = document.getElementById("type-value");
const elements = document.getElementsByClassName("interactive-ui");

const COUNTER = "counter";
const SLIDER = "slider";
const BOOL = "bool";

let model, webcam, labelContainer, maxPredictions;

let selectableElement = 0;

let selectedElement = -1;
let previousID = "";

function getUIElement(index) {
    if (!elements || elements.length === 0) return null;
    const idx = Math.min(Math.max(0, Math.floor(index)), elements.length - 1);
    return elements[idx];
}

function getUIElementType(element) {
    if (!element || !element.tagName) return null;
    let tagName = element.tagName;
    if (tagName === "INPUT" && element.type) {
        let type = element.type;
        if (type === "checkbox") {
            return BOOL;
        }
        if (type === "range") {
            return SLIDER;
        }
    }
    if (tagName === "DIV") {
        return COUNTER;
    }
    return null;
}

function setBoolUIValue(element) {
    if (!element) return;
    let checked = element.checked;
    element.checked = checked ? false : true;
}

function incrementSlider(element, value) {
    let sliderValue = Number(element.value);
    max = element.max;
    min = element.min;
    element.value = value > 0 ? Math.min(sliderValue + value, max) : Math.max(sliderValue + value, min);
}

function incrementCounter(element, value) {
    let counterValue = Number(element.dataset.value);
    element.dataset.value = counterValue + value;
}

function showSelected(element, show) {
    if (show) {
        element.style.backgroundColor = "rgb(0,0,0,0.5)";
    }
}

function callback(id) {
    if (id.className === "Select" && previousID === "Wait") {
        if (selectedElement === -1) {
            let element = getUIElement(selectableElement);
            const elementType = getUIElementType(element);
            if (elementType === BOOL) {
                setBoolUIValue(element);
            } else {
                selectedElement = selectableElement;
            }
        } else {
            selectedElement = -1;
        }
    }
    if (id.className === "Up" && selectedElement === -1 && previousID === "Wait") {
        selectableElement = Math.max(0, selectableElement - 1);
    }
    if (id.className === "Down" && selectedElement === -1 && previousID === "Wait") {
        selectableElement = Math.min(elements.length - 1, selectableElement + 1);
    }
    if (id.className === "Right" && selectedElement !== -1 && (previousID === "Wait" || previousID === "Right" || previousID === "Left")) {
        let element = getUIElement(selectedElement);
        const elementType = getUIElementType(element);
        if (elementType === SLIDER) {
            incrementSlider(element, 1);
        }
        if (elementType === COUNTER) {
            incrementCounter(element, 1);
            element.textContent = "Counter value: " + element.dataset.value;
        }
    }
    if (id.className === "Left" && selectedElement !== -1 && (previousID === "Wait" || previousID === "Left" || previousID === "Right")) {
        let element = getUIElement(selectedElement);
        const elementType = getUIElementType(element);
        if (elementType === SLIDER) {
           incrementSlider(element, -1);
        }
        if (elementType === COUNTER) {
            incrementCounter(element, -1)
            element.textContent = "Counter value: " + element.dataset.value;
        }
    }

    type.textContent = "Current Type: " + id.className + ", Element Index: " + selectableElement + ", Selected Element: " + selectedElement;

    previousID = id.className;
}

 // Load the image model and setup the webcam
async function initModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    const windowWidth = window.innerWidth;

     // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

     // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(windowWidth * 0.3, windowWidth * 0.3, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

     // append elements to the DOM
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("li"));
    }

    startMostPredictedInterval(callback);

    button.style.backgroundColor = "rgba(0, 127, 180)";
    button.style.color = "rgba(55, 170, 255)";
    button.style.borderColor = "rgba(55, 170, 255)";
}

 async function loop() {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

 // run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}

function startMostPredictedInterval(callback) {
    if (!model || !webcam) throw new Error("Model or webcam not initialized");
    const id = setInterval(async () => {
        try {
            const predictions = await model.predict(webcam.canvas);

            if (!predictions || predictions.length === 0) return;

            let best = predictions[0];

            for (let i = 1; i < predictions.length; i++) {
                if (predictions[i].probability > best.probability) best = predictions[i];
            }

            const result = { className: best.className, probability: best.probability };

            if (typeof callback === "function") callback(result);

            else console.log("Most predicted:", result.className, result.probability.toFixed(2));
        } catch (e) {
            console.error("Error getting prediction:", e);
        }
    }, 1000);
    return id;
}

function stopMostPredictedInterval(id) {
    clearInterval(id);
}