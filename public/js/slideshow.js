document.addEventListener('DOMContentLoaded', () => {
    const slideshow = document.getElementById('slideshow');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentSlide = 0;
    let slides = [];
    let slideInterval;

    // Load slideshow images
    loadSlideshowImages();

    // Handle navigation
    prevBtn.addEventListener('click', () => {
        clearInterval(slideInterval);
        showSlide(currentSlide - 1);
        startSlideshow();
    });

    nextBtn.addEventListener('click', () => {
        clearInterval(slideInterval);
        showSlide(currentSlide + 1);
        startSlideshow();
    });

    // Function to load slideshow images
    async function loadSlideshowImages() {
        try {
            const response = await fetch('/api/slideshow');
            const images = await response.json();

            if (images.length === 0) {
                slideshow.innerHTML = '<div class="loading">No slideshow images available.</div>';
                return;
            }

            // Filter active images only
            slides = images.filter(image => image.isActive);

            if (slides.length === 0) {
                slideshow.innerHTML = '<div class="loading">No active slideshow images.</div>';
                return;
            }

            // Create slides
            slideshow.innerHTML = slides.map((slide, index) => `
                <div class="slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${slide.imageUrl}" alt="${slide.caption || 'Slideshow image'}">
                    ${slide.caption ? `<div class="slide-caption">${slide.caption}</div>` : ''}
                </div>
            `).join('');

            // Start slideshow
            startSlideshow();
        } catch (error) {
            console.error('Error:', error);
            slideshow.innerHTML = '<div class="loading">Error loading slideshow images.</div>';
        }
    }

    // Function to show a specific slide with random effect
    function showSlide(index) {
        // Handle wrap-around
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        // Update current slide
        currentSlide = index;

        // Get all slides
        const allSlides = document.querySelectorAll('.slide');
        
        // Remove active class from all slides
        allSlides.forEach(slide => {
            slide.classList.remove('active');
            // Remove any existing transition classes
            slide.classList.remove('fade', 'slide-left', 'slide-right', 'zoom');
        });

        // Get current slide element
        const currentSlideElement = document.querySelector(`.slide[data-index="${index}"]`);
        
        // Add random transition effect
        const effects = ['fade', 'slide-left', 'slide-right', 'zoom'];
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        currentSlideElement.classList.add(randomEffect);
        
        // Add active class
        currentSlideElement.classList.add('active');
    }

    // Function to start automatic slideshow
    function startSlideshow() {
        slideInterval = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 5000); // Change slide every 5 seconds
    }
}); 