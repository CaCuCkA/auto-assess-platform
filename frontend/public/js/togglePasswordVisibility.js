const passwordFields = document.querySelectorAll(".password-input");
const showPasswordIcon = document.querySelector(".password-toggle-icon");

showPasswordIcon.addEventListener("click", function() {
    passwordFields.forEach(field => {
        const isPasswordVisible = field.getAttribute("type") === "password";
        const newType = isPasswordVisible ? "text" : "password";
        field.setAttribute("type", newType);
    });

    showPasswordIcon.classList.toggle("uil-eye-slash");
    showPasswordIcon.classList.toggle("uil-eye");
});