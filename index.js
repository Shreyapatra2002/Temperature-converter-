const textBox = document.getElementById("textBox");
const toFahrenheit = document.getElementById("toFahrenheit");
const toCelsius = document.getElementById("toCelsius");
const result = document.getElementById("result");
const convertBtn = document.getElementById("convertBtn");
const themeBtn = document.getElementById("themeBtn");
const inputUnit = document.getElementById("inputUnit");
const scaleFill = document.getElementById("scaleFill");
const historyList = document.getElementById("historyList");
const clearHistory = document.getElementById("clearHistory");

let conversionHistory = [];

// Safe localStorage operations
function getStoredHistory() {
    try {
        return JSON.parse(localStorage.getItem('conversionHistory')) || [];
    } catch (e) {
        console.error('Error loading history from localStorage:', e);
        return [];
    }
}

function setStoredHistory(history) {
    try {
        localStorage.setItem('conversionHistory', JSON.stringify(history));
    } catch (e) {
        console.error('Error saving history to localStorage:', e);
        console.warn('History will not be persisted across sessions');
    }
}

// Initialize
conversionHistory = getStoredHistory();
updateInputUnit();
loadHistory();
updateThemeButton();
updateTemperatureScale(32, "°F");

// Event Listeners
convertBtn.addEventListener("click", convert);
themeBtn.addEventListener("click", toggleTheme);
clearHistory.addEventListener("click", clearHistoryList);

// Quick temperature buttons
document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tempValue = this.getAttribute('data-temp');
        textBox.value = tempValue;
        removeErrorState(textBox);
        
        // Animation
        textBox.style.transform = 'scale(1.05)';
        setTimeout(() => {
            textBox.style.transform = 'scale(1)';
        }, 300);
        
        convert();
    });
});

// Radio button change events
toFahrenheit.addEventListener("change", updateInputUnit);
toCelsius.addEventListener("change", updateInputUnit);

// Enter key support
textBox.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        convert();
    }
});

// Input validation
textBox.addEventListener("input", function() {
    removeErrorState(this);
    
    const value = this.value.trim();
    if (value === "") return;
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
        showError(this, "Please enter a valid number");
        return;
    }
    
    if (!isFinite(numValue)) {
        showError(this, "Temperature value is not valid");
        return;
    }
    
    if (Math.abs(numValue) > 10000) {
        showError(this, "Temperature value is too large (> 10,000)");
    }
});

function removeErrorState(element) {
    element.classList.remove('error', 'warning');
    result.classList.remove('error');
}

function showError(element, message) {
    element.classList.add('error');
    showResult(message, true);
}

function updateInputUnit() {
    if (toFahrenheit.checked) {
        inputUnit.textContent = "°C";
    } else {
        inputUnit.textContent = "°F";
    }
    
    // Animation
    inputUnit.style.transform = 'scale(1.2)';
    setTimeout(() => {
        inputUnit.style.transform = 'scale(1)';
    }, 300);
}

function convert() {
    // Reset any previous errors
    removeErrorState(textBox);
    
    if (!toFahrenheit.checked && !toCelsius.checked) {
        showResult("Please select a conversion direction", true);
        return;
    }

    const inputValue = textBox.value.trim();
    if (inputValue === "") {
        showError(textBox, "Please enter a temperature");
        return;
    }

    const originalTemp = Number(inputValue);
    
    if (isNaN(originalTemp)) {
        showError(textBox, "Please enter a valid number");
        return;
    }

    if (!isFinite(originalTemp)) {
        showError(textBox, "Temperature value is not valid");
        return;
    }

    if (Math.abs(originalTemp) > 10000) {
        showError(textBox, "Temperature value is too extreme");
        return;
    }

    if (Math.abs(originalTemp) > 1000) {
        if (!confirm("This temperature seems unusually high. Continue anyway?")) {
            return;
        }
    }

    setLoadingState(true);

    let convertedTemp;
    let fromUnit, toUnit;

    // Button animation
    convertBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        convertBtn.style.transform = 'scale(1)';
    }, 200);

    // Perform conversion
    if (toFahrenheit.checked) {
        convertedTemp = (originalTemp * 9/5) + 32;
        fromUnit = "°C";
        toUnit = "°F";
    } else {
        convertedTemp = (originalTemp - 32) * (5/9);
        fromUnit = "°F";
        toUnit = "°C";
    }

    // Handle precision
    if (Math.abs(convertedTemp) < 0.1 && convertedTemp !== 0) {
        convertedTemp = Number(convertedTemp.toFixed(6));
    } else {
        convertedTemp = Number(convertedTemp.toFixed(1));
    }

    const resultText = `${convertedTemp}${toUnit}`;
    showResult(resultText);
    
    // Add to history
    addToHistory(originalTemp + fromUnit, resultText);
    
    // Update temperature scale
    updateTemperatureScale(convertedTemp, toUnit);
    
    setLoadingState(false);
}

