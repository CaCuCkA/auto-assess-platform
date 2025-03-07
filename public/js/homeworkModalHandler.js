document.addEventListener("DOMContentLoaded", () => {
    const MAX_TITLE_LENGTH = 255;

    const optionModal = document.getElementById("option-modal");
    const closeOptionModal = document.getElementById("option-modal-close");
    
    const editOption = document.getElementById("edit-option");
    const groupNameInput = document.getElementById("homework-name");
    const addHomeworkBtn = document.getElementById("add-homework-card");
    const createCardWindowModal = document.getElementById("create-card-modal");
    const closeCreateModal = createCardWindowModal.querySelector(".close");
    const submitBtn = document.getElementById("submit-btn-homework-modal");
    
    const notificationMessage = document.getElementById("notification-homework-message");

    const deleteOption = document.getElementById("delete-option");
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    const deleteConfirmationModal = document.getElementById("delete-confirmation-modal");
    const closeDeleteModal = deleteConfirmationModal.querySelector(".close");

    
    const informationModal = {
        modal: document.getElementById("informational-modal"),
        title: document.getElementById("informational-modal-title"),
        content: document.getElementById("informational-modal-text-content")
    };

    let currentGroupId = null;

    const clearMessages = () => {
        groupNameInput.value = "";
        notificationMessage.value = "";
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

    const isGroupNameTaken = async (groupName) => {
        const response = await fetch(`/check-homework-name/${groupName}`);
        const { exists } = await response.json();
        return exists;
    };

    // option modal menu

    document.querySelectorAll(".homework-card-edit-icon").forEach(editIcon => {
        editIcon.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const cardContainer = event.target.closest(".homework-card-container");
            currentGroupId = cardContainer.getAttribute("data-id");
            optionModal.style.display = "flex";
        });
    });  
    
    closeOptionModal.addEventListener("click", () => {closeModal(optionModal)});


    // add/edit homework and their submit button 

    addHomeworkBtn.addEventListener("click", () => {
        clearMessages();
        currentGroupId = null;
        submitBtn.textContent = "Create";
        createCardWindowModal.style.display = "flex";
    });  

    editOption.addEventListener("click", () => {
        closeModal(optionModal);
        submitBtn.textContent = "Edit";
        createCardWindowModal.style.display = "flex";
    });

    closeCreateModal.addEventListener("click", () => {closeModal(createCardWindowModal)});

    submitBtn.addEventListener("click", async () => {
        const groupName = groupNameInput.value;
        clearMessages();

        if (!groupName) {
            displayNotificationMessage("Please enter group name", "warning");
            return;
        }

        if (await isGroupNameTaken(groupName)) {
            displayNotificationMessage("Group with this name already exists!");
            return;
        }


        if (groupName.length > MAX_TITLE_LENGTH) {
            displayNotificationMessage(`The group name is too long. Please keep it under ${MAX_TITLE_LENGTH} characters.`);
            return;
        }  

        const url = currentGroupId ? `/edit-homework/${currentGroupId}` : "/add-homework"; 
        const method = currentGroupId ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: groupName })
            });
            await response.json();
            closeModal(createCardWindowModal);
            window.location.reload();
        } catch (error) {
            console.error("❌ Fetch error:", error);
            displayNotificationMessage("Oops, something went wrong. Try again!");
        }
    });
    

    // delete modal 

    deleteOption.addEventListener("click", () => {
        closeModal(optionModal);
        deleteConfirmationModal.style.display = "flex";
    });
    
    closeDeleteModal.addEventListener("click", () => {closeModal(deleteConfirmationModal)});

    cancelDeleteBtn.addEventListener("click", () => {closeModal(deleteConfirmationModal)});

    confirmDeleteBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        closeModal(deleteConfirmationModal);

        try {
            const response = await fetch(`/delete-homework/${currentGroupId}`, {
                method: "DELETE",
            });
            const data = await response.json();

            if (data.success) {
                console.log("[handleDeleteClick] Group was deleted successfully.");
                window.location.reload();
            } else {
                console.error("[handleDeleteClick] Error deleting group:", data.error);
                displayNotification("error", "Error deleting homework!", "There was an issue while attempting to delete the homework. Please try again later.");
            }
        } catch (error) {
            console.error("[handleDeleteClick] Error during fetch request:", error);
        }
    });

    
    document.getElementById("close-informational-modal").addEventListener("click", function () {
        closeModal(informationModal);
    });

    document.getElementById("close-informational-modal-btn").addEventListener("click", function () {
        closeModal(informationModal);
    });
});