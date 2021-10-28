# FabricJS layer on top of Mozilla's PDFJS to add ANNOTATIONS

![Alt text](./Screenshot.png?raw=true "Screenshot")

# Features

- Supports PDFs with multiple pages

- Free draw tool

- Add text

- Add arrows

- Add rectangles

- Add image

- Change colors

- Change Brush size

- Change Font size

- Every object can be resize

- Serialize all canvas data into JSON and re-draw

- Delete individual object

- Clear page

- Export PDF with annotations (using jsPDF)

**Important: exported file will be a PDF with set of images. So you won't be able to use functions like text selections. trying my best to add the text layer. Due to lack of PDFJs documentation about this section progress is very slow. If anyone interested you can check the progress on `dev` branch.**

# Usage 

```javascript
var pdf = new PDFAnnotate('pdf-container-id', 'http://url-to.pdf');

pdf.enableSelector(); // Enable moviing tool

pdf.enablePencil(); // Enable pencil tool

pdf.enableAddText(); // Enable add text tool

pdf.enableAddArrow(); // Enable add arrow tool(Supports optional on draw success callback)

pdf.enableRectangle(); // Adds a rectangle

pdf.addImageToCanvas() // Add an image

pdf.deleteSelectedObject(); // Delete selected object

pdf.clearActivePage(); // Clear current page

pdf.savePdf(); // Save PDF with name sample.pdf

pdf.serializePdf(function (serializedString) {
    //
}); // returns JSON string with canvas data

pdf.loadFromJSON(serializedJSON) // continue edit with saved JSON. To do this on page load use `ready` option(scripts.js line 5)

pdf.setColor(color); // Set color for tools (Example: pdf.setColor(red) , pdf.setColor('#fff'), pdf.setColor('rgba(255,0,0,0.5)'))

pdf.setBorderColor(color); // Set border color for rectangle tool (Example: pdf.setBorderColor(red) , pdf.setBorderColor('#fff'))

pdf.setBrushSize(width); // Set brush size for pencil tool (Example: pdf.setBrushSize(5))

pdf.setFontSize(font_size); // Set font size for text tool (Example: pdf.setFontSize(18))

pdf.setBorderSize(border_size); // Set border size of rectangles (Example: pdf.setBorderSize(2))
```
