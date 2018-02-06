/**
 * Author: Ravisha Heshan
 * email: ravishaheshan@gmail.com
 */

var url = "http://pdftest.test/pdf.pdf";
var number_of_pages = 0;
var pages_rendered = 0;
var active_tool = 1; // 1 - Free hand, 2 - Text, 3 - Arrow
var fabricObjects = [];
var color = '#212121';
var font_size = 16;
var active_canvas = 0;

var loadingTask = PDFJS.getDocument(url);
loadingTask.promise.then(function (pdf) {
    var scale = 1.5;
    number_of_pages = pdf.pdfInfo.numPages;
    for (var i = 1; i <= pdf.pdfInfo.numPages; i++) {
        pdf.getPage(i).then(function (page) {
            var viewport = page.getViewport(scale);
            var canvas = document.createElement('canvas');
            document.getElementById('pdf-container').appendChild(canvas);
            canvas.className = 'pdf-canvas';
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            context = canvas.getContext('2d');

            var renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            var renderTask = page.render(renderContext);
            renderTask.then(function () {
                $('.pdf-canvas').each(function (index, el) {
                    $(el).attr('id', 'page-' + (index + 1) + '-canvas');
                });
                pages_rendered++;
                if (pages_rendered == number_of_pages) initFabric();
            });
        });
    }
}, function (reason) {
    console.error(reason);
});

function initFabric() {
    $('canvas').each(function (index, el) {
        var background = el.toDataURL("image/png");
        var fabricObj = new fabric.Canvas(el.id, {
            freeDrawingBrush: {
                width: 1,
                color: color
            }
        });
        fabricObjects.push(fabricObj);
        fabricObj.setBackgroundImage(background, fabricObj.renderAll.bind(fabricObj));
        $(fabricObj.upperCanvasEl).click(function (event) {
            active_canvas = index;
            $('#clear-page').text('Clear Page ' + (index + 1));
            fabricClickHandler(event, fabricObj);
        });
    });
}

function fabricClickHandler(event, fabricObj) {
    if (active_tool == 2) {
        var text = new fabric.IText('Sample text', {
            left: event.clientX - fabricObj.upperCanvasEl.getBoundingClientRect().left,
            top: event.clientY - fabricObj.upperCanvasEl.getBoundingClientRect().top,
            fill: color,
            fontSize: font_size,
            selectable: true
        });
        fabricObj.add(text);
        active_tool = 0;
        $('.tool-button.active').removeClass('active');
    }
}

function enableSelector(event) {
    event.preventDefault();
    var element = ($(event.target).hasClass('tool-button')) ? $(event.target) : $(event.target).parents('.tool-button').first();
    $('.tool-button.active').removeClass('active');
    $(element).addClass('active');
    active_tool = 0;
    if (fabricObjects.length > 0) {
        $.each(fabricObjects, function (index, fabricObj) {
            fabricObj.isDrawingMode = false;
        });
    }
}

function enablePencil(event) {
    event.preventDefault();
    var element = ($(event.target).hasClass('tool-button')) ? $(event.target) : $(event.target).parents('.tool-button').first();
    $('.tool-button.active').removeClass('active');
    $(element).addClass('active');
    active_tool = 1;
    if (fabricObjects.length > 0) {
        $.each(fabricObjects, function (index, fabricObj) {
            fabricObj.isDrawingMode = true;
        });
    }
}

function enableAddText(event) {
    event.preventDefault();
    var element = ($(event.target).hasClass('tool-button')) ? $(event.target) : $(event.target).parents('.tool-button').first();
    $('.tool-button.active').removeClass('active');
    $(element).addClass('active');
    active_tool = 2;
    if (fabricObjects.length > 0) {
        $.each(fabricObjects, function (index, fabricObj) {
            fabricObj.isDrawingMode = false;
        });
    }
}

function enableAddArrow(event) {
    event.preventDefault();
    var element = ($(event.target).hasClass('tool-button')) ? $(event.target) : $(event.target).parents('.tool-button').first();
    $('.tool-button.active').removeClass('active');
    $(element).addClass('active');
    active_tool = 3;
    if (fabricObjects.length > 0) {
        $.each(fabricObjects, function (index, fabricObj) {
            fabricObj.isDrawingMode = false;
            new Arrow(fabricObj, color, function () {
                active_tool = 0;
                $('.tool-button.active').removeClass('active');
            });
        });
    }
}

function deleteSelectedObject() {
    event.preventDefault();
    var activeObject = fabricObjects[active_canvas].getActiveObject();
    if (activeObject)
    {
        if (confirm('Are you sure ?')) fabricObjects[active_canvas].remove(activeObject);
    }
}

function savePDF() {
    var images = [];
    var doc = new jsPDF();
    $.each(fabricObjects, function (index, fabricObj) {
        doc.addPage();
        doc.setPage(index);
        images.push(fabricObj.Canvas.toDataURL('png'));
    });
}

$(function () {
    $('.color-tool').click(function () {
        $('.color-tool.active').removeClass('active');
        $(this).addClass('active');
        color = $(this).get(0).style.backgroundColor;
        $.each(fabricObjects, function (index, fabricObj) {
            fabricObj.freeDrawingBrush.color = color;
        });
    });

    $('#brush-size').change(function () {
        var width = $(this).val();
        $.each(fabricObjects, function (index, fabricObj) {
            fabricObj.freeDrawingBrush.width = width;
        });
    });

    $('#font-size').change(function () {
        font_size = $(this).val();
    });

    $('#clear-page').click(function () {
        var fabricObj = fabricObjects[active_canvas];
        var bg = fabricObj.backgroundImage;
        if (confirm('Are you sure?')) {
            fabricObj.clear();
            fabricObj.setBackgroundImage(bg, fabricObj.renderAll.bind(fabricObj));
        }
    });
});
