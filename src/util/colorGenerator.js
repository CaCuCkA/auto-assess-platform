exports.getRandomCardColor = () => {
    const colors = [
        "#F0F4FF", "#D9E2F3", "#B0C4DE", "#8FAADC", "#FFD700", 
        "#F4A261", "#E63946", "#4CAF50", "#2C3E50", "#1E90FF"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}