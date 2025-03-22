document.addEventListener("DOMContentLoaded", function () {
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirm-password");
    const passwordError = document.getElementById("password-warning-message");
    const confirmPasswordError = document.getElementById("password-error-message");
    const form = document.getElementById("sending-form");
    const submitButton = document.getElementById("submit-btn");

    function isValidPassword(password) {
        return /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password);
    }

    function validatePassword() {
        if (!isValidPassword(password.value)) {
            passwordError.textContent = "Password must be at least 8 characters long and contain both letters and digits.";
            submitButton.disabled = true;
        } else {
            passwordError.textContent = "";
            submitButton.disabled = false;
        }
    }

    function validateForm(event) {
        let valid = true;

        if (!isValidPassword(password.value)) {
            passwordError.textContent = "Password must be at least 8 characters long and contain both letters and digits.";
            valid = false;
        }

        if (password.value !== confirmPassword.value) {
            confirmPasswordError.textContent = "Passwords do not match!";
            valid = false;
        } else {
            confirmPasswordError.textContent = "";
        }

        if (!valid) {
            event.preventDefault();
        }
    }

    password.addEventListener("input", validatePassword);
    form.addEventListener("submit", validateForm);
});
