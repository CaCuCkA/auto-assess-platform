document.addEventListener("DOMContentLoaded", () => {
    const MAX_TITLE_LENGTH = 255;

    const reportNameInput = document.getElementById("report-name");
    const notificationMessage = document.getElementById("report-notification-message");
    
    const optionModal = document.getElementById("report-option-modal");
    
    const addReportButton = document.querySelector(".add-report-button");
    const createCardWindowModal = document.getElementById("create-report-card-modal");
    const submitBtn = document.getElementById("submit-btn-report-modal");
    const closeCreateModal = createCardWindowModal.querySelector(".close");
    
    const editOption = document.getElementById("report-edit-option");
    
    
    const deleteOption = document.getElementById("report-delete-option");
    const deleteConfirmationModal = document.getElementById("report-delete-confirmation-modal");
    const closeDeleteModal = deleteConfirmationModal.querySelector(".close");
    const confirmDeleteBtn = document.getElementById("report-confirm-delete-btn");
    const cancelDeleteBtn = document.getElementById("report-cancel-delete-btn");
    
    const reports = document.getElementById("reports");
    
    
    let currentReportId = null;
    
    const clearMessages = () => {
        reportNameInput.value = "";
        notificationMessage.textContent = "";
    };
    
    const closeModal = (modal) => {
        clearMessages();
        modal.style.display = "none";
    };
    
    const displayNotification = (type, notTitle, message) => {
        const { modal, title, content } = informationModal;
        modal.className = "informational-modal " + type;
        title.textContent = notTitle;
        content.textContent = message;
        modal.style.display = "flex";
    };
    
    const displayNotificationMessage = (message, type="error") => {
        notificationMessage.style.color = type === "error" ? "#FF6347" : "#FFAA1D";
        notificationMessage.textContent = message;
    };
    
    const isReportTitleTaken = async (reportTitle) => {
        const response = await fetch(`/report/check-title/${reportTitle}`);
        const { exists } = await response.json();
        return exists;
    };
    
    reports.addEventListener('click', (event) => {
        if (event.target.classList.contains('report-edit-icon')) {
            event.preventDefault();
            event.stopPropagation();
            const cardContainer = event.target.closest(".report-card-container");
            currentReportId = cardContainer.getAttribute("report-id");
            optionModal.style.display = "flex";
        }
    });
    
    document.getElementById("report-option-modal-close").addEventListener("click", () => {
        closeModal(optionModal);
    });
    
    
    // create/edit modal
    
    addReportButton.addEventListener("click", () => {
        clearMessages();
        currentReportId = null;
        submitBtn.textContent = "Create";
        createCardWindowModal.style.display = "flex";
    });
    
    
    editOption.addEventListener("click", () => {
        closeModal(optionModal);
        submitBtn.textContent = "Edit";
        createCardWindowModal.style.display = "flex";
    });
    
    
    closeCreateModal.addEventListener("click", () => {
        closeModal(createCardWindowModal);
    });
    
    // handle send
    
    submitBtn.addEventListener("click", async () => {
        const reportTitle = reportNameInput.value;
        clearMessages();
    
        if (!reportTitle) {
            displayNotificationMessage("Please enter report name", "warning");
            return;
        }
    
        if (await isReportTitleTaken(reportTitle)) {
            displayNotificationMessage("Report with this title already exists!");
            return;
        }
    
    
        if (reportTitle.length > MAX_TITLE_LENGTH) {
            displayNotificationMessage(`The report name is too long. Please keep it under ${MAX_TITLE_LENGTH} characters.`);
            return;
        }  
    
        const url = currentReportId ? `/report/edit/${currentReportId}` : "/report/add"; 
        const method = currentReportId ? "PUT" : "POST";
    
        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: reportTitle })
            });

            closeModal(createCardWindowModal);
    
            if (currentReportId) {
                const reportElement = document.querySelector(`[report-id="${currentReportId}"]`);
                if (reportElement) {
                    reportElement.querySelector(".report-title").textContent = reportTitle;
                }
            } else {
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                reports.prepend(doc.body.firstChild);
                updateReports()
            }
    
        } catch (error) {
            console.error("❌ Fetch error:", error);
            displayNotificationMessage("Oops, something went wrong. Try again!");
        }
    });
    
    
    deleteOption.addEventListener("click", () => {
        closeModal(optionModal);
        deleteConfirmationModal.style.display = "flex";
    });
    
    closeDeleteModal.addEventListener("click", () => {
        closeModal(deleteConfirmationModal);
    });
    
    confirmDeleteBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        closeModal(deleteConfirmationModal);
    
            try {
                const response = await fetch(`/report/delete/${currentReportId}`, {
                    method: "DELETE",
                });
                const data = await response.json();
    
                if (data.success) {
                    console.log("[handleDeleteClick] Report was deleted successfully.");
                    const reportElement = document.querySelector(`[report-id="${currentReportId}"]`);
                    if (reportElement) {
                        reportElement.remove();
                    }        
                } else {
                    console.error("[handleDeleteClick] Error deleting report:", data.error);
                    displayNotification("error", "Error deleting report!", "There was an issue while attempting to delete the homework. Please try again later.");
                }
            } catch (error) {
                console.error("[handleDeleteClick] Error during fetch request:", error);
            }
    });
    
    cancelDeleteBtn.addEventListener("click", () => {
        closeModal(deleteConfirmationModal);
    });
    
    
    document.getElementById("close-informational-modal").addEventListener("click", function () {
        closeModal(informationModal);
    });
    
    document.getElementById("close-informational-modal-btn").addEventListener("click", function () {
        closeModal(informationModal);
    });
    
    
    function updateReports() {
        var count = document.getElementById("reports-count").value;
        var reports = document.querySelectorAll(".report-card-container");
    
        reports.forEach(function(report, index) {
            if (count === "all" || index < count) {
                report.style.display = "flex";
            } else {
                report.style.display = "none";
            }
        });
    };

    document.getElementById("reports-count").addEventListener("change", updateReports);
});
