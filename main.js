gsap.registerPlugin(ScrollTrigger);

const lottieAnimations = {};

// --- Lottie Animations Setup ---
async function setupLottieAnimation(containerSelector, animationPath, loop = false, autoplay = false, markerName = '') { // Autoplay set to false, will be controlled by ScrollTrigger
    const containerElement = document.querySelector(containerSelector);
    if (!containerElement) {
        console.warn(`Lottie container not found for selector: ${containerSelector}`);
        return;
    }

    console.log(`Attempting to set up Lottie animation for: ${containerSelector}`);
    console.log(`Lottie animation path being used: ${animationPath}`);

    try {
        const response = await fetch(animationPath);
        if (!response.ok) {
            console.error(`Lottie file not found or failed to load (HTTP status ${response.status}) for path: ${animationPath}`);
            return;
        }
        const jsonData = await response.json();
        console.log(`Lottie file fetched successfully and is valid JSON for path: ${animationPath}`);
    } catch (fetchError) {
        console.error(`Error fetching Lottie file for path: ${animationPath}`, fetchError);
        return;
    }

    if (lottieAnimations[containerSelector]) {
        lottieAnimations[containerSelector].destroy();
    }

    try {
        const anim = lottie.loadAnimation({
            container: containerElement,
            renderer: 'svg',
            loop: loop,
            autoplay: autoplay, // This will now be false
            path: animationPath,
            rendererSettings: {
                preserveAspectRatio: 'xMidYMid meet'
            }
        });

        lottieAnimations[containerSelector] = anim;

        anim.addEventListener('DOMLoaded', () => {
            console.log(`Lottie animation DOMLoaded (parsed and ready) for: ${containerSelector}`);
        });
        anim.addEventListener('data_failed', (error) => {
            console.error(`Lottie animation data_failed (parsing error) for: ${containerSelector}`, error);
        });
        anim.addEventListener('error', (error) => {
            console.error(`Lottie animation general error for: ${containerSelector}`, error);
        });

        ScrollTrigger.create({
            trigger: containerElement.closest('.story-section'),
            start: "top center", // Play when the top of the section hits the center of the viewport
            end: "bottom center", // Pause when the bottom of the section leaves the center of the viewport
            toggleActions: "play pause resume reverse", // Play on enter, pause on leave, resume on enter back, reverse on leave back
            onEnter: () => {
                console.log(`Lottie ${containerSelector} entered. Playing.`);
                anim.play();
            },
            onLeave: () => {
                console.log(`Lottie ${containerSelector} left. Pausing.`);
                anim.pause();
            },
            onEnterBack: () => {
                console.log(`Lottie ${containerSelector} entered back. Playing.`);
                anim.play();
            },
            onLeaveBack: () => {
                console.log(`Lottie ${containerSelector} left back. Pausing.`);
                anim.pause();
            },
            // markers: true, // For debugging
            id: markerName || containerElement.closest('.story-section').id + '-lottie'
        });
        return anim;
    } catch (e) {
        console.error(`Error during lottie.loadAnimation call for ${containerSelector}:`, e);
    }
}

function setupVideoScrollControl(videoSelector, markerName = '') {
    const video = document.querySelector(videoSelector);
    if (!video) {
        console.warn(`Video element not found for selector: ${videoSelector}`);
        return;
    }

    console.log(`Setting up video scroll control for: ${videoSelector}`);

    video.addEventListener('loadedmetadata', () => {
        console.log(`Video loadedmetadata for ${videoSelector}. Duration: ${video.duration}s`);
        if (isNaN(video.duration) || video.duration === 0) {
            console.error(`Video duration is not valid for ${videoSelector}. Cannot control.`);
            return;
        }

        video.loop = true; // Set video to loop

        // RE-INTRODUCED ScrollTrigger for video playback
        ScrollTrigger.create({
            trigger: video.closest('.story-section'),
            start: "top top", // Play when the top of the section hits the top of the viewport
            end: "bottom center", // Pause when the bottom of the section leaves the center of the viewport
            toggleActions: "play pause resume reverse", // Play on enter, pause on leave, resume on enter back, reverse on leave back
            onEnter: () => {
                console.log(`Video ${videoSelector} entered. Playing.`);
                video.play().catch(error => {
                    console.error(`Autoplay failed for ${videoSelector} onEnter:`, error);
                });
            },
            onLeave: () => {
                console.log(`Video ${videoSelector} left. Pausing.`);
                video.pause();
            },
            onEnterBack: () => {
                console.log(`Video ${videoSelector} entered back. Playing.`);
                video.play().catch(error => {
                    console.error(`Autoplay failed for ${videoSelector} onEnterBack:`, error);
                });
            },
            onLeaveBack: () => {
                console.log(`Video ${videoSelector} left back. Pausing.`);
                video.pause();
            },
            onRefresh: (self) => {
                if (!self.isActive) {
                    video.pause();
                    console.log(`ScrollTrigger refreshed for ${videoSelector}. Video paused as not active.`);
                }
            },
            // markers: true, // For debugging
            id: markerName || video.closest('.story-section').id + '-video'
        });
    });

    video.addEventListener('error', (e) => {
        console.error(`Error loading video for ${videoSelector}:`, e);
        if (video.networkState === video.NETWORK_NO_SOURCE) {
            console.error(`Video source not found or invalid for ${videoSelector}. Check path and file.`);
        }
    });

    if (video.readyState < 1) {
        video.load();
        console.log(`Attempting to load video for ${videoSelector}.`);
    }
}


