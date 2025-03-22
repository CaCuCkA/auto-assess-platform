document.addEventListener("DOMContentLoaded", () => {

    // optional modal elements
    const optionModal = document.getElementById("participant-option-modal");
    const closeOptionModal = document.getElementById("participant-option-modal-close");
    
    // edit elements
    const editOption = document.getElementById("participant-edit-option");
    const submitBtn = document.getElementById("submit-btn-participant-modal");
    const createCardWindowModal = document.getElementById("create-participant-card-modal");
    const closeCreateModal = createCardWindowModal.querySelector(".close");
    const addParticipantBtn = document.getElementById("add-participant-card");

    // file elements
    const fileUploadContainer = document.querySelector('.file-upload-container');
    const placeholderText = document.querySelector('.placeholder-text');

    // delete elements
    const deleteOption = document.getElementById("participant-delete-option");
    const closeDeleteBtn = document.getElementById("participant-close-delete-modal");
    const cancelDeleteBtn = document.getElementById("participant-cancel-delete-btn");
    const confirmDeleteBtn = document.getElementById("participant-confirm-delete-btn");
    const deleteModal = document.getElementById("participant-delete-confirmation-modal");

    const reportsModal = document.getElementById("reports-modal");
    const reports = document.getElementById("reports");
    const closeReportModal = document.getElementById("close-reports-modal");

    const participantInputs = {
        fullName: document.getElementById("participant-card-name"),
        repoUrl: document.getElementById("participant-card-repo-url"),
        sshKey: document.getElementById("participant-card-ssh-key"),
        fileInput: document.getElementById("csv-file-upload"),
        fileContainer: document.getElementById("file-upload-container"),
    };

    const errorMessages = {
        fullName: document.getElementById("name-notification-message"),
        repoUrl: document.getElementById("url-notification-message"),
        sshKey: document.getElementById("ssh-notification-message"),
        fileInput: document.getElementById("file-notification-message")
    };

    const informationModal = {
        modal: document.getElementById("informational-modal"),
        title: document.getElementById("informational-modal-title"),
        content: document.getElementById("informational-modal-text-content")
    };


    let currentParticipantId = null;

    const showError = (field, message, color = "#FFAA1D") => {
        const errorElement = errorMessages[field];
        console.log(errorElement, field);
        errorElement.textContent = message;
        errorElement.style.color = color;
    };

    const displayNotification = (type, notTitle, message) => {
        const { modal, title, content } = informationModal;
        modal.className = "informational-modal " + type;
        title.textContent = notTitle;
        content.textContent = message;
        modal.style.display = "flex";
    }; 

    const clearMessages = () => {
        Object.values(errorMessages).forEach(msg => {
            msg.textContent = "";
        });
    };

    const clearInputs = () => {
        participantInputs.fullName.value = "";
        participantInputs.fullName.placeholder = "Full Name";
        participantInputs.repoUrl.value = "";
        participantInputs.repoUrl.placeholder = "Repository URL";
        participantInputs.sshKey.value = "";
        participantInputs.sshKey.placeholder = "SSH Key";
        participantInputs.fileInput.value = "";
        placeholderText.textContent = "Drag & Drop your CSV file here or click to browse";
        fileUploadContainer.style.borderStyle = "dashed";
        participantInputs.fileContainer.style.display = "none";
    };


    const closeModal = (modal) => {
        clearMessages();
        clearInputs()
        modal.style.display = "none";
    };

    const isValidUrl = url => /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(url);

    const isValidSshKey = sshKey => {
        const match = sshKey.match(/^(ssh-(rsa|dss|ecdsa|ed25519)) ([A-Za-z0-9+/=]+)( .*)?$/);
        return match && atob(match[3]).length > 0;
    };

    // notifcation modal 

    const hash = window.location.hash;
    if (hash && hash.startsWith("#notification=")) {
        const notificationData = JSON.parse(decodeURIComponent(hash.replace("#notification=", "")));
        const { type, title, message } = notificationData;

        displayNotification(type, title, message);
        window.location.hash = "";
    }
    
    document.querySelector(".close-informational-modal").addEventListener("click", function () {
        closeModal(informationModal.modal);
    });

    document.getElementById("close-informational-modal-btn").addEventListener("click", function () {
        closeModal(informationModal.modal);
    });

    // option modal

    document.querySelectorAll(".participant-card-option-icon").forEach(editIcon => {
        editIcon.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const cardContainer = event.target.closest(".participant-card-container");
            currentParticipantId = cardContainer.getAttribute("participant-id");
            optionModal.style.display = "flex";
        });
    });

    closeOptionModal.addEventListener("click", () => {optionModal.style.display = "none";});

    // edit/add modal

    editOption.addEventListener("click", (event) => {
        event.preventDefault();
        
        closeModal(optionModal);

        fetch(`/homework/participants/${currentParticipantId}`)
            .then(response => response.json())
            .then(data => {
                const { full_name, repo_url, ssh_key } = data;

                submitBtn.textContent = "Edit";
                participantInputs.fullName.placeholder = full_name;
                participantInputs.repoUrl.placeholder = repo_url;
                participantInputs.sshKey.placeholder = ssh_key;

                createCardWindowModal.style.display = "flex";
            })
            .catch(error => {
                console.error("Error fetching participant data:", error);
                displayNotification("error", "Issue!", "Failed to load participant data");
            })
    });

    closeCreateModal.addEventListener("click", () => {closeModal(createCardWindowModal)});

    addParticipantBtn.addEventListener("click", () => {
        submitBtn.textContent = "Create";  
        currentParticipantId = null;
        createCardWindowModal.style.display = "flex";
        participantInputs.fileContainer.style.display = "flex"; 
    });

    // handle send button

    const handleFormSubmission = async (url, method, data, isEdit) => {
        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                closeModal(createCardWindowModal);
                if (isEdit) {
                    window.location.hash = `#notification=${encodeURIComponent(JSON.stringify({
                        type: "success",
                        title: "Participant updated",
                        message: `The following fields have been successfully updated: ${result.fields.join(", ")}`
                    }))}`;
                }
                window.location.reload();
            } else {
                showError("fullName", result.error || "An unknown error occurred.");
            }
        } catch (error) {
            console.error("❌ Fetch error:", error);
            showError("fullName", "Oops, something went wrong. Try again!");
        }
    };

    const editParticipant = async () => {
        clearMessages();
        const isEdit = true;
        const { fullName, repoUrl, sshKey } = participantInputs;

        if (!fullName.value && !repoUrl.value && !sshKey.value) return showError("sshKey", "You should change at least one field");
        
        if (repoUrl.value && !isValidUrl(repoUrl.value)) return showError("repoUrl", "Invalid URL format.");
        if (sshKey.value && !isValidSshKey(sshKey.value)) return showError("sshKey", "Invalid SSH Key format.");

        const response = await fetch("/homework/check-duplicates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repoUrls: [repoUrl.value], sshKeys: [sshKey.value] })
        });

        const { duplicates } = await response.json();
        if (duplicates.length > 0) {
            return showError("fileInput", `These values already exist in the database: ${duplicates.join(", ")}`, "#880808");
        }

        const data = {
            fullName: fullName.value.trim(),
            repoUrl: repoUrl.value.trim(),
            sshKey: sshKey.value.trim()
        };
        
        handleFormSubmission(`/homework/edit-participant/${currentParticipantId}`, "POST", data, isEdit);
    };


    const addNewParticipant = async () => {
        clearMessages();
    
        const { fullName, repoUrl, sshKey, fileInput } = participantInputs;
        const trimmedFullName = fullName.value.trim();
        const trimmedRepoUrl = repoUrl.value.trim();
        const trimmedSshKey = sshKey.value.trim();
        const isEdit = false;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
    
            reader.onload = async (event) => {
                try {
                    const csvData = event.target.result.trim();
                    const lines = csvData.split("\n");
                    const [header, ...rows] = lines.map(line => line.split(",").map(cell => cell.trim()));
    
                    if (header.length < 3 || header[0] !== "fullName" || header[1] !== "repoUrl" || header[2] !== "sshKey") {
                        return showError("fileInput", "Invalid CSV format. Required columns: fullName, repoUrl, sshKey.");
                    }
    
                    const participants = [];
                    const repoUrlsSet = new Set();
                    const sshKeysSet = new Set();
    
                    for (const row of rows) {
                        const [name, repo, key] = row;

                        if (!name || !repo || !key) return showError("fileInput", "Full Name, Repo URL or SSH Key cannot be empty.");
                    
                        if (!isValidSshKey(key)) return showError("fileInput", `Invalid SSH Key: ${key}`);
                        if (!isValidUrl(repo)) return showError("fileInput", `Invalid Repo URL: ${repo}`);
              
                        if (repoUrlsSet.has(repo)) return showError("fileInput", `Duplicate repo URL in CSV: ${repo}`, "#880808");
                        if (sshKeysSet.has(key)) return showError("fileInput", `Duplicate SSH Key in CSV: ${key}`, "#880808");
    
                        repoUrlsSet.add(repo);
                        sshKeysSet.add(key);
    
                        participants.push({ fullName: name, repoUrl: repo, sshKey: key });
                    }
    
                    const response = await fetch("/homework/check-duplicates", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ repoUrls: [...repoUrlsSet], sshKeys: [...sshKeysSet] })
                    });
    
                    const { duplicates } = await response.json();
                    if (duplicates.length > 0) {
                        return showError("fileInput", `These values already exist in the database: ${duplicates.join(", ")}`, "#880808");
                    }
    
                    handleFormSubmission("/homework/add-participant", "POST", { participants }, isEdit);
                } catch (error) {
                    showError("fileInput", "Error processing the CSV file.", "#880808");
                }
            };
    
            reader.readAsText(file);
            return;
        }
    
        const errors = {
            fullName: !trimmedFullName && "Full Name is required.",
            repoUrl: !trimmedRepoUrl ? "Repository URL is required." : !isValidUrl(trimmedRepoUrl) && "Invalid URL format.",
            sshKey: !trimmedSshKey ? "SSH Key is required." : !isValidSshKey(trimmedSshKey) && "Invalid SSH Key format."
        };
    
        for (const [key, message] of Object.entries(errors)) {
            if (message) return showError(key, message);
        }
    
        const response = await fetch("/homework/check-duplicates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repoUrls: [trimmedRepoUrl], sshKeys: [trimmedSshKey] })
        });
    
        const { duplicates } = await response.json();

        if (duplicates.length > 0) {
            return showError("fileInput", `These values already exist in the database: ${duplicates.join(", ")}`, "#880808");
        }
    
        handleFormSubmission("/homework/add-participant", "POST", {
            participants: [{ fullName: trimmedFullName, repoUrl: trimmedRepoUrl, sshKey: trimmedSshKey }]
        }, isEdit);
    };

    submitBtn.addEventListener("click", () => {
        if (submitBtn.textContent === "Create") {
            addNewParticipant();
        } else {
            editParticipant();
        }
    });


    // Delete modal
    const handleDeleteClick = async (event) => {
        event.preventDefault();

        deleteModal.style.display = "flex";
        closeModal(optionModal);
    };

    deleteOption.addEventListener("click", handleDeleteClick);
    confirmDeleteBtn.addEventListener("click", async () => {
        try {
            const response = await fetch(`/homework/delete-participant/${currentParticipantId}`, { method: "DELETE" });
            const { success, error } = await response.json();

            if (success) {
                console.log("[handleDeleteClick] Participant deleted.");
                window.location.reload();
            } else {
                console.error("[handleDeleteClick] Error deleting participant:", error);
                displayNotification("error", "Error deleting participant!", "There was an issue while attempting to delete the participant. Please try again later.");
            }
        } catch (error) {
            console.error("[handleDeleteClick] Error during fetch request:", error);
            displayNotification("error", "Error deleting participant!", "There was an issue while attempting to delete the participant. Please try again later.");
        }

        closeModal(deleteModal);
    });
    
    closeDeleteBtn.addEventListener("click", () => {closeModal(deleteModal);});
    cancelDeleteBtn.addEventListener("click", () => {closeModal(deleteModal);});


    // file handling
    fileUploadContainer.addEventListener('click', () => {
        participantInputs.fileInput.click();
    });

    fileUploadContainer.addEventListener('dragover', (event) => {
        event.preventDefault();
        fileUploadContainer.classList.add('active');
    });

    fileUploadContainer.addEventListener('dragleave', () => {
        fileUploadContainer.classList.remove('active');
    });

    fileUploadContainer.addEventListener('drop', (event) => {
        event.preventDefault();
        fileUploadContainer.classList.remove('active');
        participantInputs.fileInput.files = event.dataTransfer.files;
        updatePlaceholder();
    });

    participantInputs.fileInput.addEventListener('change', updatePlaceholder);

    function updatePlaceholder() {
        if (participantInputs.fileInput.files && participantInputs.fileInput.files.length > 0) {
            const fileName = participantInputs.fileInput.files[0].name;
            placeholderText.textContent = `File selected: ${fileName}`;
            fileUploadContainer.style.borderStyle = "solid"; 
        } else {
            placeholderText.textContent = "Drag & Drop your CSV file here or click to browse";
            fileUploadContainer.style.borderStyle = "dashed";
        }
    }


    document.querySelectorAll(".participant-card-button").forEach(reportButton => {
        reportButton.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
    
            const cardContainer = event.target.closest(".participant-card-container");

            const participantId = cardContainer.getAttribute("participant-id");    
            try {
                const response = await fetch(`/homework/participant-report/${participantId}`);
                const html = await response.text();
                
                reports.innerHTML = html;
                updateReports();
                reportsModal.style.display = "flex";
            } catch (error) {
                console.error("❌ Error fetching reports:", error);
            }
        });
    });

    closeReportModal.addEventListener("click", () => {
        closeModal(reportsModal);
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
});
