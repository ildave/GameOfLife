function Grid(width, height, canvas) {
    this.width = width;
    this.height = height;
    this.ctx = canvas.getContext('2d');
    this.speed = 500;
    this.cellSize = 10;
    this.running = 0;
    this.steps = 0;
    this.color = Color.random();
    this.backGroundColor = Color.rgb(255, 255, 255);
    this.startTime = 0;

    this.grid = new Array(this.width);
}

Grid.prototype.setup = function() {
    for (var i = 0; i < this.width; i ++) {
        this.grid[i] = new Array(this.height);
    }
    for (var i = 0; i < this.width; i ++) {
        for (var j = 0; j < this.height; j++) {
            this.grid[i][j] = false;
        }
    }
}

Grid.prototype.getNextColor = function() {
    var hsl = this.color.hslData();
    var hue = hsl[0];
    var sat = hsl[1];
    var light = hsl[2];
    hue = (hue + (Math.sin(this.steps) + 1) / 2) % 1.0;
    var nextColor = Color.hsl(hue, sat, light);
    this.color = nextColor;
}

Grid.prototype.fillGrid = function(x, y) {
    if (this.grid[x][y]) {
        this.ctx.fillStyle = this.color.hexTriplet();
    }
    else {
        this.ctx.fillStyle = this.backGroundColor.hexTriplet();
    }
    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);

}

Grid.prototype.draw = function() {
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            this.fillGrid(i, j);
        }
    }
}

Grid.prototype.clickGrid = function(x, y, target) {
    var Xcoord = Math.floor(x / this.cellSize);
    var Ycoord = Math.floor(y / this.cellSize);
    this.grid[Xcoord][Ycoord] = !this.grid[Xcoord][Ycoord];    
    this.fillGrid(Xcoord, Ycoord);
    this.encode(target);
}

Grid.prototype.next = function() {
    if ((this.steps % 3) == 2) {
        this.getNextColor();
    }
    var next = new Array(this.width);
    for (var i = 0; i < this.width; i ++) {
        next[i] = new Array(this.height);
    }
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            var n = this.countAliveNeighbours(i, j);
            if (n < 2 && this.grid[i][j]) {  //muoio
                next[i][j] = false;
            }
            else if ((n == 2 || n == 3) && this.grid[i][j]) { //resto vivo
                next[i][j] = true;
            }
            else if (n > 3 && this.grid[i][j]) { ///muoio
                next[i][j] = false;
            }
            else if (n == 3 && !this.grid[i][j]) { //nasco
                next[i][j] = true;
            }
            else {
                next[i][j] = false;
            }
        }
    }
    this.grid = next;
}

Grid.prototype.getCell = function(x, y) {
    return (this.grid[x] && this.grid[x][y]) || undefined;
}

Grid.prototype.countAliveNeighbours = function(x, y) {
    var n = 0;
    var neighbours = [
        this.getCell(x - 1, y - 1),
        this.getCell(x - 1, y),
        this.getCell(x - 1, y + 1),
        this.getCell(x, y - 1),
        this.getCell(x, y + 1),
        this.getCell(x + 1, y - 1),
        this.getCell(x + 1, y),
        this.getCell(x + 1, y + 1)
    ];
    for (var i = 0; i < neighbours.length; i++) {
        if (neighbours[i] === true) {
            n++;
        }
    }
    return n;
}

Grid.prototype.encode = function(target) {
    //b = parseInt(a, 2)  from binary to dec
    var fullString = "";
    for (var i = 0; i < this.width; i ++) {
        for (var j = 0; j < this.height; j++) {
            if (this.grid[j][i]) {
                fullString += "1";
            }
            else {
                fullString += "0";
            }
        }
    }
    var encodedString = "";
    for (var i = 0; i < this.width * this.height; i = i + 8) {
        var word = fullString.substr(i, 8);
        var n = parseInt(word, 2);
        if (n < 10) {
            n = "00" + n;
        }
        else if (n < 100) {
            n = "0" + n;
        }
        encodedString += n;    
    }
    target.value = encodedString;
}

Grid.prototype.decode = function(source) {
    //a.toString(2) -- need to pad
    var encodedString = source.value;
    var binaryString = "";
    for (var i = 0; i < this.width * this.height / 8 * 3; i = i + 3) {
        var digit = parseInt(encodedString.substr(i, 3));
        var binary = digit.toString(2);
        binary = ('00000000' + binary).substring(binary.length); //clever trick to pad left: http://stackoverflow.com/questions/5366849/convert-1-to-0001-in-javascript#comment49328109_5366862
        binaryString += binary;
    }

    for (var i = 0; i < this.width; i ++) {
        for (var j = 0; j < this.height; j++) {
            if (binaryString.substr(i * this.width + j, 1) == "1") {
                this.grid[j][i] = true;
            }
            else {
                this.grid[j][i] = false;
            }
            
        }
    }
    this.draw();
}

Grid.prototype.run = function(stepsTarget, encodeTarget, timestamp) {
    if (timestamp - this.startTime >= this.speed) {
        this.startTime = timestamp;
        this.steps++;
        stepsTarget.value = this.steps;
        this.next();
        this.draw();
        this.encode(encodeTarget);
    }
    var that = this;
    this.running = requestAnimationFrame(function(t) {
        that.run(stepsTarget, encodeTarget, t);
    });
}

Grid.prototype.startStop = function(stepsTarget, button, encodeTarget) {
    if (this.running > 0) {
        cancelAnimationFrame(this.running);
        this.running = 0;
        button.innerHTML = "Run";
    }
    else {
        var that = this;
        that.running = requestAnimationFrame(function(t) {
            this.startTime = t;
            that.run(stepsTarget, encodeTarget, t);
        })
        button.innerHTML = "Stop";
    }
}

Grid.prototype.clear = function(stepsTarget, encodeTarget) {
    for (var i = 0; i < this.width; i ++) {
        for (var j = 0; j < this.height; j++) {
            this.grid[i][j] = false;
        }
    }
    this.steps = 0;
    stepsTarget.value = this.steps;
    encodeTarget.value = "";
    this.draw();
}

Grid.prototype.setSpeed = function(speed) {
    this.speed = speed;
}

Grid.prototype.getRandomBoard = function(stepsTarget, encodeTarget) {
    for (var i = 0; i < this.width; i ++) {
        for (var j = 0; j < this.height; j++) {
            var n = Math.floor((Math.random() * 10) + 1);
            this.grid[i][j] = n > 5;
        }
    }
    this.steps = 0;
    this.color = Color.random();
    stepsTarget.value = this.steps;
    this.draw();
    this.encode(encodeTarget);
}
