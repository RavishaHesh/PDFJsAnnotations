/**
 * PDFAnnotate v2.0.0
 * Author: Ravisha Heshan
 */

const $ = require('jquery');
const pdfjsLib = require('pdfjs-dist');
const fabric = require('fabric').fabric;
require('./arrow.fabric.js');
const jsPDF = require('./jspdf.min.js');
(typeof window !== 'undefined' ? window : {}).pdfjsWorker = require('./pdfWorker.js');


const PDFAnnotate = window.PDFAnnotate = function(container_id, url) {
	this.number_of_pages = 0;
	this.pages_rendered = 0;
	this.active_tool = 1; // 1 - Free hand, 2 - Text, 3 - Arrow
	this.fabricObjects = [];
	this.textContents = [];
	this.color = '#212121';
	this.font_size = 16;
	this.active_canvas = 0;
	this.container_id = container_id;
	this.url = url;
	const instance = this;

	const loadingTask = pdfjsLib.getDocument(this.url);
	loadingTask.promise.then(function (pdf) {
	    var scale = 1.3;
	    instance.number_of_pages = pdf._pdfInfo.numPages;

	    for (var i = 1; i <= instance.number_of_pages; i++) {
	        pdf.getPage(i).then(function (page) {
	            var viewport = page.getViewport(scale);
	            var canvas1 = document.createElement('canvas');
	            var canvas2 = document.createElement('canvas');
	            document.getElementById(instance.container_id).appendChild(canvas1);
	            document.getElementById(instance.container_id).appendChild(canvas2);
	            canvas1.className = 'pdf-page-canvas';
	            canvas2.className = 'pdf-page-canvas-copy';
	            canvas1.height = canvas2.height = viewport.height;
	            canvas1.width = canvas2.width = viewport.width;
	            canvas1.style.marginLeft = '-' + (viewport.width/2) + 'px';
	            // canvas2.style.display = 'none';
	            canvas1Context = canvas1.getContext('2d');
	            canvas2Context = canvas2.getContext('2d');

	            Promise.all([
	            	page.render({
		                canvasContext: canvas1Context,
		                viewport: viewport
		            }),
		            page.render({
		                canvasContext: canvas2Context,
		                viewport: viewport
		            })
	            ])
	            .then(function () {
	                return page.getTextContent();
	            }).then(function (textContent) {
	            	instance.textContents.push(textContent);
	                instance.pages_rendered++;
	                
	                if (instance.pages_rendered == instance.number_of_pages) {
		            	$('.pdf-page-canvas').each(function (index, el) {
		                    $(el).attr('id', 'page-' + (index + 1) + '-canvas');
		                    $(el).next().attr('id', 'page-' + (index + 1) + '-canvas-copy');
		                    $(el).next().hide();
		                });
	                	instance.initFabric();
	                }
	            });
	        });
	    }
	}, function (reason) {
	    console.error(reason);
	});

	this.initFabric = function () {
		var instance = this;
	    $('#' + instance.container_id + ' canvas.pdf-page-canvas').each(function (index, el) {
	        var background = el.toDataURL("image/png");
	        var fabricObj = new fabric.Canvas(el.id, {
	            freeDrawingBrush: {
	                width: 1,
	                color: instance.color
	            }
	        });
	        instance.fabricObjects.push(fabricObj);
	        fabricObj.setBackgroundImage(background, fabricObj.renderAll.bind(fabricObj));
	        $(fabricObj.upperCanvasEl).click(function (event) {
	            instance.active_canvas = index;
	            instance.fabricClickHandler(event, fabricObj);
	        });
	    });
	}

	this.fabricClickHandler = function(event, fabricObj) {
		var instance = this;
	    if (instance.active_tool == 2) {
	        var text = new fabric.IText('Sample text', {
	            left: event.clientX - fabricObj.upperCanvasEl.getBoundingClientRect().left,
	            top: event.clientY - fabricObj.upperCanvasEl.getBoundingClientRect().top,
	            fill: instance.color,
	            fontSize: instance.font_size,
	            selectable: true
	        });
	        fabricObj.add(text);
	        instance.active_tool = 0;
	    }
	}
}

PDFAnnotate.prototype.enablePencil = function () {
	var instance = this;
	instance.active_tool = 1;
	if (instance.fabricObjects.length > 0) {
	    $.each(instance.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = true;
	    });
	}
}

PDFAnnotate.prototype.savePdf = function(fileName){
	if (typeof fileName == 'undefined' || fileName.length == 0) fileName = 'sample.pdf';

	var instance = this;
	var doc = new jsPDF();
	$.each(instance.fabricObjects, function (index, fabricObj) {
		fabricObj.backgroundImage = false;
	    if (index != 0) {
	        doc.addPage();
	        doc.setPage(index + 1);
	    }
	    doc.addImage(document.getElementById(fabricObj.lowerCanvasEl.id + '-copy').toDataURL(), 'png', 0, 0);
	    doc.addImage(fabricObj.toDataURL(), 'png', 0, 0);
	});
	doc.save(fileName);
};

module.exports = PDFAnnotate;