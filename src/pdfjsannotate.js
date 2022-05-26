/**
 * PDFAnnotate v2.0.0
 * Author: Ravisha Heshan
 */

const pdfjsLib = require("pdfjs-dist/legacy/build/pdf");
const fabric = require("fabric").fabric;
require("./arrow.fabric.js");
const $ = require("jquery")
const jsPDF = require("./jspdf.min.js");
(typeof window !== "undefined"
  ? window
  : {}
).pdfjsWorker = require("pdfjs-dist/legacy/build/pdf.worker");
const SVG_NS = "http://www.w3.org/2000/svg";

// Event List
const PDFAnnotate = (window.PDFAnnotate = function (container_id, url, options) {
  this.number_of_pages = 0;
  this.pages_rendered = 0;
  this.active_tool = 1; // 1 - Free hand, 2 - Text, 3 - Arrow
  this.fabricObjects = [];
  this.fabricObjectsData = [];
  this.textContents = []; // extra
  this.color = "#212121";
  this.borderColor = '#000000';
  this.borderSize = 1;
  this.font_size = 16;
  this.active_canvas = 0;
  this.container_id = container_id;
  this.url = url;
  this.options = options
  this.format;
  this.orientation;
  const inst = this;

  this.options.Error = this.options.Error || ((reason) => { console.error(reason) });
  const loadingTask = pdfjsLib.getDocument(this.url);
  loadingTask.promise.then(
    function (pdf) {
      var scale = 1.3;
      inst.number_of_pages = pdf._pdfInfo.numPages;
      for (var i = 1; i <= inst.number_of_pages; i++) {
        pdf.getPage(i).then(function (page) {

          if (typeof inst.format === 'undefined' ||
            typeof inst.orientation === 'undefined') {
            var originalViewport = page.getViewport({ scale: 1 });
            inst.format = [originalViewport.width, originalViewport.height];
            inst.orientation =
              originalViewport.width > originalViewport.height ?
                'landscape' :
                'portrait';
          }

          var viewport = page.getViewport({ scale });
          var imageCanvas = document.createElement("canvas");
          document
            .getElementById(inst.container_id)
            .appendChild(imageCanvas);
          imageCanvas.className = "pdf-image-canvas";
          imageCanvas.height = viewport.height;
          imageCanvas.width = viewport.width;
          // imageCanvas.style.marginLeft = "-" + viewport.width / 2 + "px";
          imageCanvasContext = imageCanvas.getContext("2d");

          page
            .render({
              canvasContext: imageCanvasContext,
              viewport: viewport,
            })
            .promise
            // .then(function () {
            //   return page.getTextContent();
            // })
            .then(function () {
              inst.pages_rendered++;

              if (inst.pages_rendered == inst.number_of_pages) {
                $(".pdf-image-canvas").each(function (index, el) {
                  var imageCanvasElement = el;
                  imageCanvasElement.id = `page-${index + 1}-image-canvas`;
                  // var svg = inst.buildTextSvg(viewport, textContent);
                });
                inst.initFabric();
              }
            });
        });
      }

    },
    function (reason) {
      options.Error(reason);
    }
  );

  this.initFabric = function (
    // imageCanvasElement, textSvg, index
  ) {
    var inst = this;
    // var background = imageCanvasElement.toDataURL("image/png");
    // var fabricObj = new fabric.Canvas(imageCanvasElement.id, {
    //   freeDrawingBrush: {
    //     width: 1,
    //     color: inst.color,
    //   },
    //   enableRetinaScaling: false
    // });

    let canvases = $('#' + inst.container_id + ' canvas');
    canvases.each(function (index, el) {
      var background = el.toDataURL('image/png');
      var fabricObj = new fabric.Canvas(el.id, {
        freeDrawingBrush: {
          width: 1,
          color: inst.color,
        },
      });

      inst.fabricObjects.push(fabricObj);

      if (typeof options.onPageUpdated == 'function') {
        fabricObj.on('object:added', function () {
          var oldValue = Object.assign({}, inst.fabricObjectsData[index]);
          inst.fabricObjectsData[index] = fabricObj.toJSON();
          options.onPageUpdated(
            index + 1,
            oldValue,
            inst.fabricObjectsData[index]
          );
        });
      }
      fabricObj.setBackgroundImage(
        background,
        fabricObj.renderAll.bind(fabricObj)
      );
      $(fabricObj.upperCanvasEl).click(function (event) {
        inst.active_canvas = index;
        inst.fabricClickHandler(event, fabricObj);
      });
      fabricObj.on('after:render', function () {
        inst.fabricObjectsData[index] = fabricObj.toJSON();
        fabricObj.off('after:render');
      });
      if (index === canvases.length - 1 && typeof options.ready === 'function') {
        options.ready();
      }
    });
    // imageCanvasElement.parentNode.prepend(textSvg);
  };

  // this.buildTextSvg = function (viewport, textContent) {
  //   var svg = document.createElementNS(SVG_NS, "svg:svg");
  //   svg.setAttribute("width", viewport.width + "px");
  //   svg.setAttribute("height", viewport.height + "px");
  //   svg.setAttribute("font-size", 1);

  //   textContent.items.forEach(function (textItem) {
  //     var tx = pdfjsLib.Util.transform(
  //       pdfjsLib.Util.transform(viewport.transform, textItem.transform),
  //       [1, 0, 0, -1, 0, 0]
  //     );
  //     console.log(textItem, textContent);

  //     var style = textContent.styles[textItem.fontName];
  //     var text = document.createElementNS(SVG_NS, "svg:text");
  //     text.setAttribute("transform", "matrix(" + tx.join(" ") + ")");
  //     text.setAttribute("font-family", style.fontFamily);
  //     text.textContent = textItem.str;
  //     svg.appendChild(text);
  //   });
  //   return svg;
  // };

  this.fabricClickHandler = function (event, fabricObj) {
    var inst = this;
    var toolObj;
    if (inst.active_tool == 2) {
      var text = new fabric.IText("Sample text", {
        left:
          event.clientX - fabricObj.upperCanvasEl.getBoundingClientRect().left,
        top:
          event.clientY - fabricObj.upperCanvasEl.getBoundingClientRect().top,
        fill: inst.color,
        fontSize: inst.font_size,
        selectable: true,
      });
      fabricObj.add(text);
      inst.active_tool = 0;
    }
    else if (inst.active_tool == 4) {
      toolObj = new fabric.Rect({
        left: event.clientX - fabricObj.upperCanvasEl.getBoundingClientRect().left,
        top: event.clientY - fabricObj.upperCanvasEl.getBoundingClientRect().top,
        width: 100,
        height: 100,
        fill: inst.color,
        stroke: inst.borderColor,
        strokeSize: inst.borderSize,
      });
    }
    if (toolObj) {
      fabricObj.add(toolObj);
    }
  };
});

