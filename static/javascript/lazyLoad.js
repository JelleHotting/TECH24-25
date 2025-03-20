document.addEventListener("DOMContentLoaded", function() {
    const images = document.querySelectorAll('.lazy-load');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const image = entry.target;
                image.src = image.dataset.src;
                observer.unobserve(image);
            }
        });
    }, { rootMargin: "0px 50px 0px" });

    images.forEach(image => {
        imageObserver.observe(image);
    });
});
