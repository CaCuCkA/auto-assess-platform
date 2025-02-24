const TOOLBAR_OPTIONS = [
    { name: "bold", action: EasyMDE.toggleBold, className: "fa fa-bold", title: "Bold" },
    { name: "italic", action: EasyMDE.toggleItalic, className: "fa fa-italic", title: "Italic" },
    { name: "heading", action: EasyMDE.toggleHeadingSmaller, className: "fa fa-header", title: "Heading" },
    "|",
    { name: "quote", action: EasyMDE.toggleBlockquote, className: "fa fa-quote-left", title: "Quote" },
    { name: "unordered-list", action: EasyMDE.toggleUnorderedList, className: "fa fa-list-ul", title: "Unordered List" },
    { name: "ordered-list", action: EasyMDE.toggleOrderedList, className: "fa fa-list-ol", title: "Ordered List" },
    "|",
    { name: "link", action: EasyMDE.drawLink, className: "fa fa-link", title: "Insert Link" },
    { name: "image", action: EasyMDE.drawImage, className: "fa fa-image", title: "Insert Image" },
    "|",
    { name: "preview", action: EasyMDE.togglePreview, className: "fa fa-eye", title: "Toggle Preview" }
];

function initializeEditor() {
    const easyMDE = new EasyMDE({
        element: document.getElementById("editor"),
        spellChecker: false,
        toolbar: TOOLBAR_OPTIONS,
        lineNumbers: true
    });

    easyMDE.codemirror.on("change", () => updatePreview(easyMDE));

    return easyMDE;
}

function updatePreview(easyMDE) {
    const previewElement = document.getElementById("preview");
    previewElement.innerHTML = marked.parse(easyMDE.value());
    Prism.highlightAll();
}

function saveMarkdown() {
    const text = easyMDE.value();
    const blob = new Blob([text], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "document.md";
    a.click();
}

const easyMDE = initializeEditor();
updatePreview(easyMDE);