PDFAnnotate.prototype.enablePencil = function () {
  var inst = this;
  inst.active_tool = 1;
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = true;
    });
  }
};

PDFAnnotate.prototype.enableSelector = function () {
  var inst = this;
  inst.active_tool = 0;
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = false;
    });
  }
};

PDFAnnotate.prototype.savePdf = function (fileName) {
  if (typeof fileName == "undefined" || fileName.length == 0)
    fileName = "sample.pdf";

  var inst = this;
  inst.save("save", { fileName })
}
PDFAnnotate.prototype.save = function (type, options) {
  var inst = this;
  var doc = new jsPDF();
  $.each(inst.fabricObjects, function (index, fabricObj) {
    fabricObj.backgroundImage = false;
    if (index != 0) {
      doc.addPage();
      doc.setPage(index + 1);
    }
    doc.addImage(
      document.getElementById(fabricObj.lowerCanvasEl.id).toDataURL(),
      "png",
      0,
      0
    );
    doc.addImage(fabricObj.toDataURL(), "png", 0, 0);
  });
  return doc.output(type, options);
};

PDFAnnotate.prototype.enableAddText = function (text) {
  var inst = this;
  inst.active_tool = 2;
  if (typeof text === 'string') {
    inst.textBoxText = text;
  }
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = false;
    });
  }
};

PDFAnnotate.prototype.enableRectangle = function () {
  var inst = this;
  var fabricObj = inst.fabricObjects[inst.active_canvas];
  inst.active_tool = 4;
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = false;
    });
  }
};

