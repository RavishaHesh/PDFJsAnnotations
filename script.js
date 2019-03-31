document.getElementById('file-selector').addEventListener('change', function(event) {
	this.parentElement.parentElement.style.display = 'none';
	var file = this.files[0];
	document.getElementById('pdf-container').style.display = 'block';
	createInstance(URL.createObjectURL(file));
});

let pdfjsannotateInst = null;

function createInstance(url) {
	pdfjsannotateInst = new PDFAnnotate('pdf-container', url);
}

function savePDF() {
    pdfjsannotateInst.savePdf('sample.pdf');
}

function enablePencil(e) {
	e.preventDefault();
	pdfjsannotateInst.enablePencil();
}