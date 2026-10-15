const clear = document.getElementsByClassName("clear")[0]; // first .clear button
const display = document.getElementById("display"); // display div
const btn = document.querySelectorAll('button'); // all buttons on the page
const nums = "1234567890.";
const sign="+-*/";
let exprestion="";
// Add event listener for clear button to reset display
clear.addEventListener("click", () => {
    display.textContent = "0";
    exprestion="";
});
let total=0;
btn.forEach(btns => {
    btns.addEventListener("click", () => {
        if (nums.includes(btns.value)) {
            if (display.textContent == "0") {
                display.textContent = "";
            }
            display.textContent += btns.textContent;
            exprestion += btns.value;
            if (exprestion == ""){
                 display.textContent = "0";
                 exprestion=0;
            }
        }
        else if (sign.includes(btns.value)) {
            let last = exprestion.slice(-1);
            if (exprestion == "" || sign.includes(last)) return;
            display.textContent += btns.textContent;
            exprestion += btns.value;
        }
        else if (btns.value == "=" && exprestion !== "0" && exprestion !== "" && exprestion !== "Error") {
            try {
                let result = eval(exprestion);
                display.textContent = String(result);
                exprestion = String(result);
            } catch (e) {
            }
        }
        else if (btns.value=="CE"){
            display.textContent=display.textContent.slice(0,-1);
            exprestion=e.slice(0,-1);
        }
        else if (btns.value="(" &&  !(nums.includes(exprestion.slice(-1).includes))){
            display.textContent += btns.textContent;
            exprestion += btns.value;
        }

    });
});