// Code to handle archetype selection
document.addEventListener('DOMContentLoaded', function() {
    // Get all archetype options
    const archetypeOptions = document.querySelectorAll('.archetype-option');
    const archetypeInput = document.getElementById('archetype');
    
    // Set initial selected archetype (based on default value 'innovator' from loadInitialData())
    const defaultArchetype = 'innovator';
    const defaultOption = document.querySelector(`.archetype-option[data-value="${defaultArchetype}"]`);
    if (defaultOption) {
        defaultOption.classList.add('selected');
        archetypeInput.value = defaultArchetype;
    }
    
    // Add click event listener to each archetype option
    archetypeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            archetypeOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input value with the selected archetype
            const value = this.getAttribute('data-value');
            archetypeInput.value = value;
            
            // Update the full string with the new archetype value
            updateFullString();
        });
    });
});
