const foto = document.querySelector('.backgroundImage');

window.addEventListener('scroll', () => {
    let scrollPositie = window.scrollY;

    let blur = Math.max(scrollPositie / 100, 0);
    let scale = Math.min(1 + (scrollPositie / 1000), 1.1);

    foto.style.filter = `blur(${blur}px)`;
    foto.style.transform = `scale(${scale})`;

});

