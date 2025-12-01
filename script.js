const tutorial = document.getElementById("tutorial");
const pageBanner = document.getElementById("page-banner");

let scrollSensitivity = 2;

function getCSSValue(text, identifierSize) {
    let valueString = text.substring(0, text.length - identifierSize);
    return Number(valueString);
}

function updateCSSValue(value, identifier) {
    let valueString = value.toString() + identifier;
    return valueString;
}

function dropdown(element) {
    let content = element.children;

    for (const child of content) {
        if (child.className === "dropdown-content") {
            content = child;
            break;
        }
    }

    if (content) {
        let display = window.getComputedStyle(content).display; // "block", "none", etc.

        if (display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    }
}

function hover(element, enter) {
    let header = element.children;

    for (const child of header) {
        if (child.className === "dropdown-header") {
            header = child;
            break;
        }
    }

    if (enter) {
        header.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
    } else {
        header.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    }
}

window.addEventListener("scroll", (event) => {
    pageBanner.style.top = updateCSSValue(window.scrollY / scrollSensitivity, "px");
    tutorial.style.filter = `blur(${Math.max(20 - window.scrollY / 10, 0)}px)`;

    pageBanner.style.filter = `blur(${window.scrollY / 25}px)`;
});

for (const dropdownElement of document.getElementsByClassName("dropdown")) {
    dropdownElement.addEventListener("click", (event) => {
        dropdown(dropdownElement);
    });
    dropdownElement.addEventListener("mouseenter", (event) => {
        hover(dropdownElement, true);
    });
    dropdownElement.addEventListener("mouseleave", (event) => {
        hover(dropdownElement, false);
    });
}