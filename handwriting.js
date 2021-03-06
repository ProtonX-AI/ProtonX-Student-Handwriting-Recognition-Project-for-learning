/**
 * class Handwriting
 * Handles user handwriting input and displays the predicted values
 */
class Handwriting {

	/**
	 * Declare variables and set up events
	 */
	constructor() {

		let $ = document.getElementById.bind(document);
		this.model = new Model
		// set up canvas
		this.drawingLineWidthEl = $("drawing-line-width")
		this.clearEl = $("clear-canvas")
		this.outputEl = $("output")

		this.canvas = new fabric.Canvas('handwriting', {
			backgroundColor: "#fff",
			isDrawingMode: true
		})
		this.canvas.freeDrawingBrush.color = "#000"
		this.resetCanvas(true)
		this.resizeCanvas()

		// let the user interact once the model is ready
		this.model.isWarmedUp.then(this.bindEvents.bind(this))
	}

	/**
	 * Resets the canvas to a blank state and optionally removes previous predictions
	 * @param {bool} removeText
	 */
	resetCanvas(removeText = true) {

		this.canvas.clear()
		this.canvas.backgroundColor = "#fff"

		if(removeText) {
			this.outputEl.value = ""
			this.model.clearInput()
		}
	}

	/**
	 * Rescales the canvas according to current window dimensions
	 */
	resizeCanvas() {

		this.canvas.setDimensions({
			width: window.innerWidth,
			height: window.innerHeight*0.63-28
		})
		this.canvas.calcOffset()
		this.canvas.renderAll()
	}

	/**
	 * Captures a tight crop around the current drawing on the canvas
	 * and passes it to the model to make a prediction
	 */
	captureDrawing() {

		let group = new fabric.Group(this.canvas.getObjects()),
			{ left, top, width, height } = group,
			scale = window.devicePixelRatio,
			image = this.canvas.contextContainer.getImageData(left*scale, top*scale, width*scale, height*scale);
		//this.showCapturedData(image);
		//this.showRect({ left, top, width, height });
		// group.animate('opacity', '0', {
		// 	duration: 200,
		// 	onChange: this.canvas.renderAll.bind(this.canvas),
		// 	onComplete: () => this.resetCanvas(false)
		// });
		this.resetCanvas(false)
		return image

	}

	/**
	 * Helper function that shows the crop around the handwriting
	 * @param {object} dims
	 */
	showRect(dims) {

		let options = {
				fill: 'rgba(255,127,39,.5)',
				...dims
			};

		this.canvas.add(new fabric.Rect(options))
	}

	/**
	 * Helper function that shows the captured image data
	 * @param {ImageData} pixelData
	 */
	showCapturedData(pixelData) {
		// render captured area onto a canvas for comparison
		let can = document.getElementById("output"),
			ctx = can.getContext("2d");
		can.width = pixelData.width;
		can.height = pixelData.height;
		ctx.putImageData(pixelData, 0, 0);
	}

	/**
	 * Binds all necessary events for interactivity
	 */
	bindEvents() {

		this.outputEl.placeholder = "Write below..."
		this.clearEl.onclick = this.resetCanvas.bind(this)

		this.drawingLineWidthEl.onchange = ({target}) => {
			this.canvas.freeDrawingBrush.width = parseInt(target.value, 10) || 1
			target.previousSibling.innerHTML = target.value
		};

		this.canvas.freeDrawingBrush.width = parseInt(this.drawingLineWidthEl.value, 10) || 1
		this.drawingLineWidthEl.previousSibling.innerHTML = this.canvas.freeDrawingBrush.width

		let timerId = null,
			isTouchDevice = 'ontouchstart' in window,
			timeOutDuration = isTouchDevice ? 400 : 800,
			hasTimedOut = true;

		this.canvas.on("mouse:down", (options) => {
				// reset the canvas in case something was drawn previously
				if(hasTimedOut) this.resetCanvas(false)
				hasTimedOut = false
				// clear any timer currently active
				if(timerId) {
					clearTimeout(timerId)
					timerId = null
				}
			})
			.on("mouse:up", () => {
				// set a new timer
				timerId = setTimeout(() => {
					// once timer is triggered, flag it and run prediction
					hasTimedOut = true
					let [character, probability] = this.model.predict(this.captureDrawing())
					this.outputEl.value += (true || probability > 0.5) ? character : "?"
				}, timeOutDuration)
			})

		window.onresize = this.resizeCanvas.bind(this)
	}
}

let handwriting = new Handwriting;


var TxtRotate = function(el, toRotate, period) {
  this.toRotate = toRotate;
  this.el = el;
  this.loopNum = 0;
  this.period = parseInt(period, 10) || 2000;
  this.txt = '';
  this.tick();
  this.isDeleting = false;
};

TxtRotate.prototype.tick = function() {
  var i = this.loopNum % this.toRotate.length;
  var fullTxt = this.toRotate[i];

  if (this.isDeleting) {
    this.txt = fullTxt.substring(0, this.txt.length - 1);
  } else {
    this.txt = fullTxt.substring(0, this.txt.length + 1);
  }

  this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

  var that = this;
  var delta = 300 - Math.random() * 100;

  if (this.isDeleting) { delta /= 2; }

  if (!this.isDeleting && this.txt === fullTxt) {
    delta = this.period;
    this.isDeleting = true;
  } else if (this.isDeleting && this.txt === '') {
    this.isDeleting = false;
    this.loopNum++;
    delta = 500;
  }

  setTimeout(function() {
    that.tick();
  }, delta);
};

window.onload = function() {
  var elements = document.getElementsByClassName('txt-rotate');
  for (var i=0; i<elements.length; i++) {
    var toRotate = elements[i].getAttribute('data-rotate');
    var period = elements[i].getAttribute('data-period');
    if (toRotate) {
      new TxtRotate(elements[i], JSON.parse(toRotate), period);
    }
  }
  // INJECT CSS
  var css = document.createElement("style");
  css.type = "text/css";
  css.innerHTML = ".txt-rotate > .wrap { border-right: 0.08em solid #666 }";
  document.body.appendChild(css);
};
