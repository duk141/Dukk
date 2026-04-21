
let history = JSON.parse(localStorage.getItem("his")) || [];

function save(){
    localStorage.setItem("his", JSON.stringify(history));
}

function add(x){
    history.push(x);
    save();
    render();
}

function resetGame(){
    history = [];
    save();
    render();
}

// ===== BEAD PLATE =====
function drawBead(){
    let bead = document.getElementById("bead");
    bead.innerHTML = "";

    history.forEach(x=>{
        let d = document.createElement("div");
        d.className = "cell " + x;
        bead.appendChild(d);
    });
}

// ===== BIG ROAD (đơn giản hóa) =====
function drawRoad(){
    let road = document.getElementById("road");
    road.innerHTML = "";

    let col = 0, row = 0;
    let last = null;

    history.forEach(x=>{
        if(x === "T") return;

        if(x === last){
            row++;
        }else{
            col++;
            row = 0;
        }

        let d = document.createElement("div");
        d.className = "cell " + x;
        d.style.gridColumn = col;
        d.style.gridRow = row+1;

        road.appendChild(d);
        last = x;
    });
}

// ===== AI MARKOV + WEIGHT =====
function predict(){
    let clean = history.filter(x=>x!=="T");

    if(clean.length < 5){
        document.getElementById("predict").innerText = "AI: chưa đủ dữ liệu";
        return;
    }

    let w1 = {B:{B:0,P:0}, P:{B:0,P:0}};
    let w2 = {};

    // weighted (ván gần nặng hơn)
    for(let i=0;i<clean.length-1;i++){
        let w = i+1;
        let cur = clean[i];
        let next = clean[i+1];
        w1[cur][next]+=w;
    }

    for(let i=0;i<clean.length-2;i++){
        let key = clean[i]+clean[i+1];
        let next = clean[i+2];
        let w = i+1;

        if(!w2[key]) w2[key]={B:0,P:0};
        w2[key][next]+=w;
    }

    let last = clean[clean.length-1];
    let last2 = clean.slice(-2).join("");

    let probB, probP, mode;

    if(w2[last2]){
        let d = w2[last2];
        let t = d.B + d.P;
        probB = d.B/t;
        probP = d.P/t;
        mode = "Markov 2";
    }else{
        let d = w1[last];
        let t = d.B + d.P;
        probB = d.B/t;
        probP = d.P/t;
        mode = "Markov 1";
    }

    let pick = probB > probP ? "Banker" : "Player";

    document.getElementById("predict").innerText =
        `AI: ${pick} (${mode})
B: ${(probB*100).toFixed(1)}% | P: ${(probP*100).toFixed(1)}%`;
}

// ===== RENDER =====
function render(){
    drawBead();
    drawRoad();
    predict();
}

render();
