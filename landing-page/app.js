// NuovaLingua Landing Page - Vue.js App
const { createApp } = Vue;

createApp({
  data() {
    return {
      scrolled: false
    };
  },
  mounted() {
    // Navigation scroll effect
    window.addEventListener('scroll', this.handleScroll);
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          const offsetTop = target.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
    
    // Simple AOS (Animate On Scroll) implementation
    this.initAOS();
  },
  methods: {
    handleScroll() {
      this.scrolled = window.scrollY > 50;
    },
    initAOS() {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
          }
        });
      }, observerOptions);
      
      // Observe all elements with data-aos attribute
      document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
      });
    }
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }
}).mount('#app');

