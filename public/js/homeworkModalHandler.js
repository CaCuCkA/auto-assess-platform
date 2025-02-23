document.addEventListener("DOMContentLoaded", () => {
    const MAX_TITLE_LENGTH = 255;
    const modal = document.getElementById("create-card-window-modal");
    const errorMessage = document.getElementById("error-message");
    const warningMessage = document.getElementById("warning-message");
    const groupNameInput = document.getElementById("homework-card-name");
    const addHomeworkBtn = document.getElementById("add-homework-card");
    const closeModalBtn = document.querySelector(".close");
    const submitBtn = document.getElementById("submit-btn-homework-modal");
    const deleteModal = document.getElementById("delete-confirmation-modal");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    
    const informationModal = {
        modal: document.getElementById("informational-modal"),
        title: document.getElementById("informational-modal-title"),
        content: document.getElementById("informational-modal-text-content")
    };

    let currentGroupId = null;

    const checkElementsExist = (elements) => elements.every(Boolean);

    if (!checkElementsExist([modal, addHomeworkBtn, closeModalBtn, submitBtn, deleteModal])) {
        console.error("❌ Missing elements! Check IDs.");
        return;
    }

    const clearMessages = () => {
        errorMessage.textContent = "";
        warningMessage.textContent = "";
    };

    const showModal = () => {
        clearMessages();
        modal.style.display = "flex";
        groupNameInput.value = ""; 
    };

    const closeModal = () => {
        modal.style.display = "none";
        submitBtn.textContent = "Create";
        currentGroupId = null;
    };

    const displayNotification = (type, notTitle, message) => {
        const { modal, title, content } = informationModal;
        modal.className = "informational-modal " + type;
        title.textContent = notTitle;
        content.textContent = message;
        modal.style.display = "flex";
    };

    const isGroupNameTaken = async (groupName) => {
        const response = await fetch(`/check-homework-name/${groupName}`);
        const { exists } = await response.json();
        return exists;
    };

    const handleSubmit = async () => {
        const groupName = groupNameInput.value.trim();
        clearMessages();

        if (!groupName) {
            warningMessage.textContent = "Please enter group name";
            return;
        }

        if (await isGroupNameTaken(groupName)) {
            errorMessage.textContent = "Group with this name already exists!";
            return;
        }

        if (groupName.length > MAX_TITLE_LENGTH) {
            errorMessage.textContent = `The group name is too long. Please keep it under ${MAX_TITLE_LENGTH} characters.`;
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
            console.log(response);
            const { success, error } = await response.json();
            if (success) {
                clearMessages();
                closeModal();
                window.location.reload();
            } else {
                handleError(error);
            }
        } catch (error) {
            console.error("❌ Fetch error:", error);
            errorMessage.textContent = "Oops, something went wrong. Try again!";
        }
    };

    const handleError = (error) => {
        if (error === "exists") {
            errorMessage.textContent = "Group with this name already exists!";
        } else {
            errorMessage.textContent = "Oops, something went wrong. Try again!";
        }
    };

    addHomeworkBtn.addEventListener("click", showModal);
    closeModalBtn.addEventListener("click", closeModal);
    submitBtn.addEventListener("click", handleSubmit);

    const handleEditClick = (event) => {
        event.preventDefault();
        const cardContainer = event.target.closest(".homework-card-container");
        currentGroupId = cardContainer.getAttribute("data-id"); 
        const groupName = cardContainer.querySelector(".homework-card-title").textContent.trim();

        groupNameInput.value = groupName;
        submitBtn.textContent = "Rename";
        console.log("[handleEditClick] Editing group with ID:", currentGroupId, "and name:", groupName);
        showModal();
    };

    document.querySelectorAll(".edit-option").forEach(editOption => {
        editOption.addEventListener("click", handleEditClick);
    });

    const handleDeleteClick = (event) => {
        event.preventDefault();
        const cardContainer = event.target.closest(".homework-card-container");
        currentGroupId = cardContainer.getAttribute("data-id");
        console.log("[handleDeleteClick] Deleting group with ID:", currentGroupId);

        deleteModal.style.display = "flex";

        confirmDeleteBtn.addEventListener("click", async () => {
            console.log("[handleDeleteClick] User confirmed delete");

            try {
                const response = await fetch(`/delete-homework/${currentGroupId + 100}`, {
                    method: "DELETE",
                });
                const data = await response.json();

                if (data.success) {
                    console.log("[handleDeleteClick] Group deleted successfully.");
                    window.location.reload();
                } else {
                    console.error("[handleDeleteClick] Error deleting group:", data.error);
                    displayNotification("error", "Error deleting homework!", "There was an issue while attempting to delete the homework. Please try again later.");
                }
            } catch (error) {
                console.error("[handleDeleteClick] Error during fetch request:", error);
            }

            deleteModal.style.display = "none";
        });

        cancelDeleteBtn.addEventListener("click", () => {
            deleteModal.style.display = "none";
        });
    };

    document.querySelectorAll(".delete-option").forEach(deleteOption => {
        deleteOption.addEventListener("click", handleDeleteClick);
    });

    document.querySelectorAll(".homework-card-edit-icon").forEach(editIcon => {
        editIcon.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const cardContainer = event.target.closest(".homework-card-container");
            const dropdownMenu = cardContainer.querySelector(".dropdown-menu");
            dropdownMenu.style.display = "block"; 

            const closeMenu = () => {
                dropdownMenu.style.display = "none";
                document.removeEventListener("click", closeMenu);
            };

            document.addEventListener("click", closeMenu);
        });
    });

    window.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    document.querySelector(".close-informational-modal").addEventListener("click", function () {
        informationModal.modal.style.display = "none";
    });

    document.getElementById("close-informational-modal-btn").addEventListener("click", function () {
        informationModal.modal.style.display = "none";
    });
});