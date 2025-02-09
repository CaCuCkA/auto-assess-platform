document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('create-card-window-modal');
    const errorMessage = document.getElementById('error-message');
    const warningMessage = document.getElementById('warning-message');
    const groupNameInput = document.getElementById('homework-card-name');
    const addHomeworkBtn = document.getElementById('add-homework-card');
    const closeModalBtn = document.querySelector('.close');
    const submitBtn = document.getElementById('submit-btn-homework-modal');
    const deleteModal = document.getElementById('delete-confirmation-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    
    let currentGroupId = null;

    const checkElementsExist = (elements) => elements.every(Boolean);

    if (!checkElementsExist([modal, addHomeworkBtn, closeModalBtn, submitBtn, deleteModal])) {
        console.error("❌ Missing elements! Check IDs.");
        return;
    }

    const clearMessages = () => {
        errorMessage.textContent = '';
        warningMessage.textContent = '';
    };

    const showModal = () => {
        clearMessages();
        modal.style.display = 'flex';
        groupNameInput.value = ''; 
    };

    const closeModal = () => {
        modal.style.display = 'none';
        submitBtn.textContent = "Create";
        currentGroupId = null;
    };

    const handleSubmit = async () => {
        const groupName = groupNameInput.value.trim();
        clearMessages();

        if (!groupName) {
            warningMessage.textContent = 'Please enter group name';
            return;
        }

        if (await isGroupNameTaken(groupName)) {
            errorMessage.textContent = 'Group with this name already exists!';
            return;
        }

        const url = currentGroupId ? `/edit-homework/${currentGroupId}` : '/add-homework'; 
        const method = currentGroupId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: groupName, link: `/homework/${groupName}` })
            });

            const { success, error } = await response.json();
            if (success) {
                clearMessages();
                closeModal();
                window.location.reload();
            } else {
                handleError(error);
            }
        } catch (error) {
            console.error('❌ Fetch error:', error);
            errorMessage.textContent = 'Oops, something went wrong. Try again!';
        }
    };

    const isGroupNameTaken = async (groupName) => {
        const response = await fetch(`/check-group-name/${groupName}`);
        const { exists } = await response.json();
        return exists;
    };

    const handleError = (error) => {
        if (error === 'exists') {
            errorMessage.textContent = 'Group with this name already exists!';
        } else {
            errorMessage.textContent = 'Oops, something went wrong. Try again!';
        }
    };

    addHomeworkBtn.addEventListener('click', showModal);
    closeModalBtn.addEventListener('click', closeModal);
    submitBtn.addEventListener('click', handleSubmit);

    const handleEditClick = (event) => {
        event.preventDefault();
        const cardContainer = event.target.closest('.homework-card-container');
        currentGroupId = cardContainer.getAttribute('data-id'); 
        const groupName = cardContainer.querySelector('.homework-card-title').textContent.trim();

        groupNameInput.value = groupName;
        submitBtn.textContent = "Rename";
        console.log("[handleEditClick] Editing group with ID:", currentGroupId, "and name:", groupName);
        showModal();
    };

    document.querySelectorAll('.edit-option').forEach(editOption => {
        editOption.addEventListener('click', handleEditClick);
    });

    const handleDeleteClick = (event) => {
        event.preventDefault();
        const cardContainer = event.target.closest('.homework-card-container');
        currentGroupId = cardContainer.getAttribute('data-id');
        console.log("[handleDeleteClick] Deleting group with ID:", currentGroupId);

        deleteModal.style.display = 'flex';

        confirmDeleteBtn.addEventListener('click', async () => {
            console.log("[handleDeleteClick] User confirmed delete");

            try {
                const response = await fetch(`/delete-homework/${currentGroupId}`, {
                    method: 'DELETE',
                });
                const data = await response.json();

                if (data.success) {
                    console.log("[handleDeleteClick] Group deleted successfully.");
                    window.location.reload();
                } else {
                    console.error('[handleDeleteClick] Error deleting group:', data.error);
                    alert('Error deleting group.');
                }
            } catch (error) {
                console.error("[handleDeleteClick] Error during fetch request:", error);
            }

            deleteModal.style.display = 'none';
        });

        cancelDeleteBtn.addEventListener('click', () => {
            console.log("[handleDeleteClick] User cancelled delete");
            deleteModal.style.display = 'none';
        });
    };

    document.querySelectorAll('.delete-option').forEach(deleteOption => {
        deleteOption.addEventListener('click', handleDeleteClick);
    });

    document.querySelectorAll('.homework-card-edit-icon').forEach(editIcon => {
        editIcon.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const cardContainer = event.target.closest('.homework-card-container');
            const dropdownMenu = cardContainer.querySelector('.dropdown-menu');
            dropdownMenu.style.display = 'block'; 

            const closeMenu = () => {
                dropdownMenu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            };

            document.addEventListener('click', closeMenu);
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });
});
