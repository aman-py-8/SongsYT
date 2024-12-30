export default class HeaderComponent extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <style>
            /* Header Styling */
            .header {
                display: flex;
                align-items: center;
                justify-content: space-between; /* Space between logo and small text */
                background-color: #1d1d1f; /* Dark background for a sleek look */
                color: white;
                padding: 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .logo-container {
                display: flex;
                align-items: center;
                gap: 10px; /* Space between the logo and text */
            }

            .logo {
                width: 40px; /* Adjust size as needed */
                height: 40px; /* Ensure consistent size */
                border-radius: 50%; /* Optional: Circular logo */
                object-fit: cover; /* Ensures proper scaling */
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Add a shadow for depth */
            }

            .header h1 {
                font-family: 'Poppins', sans-serif; /* Modern, clean font */
                font-size: 1.2rem; /* Adjust for better readability */
                font-weight: 600;
                margin: 0;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5); /* Subtle text shadow */
                color: #f2f2f2; /* Soft white */
            }

            .small-text {
                font-family: 'Poppins', sans-serif;
                font-size: 0.9rem; /* Smaller font for subtle text */
                font-weight: 400;
                color: #f2f2f2; /* Soft white */
                text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 5px; /* Space between text and emoji */
            }

            .small-text .love-emoji {
                color: #e25555; /* Red color for love emoji */
                font-size: 1rem;
            }
        </style>
        <header class="header">
            <div class="logo-container">
                <img src="favicon.png" alt="Music Player Logo" class="logo">
                <h1>SongsYT</h1>
            </div>
            <div class="small-text">
                Made with <span class="love-emoji">❤️</span> by Aman
            </div>
        </header>
        `;
    }
}
customElements.define('header-component', HeaderComponent);
