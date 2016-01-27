function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

function convertToArray(string) {
    var numSplit = string.split(",");
    var ticketUserMap = [];
    for (var key in numSplit) {
        var rNum = numSplit[key].split("-");

        if (rNum.length > 1) {
            var rNumL, rNumR;
            rNum[0] = Number(rNum[0]);
            rNum[1] = Number(rNum[1]);
            if (rNum[0] < rNum[1]) {
                rNumL = rNum[0];
                rNumR = rNum[1];
            } else {
                rNumL = rNum[1];
                rNumR = rNum[0];
            }
            //console.log(rNumL+"--"+rNumR);
            for (var i = rNum[0]; i < rNumR + 1; i++) {
                ticketUserMap.push(i);
            }
        } else {
            rNum = Number(rNum[0]);
            if (!isNaN(rNum))
                ticketUserMap.push(rNum);
        }
    }
    return ticketUserMap;
}