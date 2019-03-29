# FabricJS layer on top of Mozilla's PDFJS to add ANNOTATIONS

![Alt text](./Screenshot.png?raw=true "Screenshot")

# Features

- Supports PDFs with multiple pages

- Free draw tool

- Add text

- Add arrows

- Change colors

- Change Brush size

- Change Font size

- Every object can be resize

- Serialize all canvas data into JSON and re-draw

- Delete individual object

- Clear page

- Export PDF with annotations (using jsPDF)

**Important: exported file will be a PDF with set of images. So you won't be able to use functions like text selections.**

# Usage 

```javascript
var pdf = new PDFAnnotate('pdf-container-id', 'http://url-to.pdf');

pdf.enableSelector(); // Enable moviing tool

pdf.enablePencil(); // Enable pencil tool

pdf.enableAddText(); // Enable add text tool

pdf.enableAddArrow(); // Enable add arrow tool

pdf.deleteSelectedObject(); // Delete selected object

pdf.clearActivePage(); // Clear current page

pdf.savePdf(); // Save PDF with name sample.pdf

pdf.serializePdf(); // returns JSON string with canvas data

pdf.setColor(color); // Set color for tools (Example: pdf.setColor(red) , pdf.setColor('#fff'))

pdf.setBrushSize(width); // Set brush size for pencil tool (Example: pdf.setBrushSize(5))

pdf.setFontSize(font_size); // Set font size for text tool (Example: pdf.setFontSize(18))
```
