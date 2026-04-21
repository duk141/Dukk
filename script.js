let history = [];

function getValue(card){
    if(card === "A") return 1;
    if(["10","J","Q","K"].includes(card)) return 0;
    return parseInt(card) || 0;
}

function total(cards){
    return cards.reduce((a,b)=>a+getValue(b),0) % 10;
}

function play(){
    let p = [
        document.getElementById("p1").value.toUpperCase(),
        document.getElementById("p2").value.toUpperCase()
    ];

    let b = [
        document.getElementById("b1").value.toUpperCase(),
        document.getElementById("b2").value.toUpperCase()
    ];

    let pTotal = total(p);
    let bTotal = total(b);

    let p3 = null;

    // Natural
    if(pTotal < 8 && bTotal < 8){

        // Player rút
        if(pTotal <= 5){
            p3 = prompt("Nhập lá thứ 3 của Player:");
            p.push(p3);
            pTotal = total(p);
        }

        // Banker rút
        if(p3 === null){
            if(bTotal <= 5){
                let b3 = prompt("Nhập lá thứ 3 của Banker:");
                b.push(b3);
                bTotal = total(b);
            }
        }else{
            let val = getValue(p3);

            if(
                bTotal <= 2 ||
                (bTotal === 3 && val !== 8) ||
                (bTotal === 4 && val >= 2 && val <= 7) ||
                (bTotal === 5 && val >= 4 && val <= 7) ||
                (bTotal === 6 && val >= 6 && val <= 7)
            ){
                let b3 = prompt("Nhập lá thứ 3 của Banker:");
                b.push(b3);
                bTotal = total(b);
            }
        }
    }

    let result;

    if(pTotal > bTotal) result = "P";
    else if(bTotal > pTotal) result = "B";
    else result = "T";

    history.push(result);

    document.getElementById("roundResult").innerText =
        `Kết quả: ${result} (${pTotal} - ${bTotal})`;

    updateHistory();
    predict();
}

function updateHistory(){
    document.getElementById("history").innerText =
        "Lịch sử: " + history.join(" - ");
}

function predict(){
    if(history.length < 2){
        document.getElementById("predict").innerText = "Dự đoán: --";
        return;
    }

    let last = history[history.length - 1];
    let count = 1;

    for(let i = history.length - 2; i >= 0; i--){
        if(history[i] === last) count++;
        else break;
    }

    let next;

    if(count >= 3){
        next = last === "B" ? "Player" : "Banker";
    }else{
        next = last === "B" ? "Banker" : "Player";
    }

    document.getElementById("predict").innerText =
        "Dự đoán: " + next;
}

function resetGame(){
    history = [];
    document.getElementById("roundResult").innerText = "Kết quả: --";
    document.getElementById("history").innerText = "Lịch sử: --";
    document.getElementById("predict").innerText = "Dự đoán: --";
}