function setLoadingState(isLoading) {
    if (isLoading) {
        convertBtn.disabled = true;
        convertBtn.classList.add('loading');
    } else {
        convertBtn.disabled = false;
        convertBtn.classList.remove('loading');
    }
}

function showResult(text, isError = false) {
    result.textContent = text;
    
    if (isError) {
        result.style.color = "var(--error-color)";
        result.classList.add('error');
    } else {
        result.style.color = "var(--primary-color)";
        result.classList.remove('error');
    }
    
    // Animation
    result.style.opacity = '0';
    result.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        result.style.opacity = '1';
        result.style.transform = 'translateY(0)';
    }, 150);
}

function updateTemperatureScale(temp, unit) {
    let percentage;
    
    if (unit === "°C") {
        const minTemp = -50;
        const maxTemp = 100;
        const normalizedTemp = Math.min(Math.max(temp, minTemp), maxTemp);
        percentage = ((normalizedTemp - minTemp) / (maxTemp - minTemp)) * 100;
    } else {
        const minTemp = -58;
        const maxTemp = 212;
        const normalizedTemp = Math.min(Math.max(temp, minTemp), maxTemp);
        percentage = ((normalizedTemp - minTemp) / (maxTemp - minTemp)) * 100;
    }
    
    percentage = Math.min(Math.max(percentage, 0), 100);
    
    // Determine color based on temperature
    let color;
    if (percentage < 33) {
        color = 'linear-gradient(90deg, #4ECDC4 0%, #45B7D1 100%)';
    } else if (percentage < 66) {
        color = 'linear-gradient(90deg, #45B7D1 0%, #96CEB4 50%, #FFEAA7 100%)';
    } else {
        color = 'linear-gradient(90deg, #FFEAA7 0%, #FF9F43 50%, #FF6B6B 100%)';
    }
    
    scaleFill.style.width = `${percentage}%`;
    scaleFill.style.background = color;
}

function addToHistory(from, to) {
    const historyItem = {
        from,
        to,
        timestamp: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString()
    };
    
    conversionHistory.unshift(historyItem);
    
    // Keep only last 10 items
    if (conversionHistory.length > 10) {
        conversionHistory = conversionHistory.slice(0, 10);
    }
    
    setStoredHistory(conversionHistory);
    loadHistory();
}

function loadHistory() {
    historyList.innerHTML = '';
    
    if (conversionHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'history-empty';
        emptyMessage.innerHTML = '<em>No conversion history yet</em>';
        historyList.appendChild(emptyMessage);
        clearHistory.disabled = true;
        return;
    }
    
    clearHistory.disabled = false;
    
    conversionHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <strong>${item.from} → ${item.to}</strong>
            <small>${item.timestamp} • ${item.date}</small>
        `;
        
        // Animation
        historyItem.style.opacity = '0';
        historyItem.style.transform = 'translateX(-50px)';
        setTimeout(() => {
            historyItem.style.opacity = '1';
            historyItem.style.transform = 'translateX(0)';
        }, index * 100);
        
        historyList.appendChild(historyItem);
    });
}

function clearHistoryList() {
    if (conversionHistory.length === 0) return;
    
    if (!confirm("Are you sure you want to clear all conversion history?")) {
        return;
    }
    
    conversionHistory = [];
    setStoredHistory(conversionHistory);
    loadHistory();
    
    // Animation
    clearHistory.style.transform = 'scale(0.9)';
    setTimeout(() => {
        clearHistory.style.transform = 'scale(1)';
    }, 300);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    updateThemeButton();
    
    const isDark = document.body.classList.contains('dark-mode');
    document.body.style.background = isDark 
        ? "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)" 
        : "linear-gradient(135deg, #F8F9FA 0%, #E8F4F8 100%)";
}

function updateThemeButton() {
    const isDark = document.body.classList.contains('dark-mode');
    themeBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    themeBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    
    // Animation
    themeBtn.style.transform = 'rotateY(180deg) scale(1.1)';
    setTimeout(() => {
        themeBtn.style.transform = 'rotateY(0deg) scale(1)';
    }, 300);
}

// Accessibility labels
textBox.setAttribute('aria-label', 'Temperature input');
textBox.setAttribute('aria-describedby', 'inputUnit');
convertBtn.setAttribute('aria-label', 'Convert temperature');

// Form submission handling
document.querySelector('.converter-form').addEventListener('submit', function(e) {
    e.preventDefault();
    convert();
});

// Initialize scale fill
scaleFill.style.width = '0%';