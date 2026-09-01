/**
 * Magical Birthday Diary — Realistic 3D Physical Book Physics Engine
 */

class TrackingService {
    constructor(apiBaseUrl = '/api/tracking') {
        this.apiBaseUrl = apiBaseUrl;
    }

    async getTrackingInfo(params = {}) {
        const urlParams = new URLSearchParams(params).toString();
        const fetchUrl = urlParams ? `${this.apiBaseUrl}?${urlParams}` : this.apiBaseUrl;

        try {
            const response = await fetch(fetchUrl);
            if (!response.ok) {
                throw new Error(`Tracking API error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('TrackingService fetch failed:', error);
            throw error;
        }
    }
}

class PhysicalBookController {
    constructor() {
        this.trackingService = new TrackingService();
        this.currentChapter = 1;
        this.totalChapters = 8;
        this.isBookOpened = false;
        this.isOpening = false;
        this.isFlipping = false;
        this.isSecretMode = false;
        this.activeTrackingData = null;
        this.countdownInterval = null;

        // Mouse Parallax Physics Variables
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotateX = 8;
        this.targetRotateY = -4;
        this.currentRotateX = 8;
        this.currentRotateY = -4;

        // Touch Drag Physics
        this.touchStartX = 0;
        this.touchMoveX = 0;

        this.chapterTitles = [
            "Closed Book",
            "Intro 🌟",
            "Story 📜",
            "Memories 🖼️",
            "Tulip Garden 🌷",
            "Gift Journey 🎁",
            "Birthday Cake 🎂",
            "Message 💌",
            "Celebration 🎉"
        ];

        this.init();
    }

    init() {
        this.bindEvents();
        this.initMouseParallax();
        this.loadTrackingData();
        this.updateNavigationUI();
    }

    bindEvents() {
        // Open Book Button
        const openBookBtn = document.getElementById('openBookBtn');
        if (openBookBtn) {
            openBookBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.executeOpeningSequence();
            });
        }

        // Cover Click to Open
        const bookCoverFront = document.getElementById('bookCoverFront3D');
        if (bookCoverFront) {
            bookCoverFront.addEventListener('click', () => {
                if (!this.isBookOpened && !this.isOpening) {
                    this.executeOpeningSequence();
                }
            });
        }

        const introNextBtn = document.getElementById('introNextBtn');
        if (introNextBtn) {
            introNextBtn.addEventListener('click', () => this.nextChapter());
        }

        // Side Navigation Arrows
        const prevArrow = document.getElementById('prevSideArrow');
        const nextArrow = document.getElementById('nextSideArrow');

        if (prevArrow) {
            prevArrow.addEventListener('click', () => this.prevChapter());
        }
        if (nextArrow) {
            nextArrow.addEventListener('click', () => this.nextChapter());
        }

        // Keyboard Navigation (Left & Right Arrows)
        document.addEventListener('keydown', (e) => {
            if (!this.isBookOpened || this.isFlipping) return;
            if (e.key === 'ArrowLeft') this.prevChapter();
            if (e.key === 'ArrowRight') this.nextChapter();
        });

        // Mobile Touch Swipe Handlers
        const bookStage = document.getElementById('bookStage');
        if (bookStage) {
            bookStage.addEventListener('touchstart', (e) => {
                if (!this.isBookOpened) return;
                this.touchStartX = e.touches[0].clientX;
            }, { passive: true });

            bookStage.addEventListener('touchmove', (e) => {
                if (!this.isBookOpened) return;
                this.touchMoveX = e.touches[0].clientX;
            }, { passive: true });

            bookStage.addEventListener('touchend', () => {
                if (!this.isBookOpened || !this.touchMoveX) return;
                const diffX = this.touchStartX - this.touchMoveX;
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        this.nextChapter();
                    } else {
                        this.prevChapter();
                    }
                }
                this.touchStartX = 0;
                this.touchMoveX = 0;
            });
        }

        // Secret Mode Toggle
        const secretToggleBtn = document.getElementById('secretToggleBtn');
        if (secretToggleBtn) {
            secretToggleBtn.addEventListener('click', () => this.toggleSecretMode());
        }

        const revealSecretBtn = document.getElementById('revealSecretBtn');
        if (revealSecretBtn) {
            revealSecretBtn.addEventListener('click', () => this.setSecretMode(false));
        }

        // Copy Tracking Number Button
        const copyBtn = document.getElementById('copyTrackingBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyTrackingNumber());
        }

        // Refresh Journey Button
        const refreshBtn = document.getElementById('refreshJourneyBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadTrackingData());
        }

        // Cake Candle Blowout
        const cakeArea = document.querySelector('.cake-visual');
        if (cakeArea) {
            cakeArea.addEventListener('click', () => this.blowOutCandle());
        }

        // Final Celebration Button
        const finalCelebrateBtn = document.getElementById('finalCelebrateBtn');
        if (finalCelebrateBtn) {
            finalCelebrateBtn.addEventListener('click', () => {
                if (window.effectsController) {
                    window.effectsController.triggerConfettiBurst();
                }
                this.showToast("✨ Celebration sparkles activated! 🎉");
            });
        }
    }

    /* ==========================================================================
       MOUSE PARALLAX ENGINE (Subtle 3D Tilt Following Cursor)
       ========================================================================== */
    initMouseParallax() {
        if ('ontouchstart' in window) return; // Disable heavy tilt on touch devices

        window.addEventListener('mousemove', (e) => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            
            const normX = (e.clientX / w) - 0.5; // -0.5 to 0.5
            const normY = (e.clientY / h) - 0.5;

            // Subtle rotation bounds: ±10 deg Y, ±6 deg X
            this.targetRotateY = normX * 16;
            this.targetRotateX = -normY * 10;
        });

        const animateParallax = () => {
            // Smooth linear interpolation (Lerp)
            this.currentRotateX += (this.targetRotateX - this.currentRotateX) * 0.08;
            this.currentRotateY += (this.targetRotateY - this.currentRotateY) * 0.08;

            const bookObj = document.getElementById('book3dObject');
            if (bookObj && !this.isOpening) {
                bookObj.style.transform = `rotateX(${this.currentRotateX.toFixed(2)}deg) rotateY(${this.currentRotateY.toFixed(2)}deg)`;
            }
            requestAnimationFrame(animateParallax);
        };
        requestAnimationFrame(animateParallax);
    }

    /* ==========================================================================
       REALISTIC 5-STEP PHYSICAL BOOK OPENING SEQUENCE
       ========================================================================== */
    executeOpeningSequence() {
        if (this.isBookOpened || this.isOpening) return;
        this.isOpening = true;

        const bookObj = document.getElementById('book3dObject');
        const coverFront = document.getElementById('bookCoverFront3D');

        // STEP 1: Button Pressed & Lift State
        if (bookObj) bookObj.classList.add('is-lifted');

        // STEP 2: Lift & Tilt Adjustment (200ms)
        setTimeout(() => {
            if (bookObj) {
                bookObj.style.transform = `translateY(-15px) translateZ(30px) rotateX(4deg) rotateY(-2deg)`;
            }

            // STEP 3: Cover Starts Pivoting Open From Spine Axis (400ms)
            if (coverFront) coverFront.classList.add('is-open');

            // STEP 4: Emergence & Sparkle Burst (700ms)
            setTimeout(() => {
                if (window.effectsController) {
                    window.effectsController.triggerConfettiBurst();
                }
            }, 700);

            // STEP 5: Settling into Open Spread Position (1600ms)
            setTimeout(() => {
                this.isBookOpened = true;
                this.isOpening = false;
                this.goToChapter(1, false);

                if (bookObj) {
                    bookObj.classList.remove('is-lifted');
                    bookObj.style.transform = `rotateX(6deg) rotateY(0deg)`;
                }

                if (coverFront) {
                    coverFront.style.display = 'none'; // Completely hide front cover from DOM display
                }

                this.showToast("📖 The Magical Birthday Book is now open!");
            }, 1600);

        }, 200);
    }

    /* ==========================================================================
       REAL HAND-LIFTED 3D PAPER PAGE FLIP ENGINE (DYNAMIC CONTENT CLONING)
       ========================================================================== */
    goToChapter(targetChapter, animate = true) {
        if (targetChapter < 1 || targetChapter > this.totalChapters || this.isFlipping) return;

        const isForward = targetChapter > this.currentChapter;
        const currentChapterNum = this.currentChapter;
        this.currentChapter = targetChapter;

        const sheet = document.getElementById('flippingSheet3D');
        const sheetFront = document.getElementById('sheetFront');
        const sheetBack = document.getElementById('sheetBack');

        const currentChapterEl = document.getElementById(`chapter-${currentChapterNum}`);
        const targetChapterEl = document.getElementById(`chapter-${targetChapter}`);

        if (animate && sheet && sheetFront && sheetBack && currentChapterEl && targetChapterEl) {
            this.isFlipping = true;

            // Assign paper face content matching physical 3D rotation geometry!
            if (isForward) {
                // Forward Flip (Right stack -> Left stack):
                // sheetFront faces user as page lifts off right stack
                sheetFront.innerHTML = `<div class="sheet-content-wrapper">${currentChapterEl.innerHTML}</div>`;
                sheetBack.innerHTML = `<div class="sheet-content-wrapper">${targetChapterEl.innerHTML}</div>`;
            } else {
                // Backward Flip (Left stack -> Right stack):
                // sheetBack faces user as page lifts off left stack
                sheetBack.innerHTML = `<div class="sheet-content-wrapper">${currentChapterEl.innerHTML}</div>`;
                sheetFront.innerHTML = `<div class="sheet-content-wrapper">${targetChapterEl.innerHTML}</div>`;
            }

            sheet.classList.remove('active-flip-forward', 'active-flip-backward');
            void sheet.offsetWidth; // Trigger reflow to restart CSS keyframe cleanly

            const animationClass = isForward ? 'active-flip-forward' : 'active-flip-backward';
            sheet.classList.add(animationClass);

            // Switch underlying chapter stage at 400ms (mid-flip) when sheet stands vertical at 90deg!
            setTimeout(() => {
                this.activateChapterSection(targetChapter);
            }, 400);

            setTimeout(() => {
                sheet.classList.remove('active-flip-forward', 'active-flip-backward');
                sheetFront.innerHTML = '';
                sheetBack.innerHTML = '';
                this.isFlipping = false;
            }, 850);
        } else {
            this.activateChapterSection(targetChapter);
        }

        this.updateNavigationUI();
    }

    activateChapterSection(chapterNum) {
        document.querySelectorAll('.page-chapter').forEach(page => {
            page.classList.remove('active');
        });

        const activePage = document.getElementById(`chapter-${chapterNum}`);
        if (activePage) {
            activePage.classList.add('active');
        }

        // Center Fold Emergence Logic for Tulip (Chapter 4) and Cake (Chapter 6)
        if (chapterNum === 4) {
            const tulipContainer = document.getElementById('tulipCanvasContainer');
            if (tulipContainer) {
                tulipContainer.classList.add('emerge-from-fold');
                setTimeout(() => tulipContainer.classList.add('emerged'), 100);
            }
        } else if (chapterNum === 6) {
            const cakeArea = document.getElementById('cakeInteractiveArea');
            if (cakeArea) {
                cakeArea.classList.add('emerge-from-fold');
                setTimeout(() => cakeArea.classList.add('emerged'), 100);
            }
        }

        // Re-trigger Route map runner if Chapter 5 (Gift Journey)
        if (chapterNum === 5 && window.effectsController) {
            setTimeout(() => {
                if (this.activeTrackingData) {
                    this.updatePackageRunner(this.activeTrackingData.status);
                }
            }, 150);
        }
    }

    nextChapter() {
        if (!this.isBookOpened) {
            this.executeOpeningSequence();
            return;
        }
        this.goToChapter(this.currentChapter + 1, true);
    }

    prevChapter() {
        if (!this.isBookOpened) return;
        this.goToChapter(this.currentChapter - 1, true);
    }

    updateNavigationUI() {
        const indicator = document.getElementById('chapterIndicator');
        const pageCounter = document.getElementById('pageCounter');
        const prevArrow = document.getElementById('prevSideArrow');
        const nextArrow = document.getElementById('nextSideArrow');

        if (!this.isBookOpened) {
            if (indicator) indicator.textContent = '📖 Closed Book';
            if (pageCounter) pageCounter.textContent = 'Closed Book';
            if (prevArrow) prevArrow.classList.add('disabled');
            if (nextArrow) nextArrow.classList.remove('disabled');
            return;
        }

        const title = this.chapterTitles[this.currentChapter] || `Chapter ${this.currentChapter}`;
        if (indicator) indicator.textContent = title;
        if (pageCounter) pageCounter.textContent = `Page ${this.currentChapter} of ${this.totalChapters}`;

        if (prevArrow) {
            if (this.currentChapter <= 1) {
                prevArrow.classList.add('disabled');
            } else {
                prevArrow.classList.remove('disabled');
            }
        }

        if (nextArrow) {
            if (this.currentChapter >= this.totalChapters) {
                nextArrow.classList.add('disabled');
            } else {
                nextArrow.classList.remove('disabled');
            }
        }
    }

    toggleSecretMode() {
        this.setSecretMode(!this.isSecretMode);
    }

    setSecretMode(state) {
        this.isSecretMode = state;
        const secretToggleBtn = document.getElementById('secretToggleBtn');
        const secretOverlay = document.getElementById('secretModeOverlay');
        const trackingWrapper = document.getElementById('trackingContentWrapper');

        if (secretToggleBtn) {
            if (this.isSecretMode) {
                secretToggleBtn.classList.add('active-secret');
                secretToggleBtn.querySelector('.seal-text').textContent = 'Secret ON 🔒';
            } else {
                secretToggleBtn.classList.remove('active-secret');
                secretToggleBtn.querySelector('.seal-text').textContent = 'Secret Mode';
            }
        }

        if (this.isSecretMode) {
            if (secretOverlay) secretOverlay.classList.remove('hidden');
            if (trackingWrapper) trackingWrapper.style.filter = 'blur(10px) opacity(0.2)';
        } else {
            if (secretOverlay) secretOverlay.classList.add('hidden');
            if (trackingWrapper) trackingWrapper.style.filter = 'none';
        }
    }

    async loadTrackingData(overrideParams = {}) {
        const fallbackErrorCard = document.getElementById('fallbackErrorCard');

        try {
            const data = await this.trackingService.getTrackingInfo(overrideParams);
            this.activeTrackingData = data;
            
            if (fallbackErrorCard) fallbackErrorCard.classList.add('hidden');
            
            this.renderTrackingUI(data);
        } catch (err) {
            if (fallbackErrorCard) fallbackErrorCard.classList.remove('hidden');
        }
    }

    renderTrackingUI(data) {
        const infoOrder = document.getElementById('infoOrder');
        const infoCourier = document.getElementById('infoCourier');
        const infoTrackingNum = document.getElementById('infoTrackingNum');
        const infoCurrentStatus = document.getElementById('infoCurrentStatus');
        const infoLastUpdate = document.getElementById('infoLastUpdate');
        const infoCurrentLocation = document.getElementById('infoCurrentLocation');

        if (infoOrder) infoOrder.textContent = this.isSecretMode ? 'Secret Surprise Box 🎁' : data.order;
        if (infoCourier) infoCourier.textContent = data.courier;
        if (infoTrackingNum) infoTrackingNum.textContent = data.trackingNumber;
        if (infoCurrentStatus) infoCurrentStatus.textContent = data.status.replace(/_/g, ' ');
        if (infoLastUpdate) infoLastUpdate.textContent = data.lastUpdate;
        if (infoCurrentLocation) infoCurrentLocation.textContent = data.currentLocation;

        this.renderTimeline(data.timeline, data.status);
        this.updatePackageRunner(data.status);
        this.updateCountdownTimer(data.estimatedDelivery, data.status);

        const celebrationBox = document.getElementById('deliveredCelebrationBox');
        if (data.status === 'DELIVERED') {
            if (celebrationBox) celebrationBox.classList.remove('hidden');
            if (window.effectsController) {
                window.effectsController.triggerCelebrationEffects();
            }
        } else {
            if (celebrationBox) celebrationBox.classList.add('hidden');
        }
    }

    renderTimeline(timeline, currentStatus) {
        const timelineList = document.getElementById('timelineList');
        if (!timelineList) return;

        timelineList.innerHTML = '';

        timeline.forEach(item => {
            const isCurrent = item.id === currentStatus;
            let itemClass = 'timeline-item';

            if (item.completed) itemClass += ' completed';
            if (isCurrent) itemClass += ' active';
            if (!item.completed && !isCurrent) itemClass += ' muted';

            const el = document.createElement('div');
            el.className = itemClass;
            el.innerHTML = `
                <div class="tl-header">
                    <span class="tl-title">${item.icon} ${item.title}</span>
                    <span class="tl-time">${item.timestamp}</span>
                </div>
                <p class="tl-sub">${item.subtitle}</p>
                <div class="tl-loc">📍 ${item.location}</div>
            `;
            timelineList.appendChild(el);
        });
    }

    updatePackageRunner(status) {
        const runner = document.getElementById('package3dRunner');
        const runnerIcon = document.getElementById('runnerIcon');
        if (!runner || !runnerIcon) return;

        const nodePositions = {
            'ORDER_PLACED': { left: '10%', top: '50%', icon: '📦' },
            'SELLER_PREPARING': { left: '30%', top: '35%', icon: '🏪' },
            'PACKAGE_PICKED_UP': { left: '50%', top: '65%', icon: '🚚' },
            'SORTING_CENTER': { left: '70%', top: '40%', icon: '📍' },
            'OUT_FOR_DELIVERY': { left: '85%', top: '70%', icon: '🛵' },
            'DELIVERED': { left: '95%', top: '50%', icon: '🎁' }
        };

        const pos = nodePositions[status] || nodePositions['ORDER_PLACED'];
        runner.style.left = pos.left;
        runner.style.top = pos.top;
        runnerIcon.textContent = pos.icon;

        document.querySelectorAll('.map-node').forEach(node => {
            const nodeKey = node.dataset.node;
            node.classList.remove('active', 'completed');
            
            const keys = Object.keys(nodePositions);
            const currIdx = keys.indexOf(status);
            const nodeIdx = keys.indexOf(nodeKey);

            if (nodeIdx < currIdx) {
                node.classList.add('completed');
            } else if (nodeIdx === currIdx) {
                node.classList.add('active');
            }
        });

        if (window.effectsController) {
            window.effectsController.drawRoute(status);
        }
    }

    updateCountdownTimer(targetIsoDate, status) {
        const countdownTimer = document.getElementById('countdownTimer');
        const countdownLabelText = document.getElementById('countdownLabelText');
        const deliveredMsg = document.getElementById('deliveredMsg');

        if (status === 'DELIVERED') {
            if (countdownTimer) countdownTimer.classList.add('hidden');
            if (countdownLabelText) countdownLabelText.textContent = "Your surprise has arrived!";
            if (deliveredMsg) deliveredMsg.classList.remove('hidden');
            if (this.countdownInterval) clearInterval(this.countdownInterval);
            return;
        }

        if (countdownTimer) countdownTimer.classList.remove('hidden');
        if (deliveredMsg) deliveredMsg.classList.add('hidden');
        if (countdownLabelText) countdownLabelText.textContent = "Your surprise should arrive around...";

        const targetDate = new Date(targetIsoDate).getTime();

        if (this.countdownInterval) clearInterval(this.countdownInterval);

        const updateTick = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                document.getElementById('cdDays').textContent = '00';
                document.getElementById('cdHours').textContent = '00';
                document.getElementById('cdMins').textContent = '00';
                document.getElementById('cdSecs').textContent = '00';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('cdDays').textContent = String(days).padStart(2, '0');
            document.getElementById('cdHours').textContent = String(hours).padStart(2, '0');
            document.getElementById('cdMins').textContent = String(minutes).padStart(2, '0');
            document.getElementById('cdSecs').textContent = String(seconds).padStart(2, '0');
        };

        updateTick();
        this.countdownInterval = setInterval(updateTick, 1000);
    }

    copyTrackingNumber() {
        const trackingNumEl = document.getElementById('infoTrackingNum');
        if (!trackingNumEl) return;

        const numText = trackingNumEl.textContent.trim();
        navigator.clipboard.writeText(numText).then(() => {
            this.showToast(`Copied tracking number: ${numText} 📋`);
        }).catch(() => {
            this.showToast("Tracking number selected");
        });
    }

    blowOutCandle() {
        const flame = document.getElementById('candleFlame');
        const wishToast = document.getElementById('wishToast');
        if (flame) flame.classList.add('blown-out');
        if (wishToast) wishToast.classList.remove('hidden');

        if (window.effectsController) {
            window.effectsController.triggerSparklesAroundElement('.cake-visual');
        }

        this.showToast("🎂 Make a wish! Your candle has been blown out ✨");
    }

    showToast(message) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appController = new PhysicalBookController();
});