PDFAnnotate.prototype.enableAddArrow = function (onDrawnCallback = null) {
  var inst = this;
  inst.active_tool = 3;
  if (inst.fabricObjects.length > 0) {
    $.each(inst.fabricObjects, function (index, fabricObj) {
      fabricObj.isDrawingMode = false;
      new Arrow(fabricObj, inst.color, function () {
        inst.active_tool = 0;
        if (typeof onDrawnCallback === 'function') {
          onDrawnCallback();
        }
      });
    });
  }
};

PDFAnnotate.prototype.addImageToCanvas = function () {
  var inst = this;
  var fabricObj = inst.fabricObjects[inst.active_canvas];

  if (fabricObj) {
    var inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = '.jpg,.jpeg,.png,.PNG,.JPG,.JPEG';
    inputElement.onchange = function () {
      var reader = new FileReader();
      reader.addEventListener(
        'load',
        function () {
          inputElement.remove();
          var image = new Image();
          image.onload = function () {
            fabricObj.add(new fabric.Image(image));
          };
          image.src = this.result;
        },
        false
      );
      reader.readAsDataURL(inputElement.files[0]);
    };
    document.getElementsByTagName('body')[0].appendChild(inputElement);
    inputElement.click();
  }
};

PDFAnnotate.prototype.deleteSelectedObject = function () {
  var inst = this;
  var activeObject = inst.fabricObjects[inst.active_canvas].getActiveObject();
  if (activeObject) {
    if (confirm('Are you sure delete selected object ?')) {
      inst.fabricObjects[inst.active_canvas].remove(activeObject);
    }
  }
};
PDFAnnotate.prototype.setBrushSize = function (size) {
  var inst = this;
  $.each(inst.fabricObjects, function (index, fabricObj) {
    fabricObj.freeDrawingBrush.width = parseInt(size, 10) || 1;
  });
};

PDFAnnotate.prototype.setColor = function (color) {
  var inst = this;
  inst.color = color;
  $.each(inst.fabricObjects, function (index, fabricObj) {
    fabricObj.freeDrawingBrush.color = color;
  });
};

PDFAnnotate.prototype.setBorderColor = function (color) {
  var inst = this;
  inst.borderColor = color;
};

PDFAnnotate.prototype.setFontSize = function (size) {
  this.font_size = size;
};

PDFAnnotate.prototype.setBorderSize = function (size) {
  this.borderSize = size;
};

PDFAnnotate.prototype.clearActivePage = function () {
  var inst = this;
  var fabricObj = inst.fabricObjects[inst.active_canvas];
  var bg = fabricObj.backgroundImage;
  if (confirm('Are you sure clear current page?')) {
    fabricObj.clear();
    fabricObj.setBackgroundImage(bg, fabricObj.renderAll.bind(fabricObj));
  }
};

PDFAnnotate.prototype.serializePdf = function (callback) {
  var inst = this;
  var pageAnnotations = [];
  inst.fabricObjects.forEach(function (fabricObject) {
    fabricObject.clone(function (fabricObjectCopy) {
      fabricObjectCopy.setBackgroundImage(null);
      fabricObjectCopy.setBackgroundColor('');
      pageAnnotations.push(fabricObjectCopy);
      if (pageAnnotations.length === inst.fabricObjects.length) {
        var data = {
          page_setup: {
            format: inst.format,
            orientation: inst.orientation,
          },
          pages: pageAnnotations,
        };
        callback(JSON.stringify(data));
      }
    });
  });
};

PDFAnnotate.prototype.loadFromJSON = function (jsonData) {
  var inst = this;
  var { page_setup, pages } = jsonData;
  if (typeof pages === 'undefined') {
    pages = jsonData;
  }
  if (
    typeof page_setup === 'object' &&
    typeof page_setup.format === 'string' &&
    typeof page_setup.orientation === 'string'
  ) {
    inst.format = page_setup.format;
    inst.orientation = page_setup.orientation;
  }
  $.each(inst.fabricObjects, function (index, fabricObj) {
    if (pages.length > index) {
      fabricObj.loadFromJSON(pages[index], function () {
        inst.fabricObjectsData[index] = fabricObj.toJSON();
      });
    }
  });
};

PDFAnnotate.prototype.setDefaultTextForTextBox = function (text) {
  var inst = this;
  if (typeof text === 'string') {
    inst.textBoxText = text;
  }
};
module.exports = PDFAnnotate;
