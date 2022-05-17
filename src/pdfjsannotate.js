/**
 * PDFAnnotate v2.0.0
 * Author: Ravisha Heshan
 */

const pdfjsLib = require("pdfjs-dist");
const fabric = require("fabric").fabric;
require("./arrow.fabric.js");
const $ = require("jquery")
const jsPDF = require("./jspdf.min.js");
(typeof window !== "undefined"
  ? window
  : {}
).pdfjsWorker = require("./pdfWorker.js");
const SVG_NS = "http://www.w3.org/2000/svg";

const PDFAnnotate = (window.PDFAnnotate = function(container_id, url) {
  this.number_of_pages = 0;
  this.pages_rendered = 0;
  this.active_tool = 1; // 1 - Free hand, 2 - Text, 3 - Arrow
  this.fabricObjects = [];
  this.textContents = [];
  this.color = "#212121";
  this.font_size = 16;
  this.active_canvas = 0;
  this.container_id = container_id;
  this.url = url;
  const instance = this;

  const loadingTask = pdfjsLib.getDocument(this.url);
  loadingTask.promise.then(
    function(pdf) {
      var scale = 1.3;
      instance.number_of_pages = pdf._pdfInfo.numPages;

      for (var i = 1; i <= instance.number_of_pages; i++) {
        pdf.getPage(i).then(function(page) {
          var viewport = page.getViewport(scale);
          var imageCanvas = document.createElement("canvas");
          document
            .getElementById(instance.container_id)
            .appendChild(imageCanvas);
          imageCanvas.className = "pdf-image-canvas";
          imageCanvas.height = viewport.height;
          imageCanvas.width = viewport.width;
          imageCanvas.style.marginLeft = "-" + viewport.width / 2 + "px";
          imageCanvasContext = imageCanvas.getContext("2d");

          page
            .render({
              canvasContext: imageCanvasContext,
              viewport: viewport,
            })
            .then(function() {
              return page.getTextContent();
            })
            .then(function(textContent) {
              instance.pages_rendered++;

              if (instance.pages_rendered == instance.number_of_pages) {
                $(".pdf-image-canvas").each(function(index, el) {
                  var imageCanvasElement = el;
                  imageCanvasElement.id = `page-${index + 1}-image-canvas`;
                  var svg = instance.buildTextSvg(viewport, textContent);
                  instance.initFabric(imageCanvasElement, svg);
                });
              }
            });
        });
      }
    },
    function(reason) {
      console.error(reason);
    }
  );

  this.initFabric = function(imageCanvasElement, textSvg) {
    var instance = this;
    var background = imageCanvasElement.toDataURL("image/png");
    var fabricObj = new fabric.Canvas(imageCanvasElement.id, {
      freeDrawingBrush: {
        width: 1,
        color: instance.color,
      },
    });
    instance.fabricObjects.push(fabricObj);
    fabricObj.setBackgroundImage(
      background,
      fabricObj.renderAll.bind(fabricObj)
    );
    $(fabricObj.upperCanvasEl).click(function(event) {
      instance.active_canvas = index;
      instance.fabricClickHandler(event, fabricObj);
    });
    imageCanvasElement.parentNode.prepend(textSvg);
  };

  this.buildTextSvg = function(viewport, textContent) {
    var svg = document.createElementNS(SVG_NS, "svg:svg");
    svg.setAttribute("width", viewport.width + "px");
    svg.setAttribute("height", viewport.height + "px");
    svg.setAttribute("font-size", 1);

    textContent.items.forEach(function(textItem) {
      var tx = pdfjsLib.Util.transform(
        pdfjsLib.Util.transform(viewport.transform, textItem.transform),
        [1, 0, 0, -1, 0, 0]
      );
      console.log(textItem, textContent);
      
      var style = textContent.styles[textItem.fontName];
      var text = document.createElementNS(SVG_NS, "svg:text");
      text.setAttribute("transform", "matrix(" + tx.join(" ") + ")");
      text.setAttribute("font-family", style.fontFamily);
      text.textContent = textItem.str;
      svg.appendChild(text);
    });
    return svg;
  };

  this.fabricClickHandler = function(event, fabricObj) {
    var instance = this;
    if (instance.active_tool == 2) {
      var text = new fabric.IText("Sample text", {
        left:
          event.clientX - fabricObj.upperCanvasEl.getBoundingClientRect().left,
        top:
          event.clientY - fabricObj.upperCanvasEl.getBoundingClientRect().top,
        fill: instance.color,
        fontSize: instance.font_size,
        selectable: true,
      });
      fabricObj.add(text);
      instance.active_tool = 0;
    }
  };
});

PDFAnnotate.prototype.enablePencil = function() {
  var instance = this;
  instance.active_tool = 1;
  if (instance.fabricObjects.length > 0) {
    $.each(instance.fabricObjects, function(index, fabricObj) {
      fabricObj.isDrawingMode = true;
    });
  }
};

PDFAnnotate.prototype.savePdf = function(fileName) {
  if (typeof fileName == "undefined" || fileName.length == 0)
    fileName = "sample.pdf";

  var instance = this;
  var doc = new jsPDF();
  $.each(instance.fabricObjects, function(index, fabricObj) {
    fabricObj.backgroundImage = false;
    if (index != 0) {
      doc.addPage();
      doc.setPage(index + 1);
    }
    doc.addImage(
      document.getElementById(fabricObj.lowerCanvasEl.id + "-copy").toDataURL(),
      "png",
      0,
      0
    );
    doc.addImage(fabricObj.toDataURL(), "png", 0, 0);
  });
  doc.save(fileName);
};

module.exports = PDFAnnotate;