// --- Initialize All Components on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    gsap.config({
        nullTargetWarn: false
    });

    // Setup Lottie animations
    document.querySelectorAll('.lottie-animation').forEach(lottieDiv => {
        const path = lottieDiv.dataset.animationPath;
        if (!lottieDiv.id) {
            lottieDiv.id = `lottie-anim-${Math.random().toString(36).substr(2, 9)}`;
        }
        if (path) {
            setupLottieAnimation(`#${lottieDiv.id}`, path, true, false, `${lottieDiv.closest('.story-section').id}-lottie-marker`); // Loop true, autoplay false
        }
    });

    // Setup video scenes
    setupVideoScrollControl('.header-video', 'intro-video-marker'); 
    setupVideoScrollControl('.story-video', 'threat-video-marker');

    // GSAP animation for content overlay text to scroll up
    gsap.utils.toArray(".story-section .content.overlay-text").forEach((overlayText, index) => {
        gsap.fromTo(overlayText,
            { yPercent: 100, opacity: 0.5 },
            {
                yPercent: -100,
                opacity: 2.5,
                ease: "none",
                scrollTrigger: {
                    trigger: overlayText,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                    // markers: true,
                    id: `overlay-text-scroll-${index}`
                }
            }
        );
    });

    // Example of a more specific GSAP animation for general text paragraphs on scroll
    gsap.utils.toArray(".story-section .content p").forEach((paragraph, index) => {
        if (!paragraph.closest('.content.overlay-text')) {
            gsap.from(paragraph, {
                opacity: 0.5,
                y: 50,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: paragraph,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse",
                    // markers: true,
                    id: `text-paragraph-${index}`
                }
            });
        }
    });

    // Setup Lottie animations with sticky overlay effect
    document.querySelectorAll('.lottie-scene').forEach(lottieScene => {
        const lottieVisualContainer = lottieScene.querySelector('.lottie-animation');
        const lottieSteps = lottieScene.querySelectorAll('.content.overlay-text'); // Changed to target content.overlay-text
        const animationPath = lottieVisualContainer ? lottieVisualContainer.dataset.animationPath : null;

        if (lottieVisualContainer && animationPath && lottieSteps.length > 0) {
            // Load the Lottie animation
            setupLottieAnimation(`#${lottieVisualContainer.id || (lottieVisualContainer.id = `lottie-anim-${Math.random().toString(36).substr(2, 9)}`)}`, animationPath, false, false); // Loop false, autoplay false for scrubbing

            // Calculate the total scroll height needed for this section
            const totalSteps = lottieSteps.length;
            const sectionScrollHeight = (totalSteps + 1) * window.innerHeight; // +1 to ensure the last step fully scrolls in

            // Set the min-height of the lottie-scene to allow for pinning and scrolling through steps
            lottieScene.style.minHeight = `${sectionScrollHeight}px`;

            // Pin the Lottie visual and control text steps
            ScrollTrigger.create({
                trigger: lottieScene,
                start: "top top", // Pin the section when its top hits the top of the viewport
                end: `+=${sectionScrollHeight - window.innerHeight}`, // End pinning after all steps have scrolled
                pin: lottieScene.querySelector('.lottie-animation'), // Pin the Lottie animation itself
                scrub: 0, // No scrubbing for the Lottie animation itself, it will play on step enter
                // markers: true,
                id: `${lottieScene.id}-pin`,
                onUpdate: self => {
                    // Control Lottie animation progress based on overall section scroll
                    const anim = lottieAnimations[lottieVisualContainer.id];
                    if (anim) {
                        const progress = self.progress;
                        const frame = anim.totalFrames * progress;
                        anim.goToAndStop(frame, true);
                    }
                }
            });

            // Set up individual ScrollTriggers for each text step
            lottieSteps.forEach((step, index) => {
                ScrollTrigger.create({
                    trigger: step,
                    start: `top center`, // When the top of the step hits the center of the viewport
                    end: `bottom center`, // When the bottom of the step leaves the center of the viewport
                    toggleActions: "play none none reverse", // Play on enter, reverse on leave
                    onEnter: () => {
                        step.classList.add('is-active');
                    },
                    onLeave: () => {
                        step.classList.remove('is-active');
                    },
                    onEnterBack: () => {
                        step.classList.add('is-active');
                    },
                    onLeaveBack: () => {
                        step.classList.remove('is-active');
                    },
                    // markers: true,
                    id: `${lottieScene.id}-step-${index}`
                });
            });
        } else if (lottieVisualContainer && animationPath) {
             // If there are no steps, just autoplay the Lottie as before
             setupLottieAnimation(`#${lottieVisualContainer.id || (lottieVisualContainer.id = `lottie-anim-${Math.random().toString(36).substr(2, 9)}`)}`, animationPath, true, true);
        }
    });

    // Setup video sections with sticky overlay effect
    document.querySelectorAll('.intro, .video-background-section').forEach(videoSection => {
        const videoElement = videoSection.querySelector('.header-video, .background-video');
        const videoSteps = videoSection.querySelectorAll('.content.overlay-text, .intro-header'); // Target all potential text steps
        
        if (videoElement && videoSteps.length > 0) {
            // Ensure video is loaded and set to loop
            videoElement.loop = true;
            if (videoElement.readyState < 1) {
                videoElement.load();
            }

            // Calculate the total scroll height needed for this section
            const totalSteps = videoSteps.length;
            const sectionScrollHeight = (totalSteps + 1) * window.innerHeight; // +1 for initial visual space

            // Set the min-height of the video section to allow for pinning and scrolling through steps
            videoSection.style.minHeight = `${sectionScrollHeight}px`;

            // Pin the video visual and control text steps
            ScrollTrigger.create({
                trigger: videoSection,
                start: "top top", // Pin the section when its top hits the top of the viewport
                end: `+=${sectionScrollHeight - window.innerHeight}`, // End pinning after all steps have scrolled
                pin: videoSection.querySelector('.video-sticky-visual'), // Pin the video container
                // markers: true,
                id: `${videoSection.id}-pin`,
                onUpdate: self => {
                    // Scrub video playback based on overall section scroll
                    const progress = self.progress;
                    if (!isNaN(videoElement.duration) && videoElement.duration > 0) {
                        videoElement.currentTime = videoElement.duration * progress;
                    }
                },
                onEnter: () => {
                    videoElement.play().catch(error => console.error("Video autoplay failed on enter:", error));
                },
                onLeave: () => {
                    videoElement.pause();
                },
                onEnterBack: () => {
                    videoElement.play().catch(error => console.error("Video autoplay failed on enter back:", error));
                },
                onLeaveBack: () => {
                    videoElement.pause();
                },
                onRefresh: (self) => {
                    if (!self.isActive) {
                        videoElement.pause();
                    }
                }
            });

            // Set up individual ScrollTriggers for each text step
            videoSteps.forEach((step, index) => {
                ScrollTrigger.create({
                    trigger: step,
                    start: `top center`, // When the top of the step hits the center of the viewport
                    end: `bottom center`, // When the bottom of the step leaves the center of the viewport
                    toggleActions: "play none none reverse",
                    onEnter: () => {
                        step.classList.add('is-active');
                    },
                    onLeave: () => {
                        step.classList.remove('is-active');
                    },
                    onEnterBack: () => {
                        step.classList.add('is-active');
                    },
                    onLeaveBack: () => {
                        step.classList.remove('is-active');
                    },
                    // markers: true,
                    id: `${videoSection.id}-step-${index}`
                });
            });
        } else if (videoElement) {
            // If no steps, just play/pause the video on section enter/leave without pinning
            setupVideoScrollControl(`#${videoElement.id || (videoElement.id = `video-anim-${Math.random().toString(36).substr(2, 9)}`)}`, `${videoSection.id}-video-marker`);
        }
    });


    // GSAP animation for content overlay text to scroll up (for non-sticky overlay-text)
    // This targets 'content overlay-text' that are NOT part of a sticky setup (i.e., not .lottie-step or .video-step)
    gsap.utils.toArray(".story-section .content.overlay-text:not(.lottie-step):not(.video-step)").forEach((overlayText, index) => {
        gsap.fromTo(overlayText,
            { yPercent: 100, opacity: 1 },
            {
                yPercent: -100,
                opacity: 1,
                ease: "none",
                scrollTrigger: {
                    trigger: overlayText,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                    // markers: true,
                    id: `overlay-text-scroll-${index}`
                }
            }
        );
    });

    // Example of a more specific GSAP animation for general text paragraphs on scroll
    gsap.utils.toArray(".story-section .content p").forEach((paragraph, index) => {
        // Ensure this doesn't re-animate paragraphs already handled by overlay-text animation if they are children
        // This targets paragraphs *not* directly inside an overlay-text that is already animated
        if (!paragraph.closest('.content.overlay-text')) {
            gsap.from(paragraph, {
                opacity: 1,
                y: 50,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: paragraph,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse",
                    // markers: true,
                    id: `text-paragraph-${index}`
                }
            });
        }
    });

    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            });
        });
    }

    window.addEventListener('resize', () => {
        ScrollTrigger.refresh(); // Refresh ScrollTrigger to recalculate positions on resize
    });
});
