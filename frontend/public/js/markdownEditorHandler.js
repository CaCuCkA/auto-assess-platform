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

document.addEventListener("DOMContentLoaded", () => {
    const textArea = document.getElementById("editor");
    const reportId = document.querySelector('.editor-container').getAttribute('report-id');
    const homeworkId = document.querySelector('.editor-container').getAttribute('homework-id');

    const saveConfirmationModal = document.getElementById("report-save-confirmation-modal");
    const confirmSaveBtn = document.getElementById("report-confirm-save-btn");
    const closeSaveBtn = document.getElementById("report-close-save-modal");
    const cancelSaveBtn = document.getElementById("report-cancel-save-btn");

    const informationModal = {
        modal: document.getElementById("informational-modal"),
        title: document.getElementById("informational-modal-title"),
        content: document.getElementById("informational-modal-text-content")
    };

    const hashContent = (content) => {
        const hash = CryptoJS.SHA256(content);
        return hash.toString(CryptoJS.enc.Hex);
    };    

    let easyMDE;
    let lastHash;

    const displayNotification = (type, notTitle, message) => {
        const { modal, title, content } = informationModal;
        modal.className = "informational-modal " + type;
        title.textContent = notTitle;
        content.textContent = message;
        modal.style.display = "flex";
    };

    const initializeEditor = async () => {
        easyMDE = new EasyMDE({
            element: textArea,
            spellChecker: false,
            toolbar: TOOLBAR_OPTIONS,
            lineNumbers: true
        });

        easyMDE.codemirror.on("change", () => {
            updatePreview();
            textArea.value = easyMDE.value();
        });

        lastHash = await hashContent(textArea.value);
    };

    const updatePreview = () => {
        const previewElement = document.getElementById("preview");
        previewElement.innerHTML = marked.parse(easyMDE.value());
        Prism.highlightAll();
    };

    initializeEditor();
    updatePreview();

    document.getElementById("save-btn").addEventListener("click", async (event) => {
        event.preventDefault();

        const currentContent = textArea.value;
        const currentHash = hashContent(currentContent);

        if (currentHash === lastHash) {
            displayNotification("success", "Saved", "The report changes were saved!");
            return;
        }
        
        try {
            const response = await fetch(`/report/report-editor/save/${reportId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: currentContent })
            });

            const data = await response.json();
            
            if (data.success) {
                lastHash = currentHash;
                displayNotification("success", "Saved", "The report changes were saved!");
            } else {
                displayNotification("error", "Issue!", "Failed to save report changes!");
            }
        } catch (error) {
            displayNotification("error", "Issue!", "Failed to save report changes!");
        }

    });

    document.getElementById("submit-btn").addEventListener("click", async (event) =>{
        event.preventDefault();

        const currentContent = textArea.value;

        try {
            const response = await fetch(`/report/report-editor/submit/${reportId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: currentContent })
            });

            const data = await response.json();
            
            if (data.success) {
                let redirectUrl = "/";
    
                if (homeworkId !== null && homeworkId !== undefined && homeworkId.trim() !== "") {
                    redirectUrl = `/homework/${homeworkId}`;
                }
        
                window.location.href = redirectUrl;
                return;
            } else {
                displayNotification("error", "Issue!", "Failed to submit report!");
            }
        } catch (error) {
            displayNotification("error", "Issue!", "Failed to submit report!");
        }
    });

    document.getElementById("return-back-icon").addEventListener("click", async (event) => {
        event.preventDefault();
    
        const currentContent = textArea.value;
        const currentHash = await hashContent(currentContent);
        
        if (currentHash === lastHash) {
            let redirectUrl = "/";
    
            if (homeworkId !== null && homeworkId !== undefined && homeworkId.trim() !== "") {
                redirectUrl = `/homework/${homeworkId}`;
            }
    
            window.location.href = redirectUrl;
            return;
        }
    
        saveConfirmationModal.style.display = "flex";
    });

    confirmSaveBtn.addEventListener("click", async () => {
        try {
            const currentContent = textArea.value;

            const response = await fetch(`/report/report-editor/save/${reportId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: currentContent })
            });

            const data = await response.json();
            if (data.success) {
                let redirectUrl = "/";
    
                if (homeworkId !== null && homeworkId !== undefined && homeworkId.trim() !== "") {
                    redirectUrl = `/homework/${homeworkId}`;
                }
        
                window.location.href = redirectUrl;
                return;
            } else {
                displayNotification("error", "Issue!", `Failed to save report changes!`);
            }
        } catch (error) {
            displayNotification("error", "Issue!", "Failed to save report changes!");
        }
    });

    closeSaveBtn.addEventListener("click", () => {saveConfirmationModal.style.display = "none";});
    cancelSaveBtn.addEventListener("click", () => {
        saveConfirmationModal.style.display = "none";
        window.location.href = homeworkId !== null && homeworkId !== undefined && homeworkId.trim() !== "" ? `/homework/${homeworkId}` : "/"; 
    });

    document.querySelector(".close-informational-modal").addEventListener("click", function () {
        informationModal.modal.style.display = "none";
    });

    document.getElementById("close-informational-modal-btn").addEventListener("click", function () {
        informationModal.modal.style.display = "none";
    });
    
});