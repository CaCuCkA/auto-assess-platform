document.addEventListener("DOMContentLoaded", () => {
    const MAX_NAME_LENGTH = 255;


    const fileList = document.getElementById("test-file-list");
    const dropArea = document.getElementById("test-file-drop-area");
    const fileInput = document.getElementById("test-file-input");
    const modal = document.getElementById("test-file-modal");
    const modalContent = document.getElementById("test-file-modal-pre").querySelector(".test-file-modal-code");
    const closeBtn = document.querySelector(".test-file-modal-close");
    
    const testOptionModal = document.getElementById("test-option-modal");
    const closeTestOptionModal = document.getElementById("test-option-modal-close");
    const testEditOption = document.getElementById("test-edit-option");
    const testDeleteOption = document.getElementById("test-delete-option");
    
    
    const editTestCardModal = document.getElementById("edit-test-card-modal");
    const editInputField = document.getElementById("test-name");
    const closeEditOptionModal = editTestCardModal.querySelector(".close");
    const editNotificationMsg = document.getElementById("test-notification-message");
    const submitBtnEditModal = document.getElementById("submit-btn-test-modal");
    
    const testDelteConfirmationModal = document.getElementById("test-delete-confirmation-modal");
    const testConfirmDeleteBtn = document.getElementById("test-confirm-delete-btn");
    const testCancelDeleteBtn = document.getElementById("test-cancel-delete-btn");
    const testCloseDeleteModal = document.getElementById("test-close-delete-modal");
    
    const informationModal = {
        modal: document.getElementById("informational-modal"),
        title: document.getElementById("informational-modal-title"),
        content: document.getElementById("informational-modal-text-content")
    };
    
    
    let currentTestId = null;
    
    const displayNotification = (type, notTitle, message) => {
        const { modal, title, content } = informationModal;
        modal.className = "informational-modal " + type;
        title.textContent = notTitle;
        content.textContent = message;
        modal.style.display = "flex";
    };
    
    const clearMessages = () => {
        editInputField.value = "";
        editNotificationMsg.textContent = "";
    };
    
    const closeModal = (modal) => {
        clearMessages()
        modal.style.display = "none";
    };
    
    const displayNotificationMessage = (message, type="error") => {
        editNotificationMsg.style.color = type === "error" ? "#FF6347" : "#FFAA1D";
        editNotificationMsg.textContent = message;
    };
    
    const isTestNameTaken = async (testName) => {
        const response = await fetch(`/test/check-name/${testName}`);
        const { exists } = await response.json();
        return exists;
    };
    
    const addFile = async (file) => {
    
        const fileName = file.name;
    
        if (await isTestNameTaken(fileName)) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const response = await fetch("/test/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: fileName, fileContent: event.target.result })
                });
                
                const data = await response.json();
    
                if (data.success) {
                    const fileItem = document.createElement("div");
                    fileItem.classList.add("test-file-item");
                    fileItem.innerHTML = `<span class="test-file-icon"><i class="fas fa-file-code" test_id="${data.test_id}"></i></span>
                        <span class="test-file-name">${file.name}</span>
                        <span class="test-file-status excluded" test-file-status="excluded">Excluded</span>
                        <span class="test-file-preferences"><i class="fas fa-ellipsis-v"></i></span>`;
                        fileList.prepend(fileItem);
                } else {
                    displayNotification("error", "Failed to add test!", "There was an issue while attempting to add the test. Please try again later.")
                    console.error(`Failed to add test: ${file.name}`, response.status, response.statusText);
                }
            
            } catch (error) {
                console.error(`Error adding test: ${file.name}`, error);
            }
        };
    
        reader.readAsText(file);
    }
    
    const isPythonTestFile = (file) => {
        return file.name.endsWith(".py");
    };
    
    const handleFiles = async (files) => {
        for (const file of files) {
            if (isPythonTestFile(file)) {
                await addFile(file);
            }
        };
    };
    
    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("active");
    });
    
    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("active");
    });
    
    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("active");
        handleFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener("change", (e) => {
        handleFiles(e.target.files);
    });
    
    dropArea.addEventListener("click", () => {
        fileInput.click();
    });
    
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
    
    
    closeTestOptionModal.addEventListener("click", () => {
        closeModal(testOptionModal);
    });
    
    fileList.addEventListener("click", async (event) => {
        if (event.target.closest(".test-file-status")) {
            const statusElement = event.target.closest(".test-file-status");
            const isExcluded = statusElement.getAttribute("test-file-status") === "excluded";
            
            const cardContainer = event.target.closest(".test-file-item");
            if (!cardContainer) return;
    
            currentTestId = cardContainer.getAttribute("test-id");
            
            try {
                const response = await fetch(`/test/status/${currentTestId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" }
                });
    
                const data = await response.json();
    
                if (data.success) {
                    statusElement.setAttribute("test-file-status", isExcluded ? "included" : "excluded");
                    statusElement.textContent = isExcluded ? "Included" : "Excluded";
                    statusElement.classList.toggle("excluded", !isExcluded);
                    statusElement.classList.toggle("included", isExcluded);
                } else {
                    displayNotification("error", "Failed to update test status!", "There was an issue while attempting to update test status. Please try again later.");
                }
            } catch (error) {
                console.error("❌ Fetch error:", error);
                displayNotification("error", "Failed to update test status!", "There was an issue while attempting to update test status. Please try again later.");
            }
           
        } else if (event.target.closest(".test-file-preferences")) {
            event.preventDefault();
            event.stopPropagation();
    
            const cardContainer = event.target.closest(".test-file-item");
            if (!cardContainer) return;
    
            currentTestId = cardContainer.getAttribute("test-id");
    
            if (testOptionModal) {
                testOptionModal.style.display = "flex";
            }
        } else if (event.target.closest(".test-file-item")) {
            event.preventDefault();
            event.stopPropagation();
    
            const cardContainer = event.target.closest(".test-file-item");
            if (!cardContainer) return;
    
            currentTestId = cardContainer.getAttribute("test-id");
    
            const response = await fetch(`/test/${currentTestId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
    
            const data = await response.json();
    
            if (data.success) {
                modalContent.textContent = "\n" + (data?.test?.file_content ?? "")
                .replace(/[\u200B\uFEFF\u00A0]/g, "")
                .trimStart();
                Prism.highlightElement(modalContent);
                modal.style.display = "flex";
            } else {
                displayNotification("error", "Failed to open test!", "There was an issue while attempting to open test. Please try again later.");
            }
        }
    });
    
    testEditOption.addEventListener("click", () => {
        closeModal(testOptionModal);
        editTestCardModal.style.display = "flex";
    });
    
    closeEditOptionModal.addEventListener("click", () => {
        closeModal(editTestCardModal);
    });
    
    
    submitBtnEditModal.addEventListener("click", async () => {
        const testName = editInputField.value;
    
        if (!testName) {
            displayNotificationMessage("Please enter test name", "warning");
            return;
        }
    
        if (await isTestNameTaken(testName)) {
            displayNotificationMessage("Test with this name already exists!");
            return;
        }
    
        if (testName.length > MAX_NAME_LENGTH) {
            displayNotificationMessage(`The test name is too long. Please keep it under ${MAX_NAME_LENGTH} characters.`);
            return;
        }
    
        try {
            const response = await fetch(`/test/edit/${currentTestId}` , {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: testName })
            });
    
            closeModal(editTestCardModal);
            const data = await response.json();
            
            if (data.success) {
                const testElement = document.querySelector(`[test-id="${currentTestId}"]`);
                if (testElement) {
                    testElement.querySelector(".test-file-name").textContent = testName;
                }    
            } else {
                displayNotificationMessage("Oops, something went wrong. Try again!");
    
            }
        } catch (error) {
            console.error("❌ Fetch error:", error);
            displayNotificationMessage("Oops, something went wrong. Try again!");
        }
    });
    
    testDeleteOption.addEventListener("click", () => {
        closeModal(testOptionModal);
        testDelteConfirmationModal.style.display = "flex";
    });
    
    testCancelDeleteBtn.addEventListener("click", () => {
        closeModal(testDelteConfirmationModal);
    });
    
    testCloseDeleteModal.addEventListener("click", () => {
        closeModal(testDelteConfirmationModal);
    });
    
    testConfirmDeleteBtn.addEventListener("click", async (event) => {
        event.preventDefault();
            closeModal(testDelteConfirmationModal);
    
            try {
                const response = await fetch(`/test/delete/${currentTestId}`, {
                    method: "DELETE",
                });
                const data = await response.json();
    
                if (data.success) {
                    const testElement = document.querySelector(`[test-id="${currentTestId}"]`);
                    if (testElement) {
                        testElement.remove();
                    }
                } else {
                    console.error("[handleDeleteClick] Error deleting test:", data.error);
                    displayNotification("error", "Error deleting test!", "There was an issue while attempting to delete the test. Please try again later.");
                }
            } catch (error) {
                console.error("[handleDeleteClick] Error during fetch request:", error);
            }
    });
    
    
    
    document.getElementById("close-informational-modal").addEventListener("click", () => {
        closeModal(informationModal.modal);
    });
    
    document.getElementById("close-informational-modal-btn").addEventListener("click", function () {
        closeModal(informationModal.modal);
    });
    
});