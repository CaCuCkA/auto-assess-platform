document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("create-card-window-modal");
    const closeModalBtn = document.querySelector(".close");
    const addHomeworkBtn = document.getElementById("add-participant-card");
    const submitBtn = document.getElementById("submit-btn-participant-modal");
    const deleteModal = document.getElementById("delete-confirmation-modal");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

    let currentParticipantId = null;

    const informationModal = {
        modal: document.getElementById("informational-modal"),
        title: document.getElementById("informational-modal-title"),
        content: document.getElementById("informational-modal-text-content")
    };

    const participantInputs = {
        fullName: document.getElementById("participant-card-name"),
        repoUrl: document.getElementById("participant-card-repo-url"),
        sshKey: document.getElementById("participant-card-ssh-key"),
        fileInput: document.getElementById("csv-file-upload"),
    };

    const errorMessages = {
        fullName: document.getElementById("name-error"),
        repoUrl: document.getElementById("url-error"),
        sshKey: document.getElementById("ssh-error"),
        fileInput: document.getElementById("file-error")
    };

    const clearMessages = () => {
        Object.values(errorMessages).forEach(msg => {
            msg.textContent = "";
            msg.style.display = "none";
        });
    };

    const displayNotification = (type, notTitle, message) => {
        const { modal, title, content } = informationModal;
        modal.className = "informational-modal " + type;
        title.textContent = notTitle;
        content.textContent = message;
        modal.style.display = "flex";
    };

    const clearInputs = () => {
        participantInputs.fullName.value = "";
        participantInputs.fullName.placeholder = "Full Name";
        participantInputs.repoUrl.value = "";
        participantInputs.repoUrl.placeholder = "Repository URL";
        participantInputs.sshKey.value = "";
        participantInputs.sshKey.placeholder = "SSH Key";
        participantInputs.fileInput.value = "";
        participantInputs.fileInput.style.display = "block";
    };

    const showError = (field, message, color = "#FFAA1D") => {
        const errorElement = errorMessages[field];
        errorElement.textContent = message;
        errorElement.style.display = "block";
        errorElement.style.color = color;
    };

    const hash = window.location.hash;
    if (hash && hash.startsWith("#notification=")) {
        const notificationData = JSON.parse(decodeURIComponent(hash.replace("#notification=", "")));
        const { type, title, message } = notificationData;

        displayNotification(type, title, message);
        window.location.hash = "";
    }

    const isValidUrl = url => /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(url);

    const isValidSshKey = sshKey => {
        const match = sshKey.match(/^(ssh-(rsa|dss|ecdsa|ed25519)) ([A-Za-z0-9+/=]+)( .*)?$/);
        return match && atob(match[3]).length > 0;
    };

    const handleFormSubmission = async (url, method, data, isEdit) => {
        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                closeModal();
                if (isEdit) {
                    window.location.hash = `#notification=${encodeURIComponent(JSON.stringify({
                        type: "success",
                        title: "Participant Updated",
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
            return showError("repoUrl", `These values already exist in the database: ${duplicates.join(", ")}`, "#880808");
        }
    
        handleFormSubmission("/homework/add-participant", "POST", {
            participants: [{ fullName: trimmedFullName, repoUrl: trimmedRepoUrl, sshKey: trimmedSshKey }]
        }, isEdit);
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
            fullName: fullName.value,
            repoUrl: repoUrl.value,
            sshKey: sshKey.value
        };
        
        handleFormSubmission(`/homework/edit-participant/${currentParticipantId}`, "POST", data, isEdit);
    };

    const handleDeleteClick = async (event) => {
        event.preventDefault();
        const cardContainer = event.target.closest(".participant-card-container");
        currentParticipantId = cardContainer.getAttribute("data-id");
        const dropdownMenu = cardContainer.querySelector(".dropdown-menu");

        deleteModal.style.display = "flex";
        dropdownMenu.style.display = "none";

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

            deleteModal.style.display = "none";
        });

        cancelDeleteBtn.addEventListener("click", () => deleteModal.style.display = "none");
    };

    const handleEditClick = (event) => {
        event.preventDefault();
        const cardContainer = event.target.closest(".participant-card-container");
        const dropdownMenu = cardContainer.querySelector(".dropdown-menu");
        currentParticipantId = cardContainer.getAttribute("data-id");
        dropdownMenu.style.display = "none";

        fetch(`/homework/participants/${currentParticipantId}`)
            .then(response => response.json())
            .then(data => {
                const { full_name, repo_url, ssh_key } = data;
                
                openModal();

                submitBtn.textContent = "Edit";
                participantInputs.fileInput.style.display = "none";
                participantInputs.fullName.placeholder = full_name;
                participantInputs.repoUrl.placeholder = repo_url;
                participantInputs.sshKey.placeholder = ssh_key;
            })
            .catch(error => {
                console.error("Error fetching participant data:", error);
                displayNotification("error", "Issue!", "Failed to load participant data");
            });
    };

    const openModal = () => {
        clearInputs();
        clearMessages();
        modal.style.display = "flex";
    };

    const closeModal = () => {
        modal.style.display = "none";
        submitBtn.textContent = "Create";
        currentParticipantId = null;
    };

    addHomeworkBtn.addEventListener("click", openModal);
    closeModalBtn.addEventListener("click", closeModal);
    submitBtn.addEventListener("click", () => {
        if (submitBtn.textContent === "Create") {
            addNewParticipant();
        } else {
            editParticipant();
        }
    });

    document.querySelectorAll(".delete-option").forEach(deleteOption => {
        deleteOption.addEventListener("click", handleDeleteClick);
    });

    document.querySelectorAll(".edit-option").forEach(editOption => {
        editOption.addEventListener("click", handleEditClick);
    });

    document.querySelectorAll(".participant-card-edit-icon").forEach(editIcon => {
        editIcon.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            
            const cardContainer = event.currentTarget.closest(".participant-card-container");
            const dropdownMenu = cardContainer.querySelector(".dropdown-menu");
    
            dropdownMenu.style.display = "block";
    
            const closeMenu = (e) => {
                if (!dropdownMenu.contains(e.target) && !cardContainer.contains(e.target)) {
                    dropdownMenu.style.display = "none";
                    document.removeEventListener("click", closeMenu);
                }
            };
    
            document.addEventListener("click", closeMenu, { once: true });
        });
    });
    
    document.querySelector(".close-informational-modal").addEventListener("click", function () {
        informationModal.modal.style.display = "none";
    });

    document.getElementById("close-informational-modal-btn").addEventListener("click", function () {
        informationModal.modal.style.display = "none";
    });
});
