/**
 * Data Platforms Page - Interactive Canvas Animation
 * Creates animated data flow visualization in hero section
 */

(function() {
    'use strict';

    // Initialize canvas animation
    function initDataFlowCanvas() {
        const canvas = document.getElementById('dataFlowCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationFrameId;

        // Set canvas size
        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        // Particle class for data flow effect
        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.5 + 0.2;
                this.connections = [];
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Wrap around edges
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 229, 255, ${this.opacity})`;
                ctx.fill();
            }
        }

        // Initialize particles
        function createParticles() {
            const particleCount = Math.min(Math.floor(canvas.width / 20), 50);
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        // Draw connections between nearby particles
        function drawConnections() {
            const maxDistance = 150;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        const opacity = (1 - distance / maxDistance) * 0.3;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        }

        // Animation loop
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections first
            drawConnections();

            // Update and draw particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        }

        // Initialize
        resizeCanvas();
        createParticles();
        animate();

        // Handle resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
                createParticles();
            }, 250);
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        });
    }

    // Add scroll-triggered animations for section reveals
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe cards and sections
        const animatedElements = document.querySelectorAll(
            '.platform-card, .use-case-card, .benefit-card, .flow-stage'
        );

        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
            observer.observe(el);
        });
    }

    // Add smooth scroll for anchor links
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Add hover effects for tech tags
    function initTechTagInteractions() {
        const techTags = document.querySelectorAll('.tech-tag');

        techTags.forEach(tag => {
            tag.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px) scale(1.05)';
            });

            tag.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    // Parallax effect for hero section
    function initParallaxEffect() {
        const hero = document.querySelector('.data-hero-section');
        if (!hero) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    const parallaxSpeed = 0.5;

                    if (scrolled < hero.offsetHeight) {
                        hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
                    }

                    ticking = false;
                });

                ticking = true;
            }
        });
    }

    // Add number counting animation for stats
    function initStatsCounter() {
        const stats = document.querySelectorAll('.stat-value');
        const duration = 2000; // 2 seconds

        const observerOptions = {
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.counted) {
                    entry.target.dataset.counted = 'true';
                    animateValue(entry.target);
                }
            });
        }, observerOptions);

        stats.forEach(stat => observer.observe(stat));

        function animateValue(element) {
            const text = element.textContent;
            const isPercentage = text.includes('%');
            const isMillions = text.includes('M+');
            const isLatency = text.includes('ms');
            const isUptime = text.includes('.');

            let targetValue;
            let suffix = '';

            if (isPercentage) {
                targetValue = parseFloat(text);
                suffix = '%';
            } else if (isMillions) {
                targetValue = 10;
                suffix = 'M+';
            } else if (isLatency) {
                targetValue = 100;
                suffix = 'ms';
            } else if (isUptime) {
                targetValue = 99.9;
                suffix = '%';
                element.textContent = '99.9%';
                return; // Skip animation for decimal values
            }

            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function (easeOutExpo)
                const easeOut = 1 - Math.pow(2, -10 * progress);
                const currentValue = Math.floor(easeOut * targetValue);

                element.textContent = currentValue + suffix;

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    element.textContent = targetValue + suffix;
                }
            }

            requestAnimationFrame(update);
        }
    }

    // Check for reduced motion preference
    function respectsReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Initialize all features
    function init() {
        // Always init these
        initSmoothScroll();
        initTechTagInteractions();

        // Only init animations if user hasn't requested reduced motion
        if (!respectsReducedMotion()) {
            initDataFlowCanvas();
            initScrollAnimations();
            initParallaxEffect();
            initStatsCounter();
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
