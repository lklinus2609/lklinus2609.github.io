/**
 * Main JavaScript for Portfolio
 * Scroll reveals, progress bar, interactions
 */

// Prevent browser from restoring scroll position
if ('scrollRestoration' in history) {
	history.scrollRestoration = 'manual';
}

window.addEventListener('beforeunload', function () {
	window.scrollTo(0, 0);
});

window.addEventListener('load', function () {
	setTimeout(function () {
		window.scrollTo(0, 0);
	}, 0);
});

document.addEventListener('DOMContentLoaded', function () {

	// ===== Email copy with toast =====
	var copyEmailLinks = document.querySelectorAll('.copy-email');
	copyEmailLinks.forEach(function (link) {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			var email = this.getAttribute('data-email');
			navigator.clipboard.writeText(email).then(function () {
				showToast('Email copied!');
			});
		});
	});

	// ===== Robot hand cursor on click =====
	document.addEventListener('mousedown', function () {
		document.body.classList.add('clicking');
	});
	document.addEventListener('mouseup', function () {
		document.body.classList.remove('clicking');
	});

	// ===== Scroll Progress Bar =====
	var progressBar = document.getElementById('scroll-progress');
	if (progressBar) {
		window.addEventListener('scroll', function () {
			var scrollTop = window.scrollY;
			var docHeight = document.documentElement.scrollHeight - window.innerHeight;
			var scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
			progressBar.style.width = scrollPercent + '%';
		}, { passive: true });
	}

	// ===== Nav scroll state =====
	var nav = document.getElementById('nav');
	if (nav) {
		window.addEventListener('scroll', function () {
			if (window.scrollY > 80) {
				nav.classList.add('scrolled');
			} else {
				nav.classList.remove('scrolled');
			}
		}, { passive: true });
	}

	// ===== Scroll Reveal (IntersectionObserver) =====
	var revealElements = document.querySelectorAll('[data-reveal]');
	if (revealElements.length > 0 && 'IntersectionObserver' in window) {
		var revealObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					// Check if this element is inside a reveal-group for stagger
					var parent = entry.target.parentElement;
					if (parent && parent.hasAttribute('data-reveal-group')) {
						var siblings = parent.querySelectorAll('[data-reveal]');
						var index = Array.prototype.indexOf.call(siblings, entry.target);
						entry.target.style.transitionDelay = (index * 0.1) + 's';
					}
					entry.target.classList.add('revealed');
					revealObserver.unobserve(entry.target);
				}
			});
		}, {
			threshold: 0.1,
			rootMargin: '0px 0px -40px 0px'
		});

		revealElements.forEach(function (el) {
			revealObserver.observe(el);
		});
	} else {
		// Fallback: show everything
		revealElements.forEach(function (el) {
			el.classList.add('revealed');
		});
	}
});

// ===== Initialize 3D Model Viewer =====
window.addEventListener('load', function () {
	if (typeof ModelViewer !== 'undefined') {
		new ModelViewer('draco-model-viewer', 'assets/lowerbody_assembly/Assembly 1.obj', {
			autoRotate: true,
			autoRotateSpeed: 0.3,
			backgroundColor: 0x161514,
			enableZoom: true,
			enablePan: false
		});
	}
});

// ===== Toast notification =====
function showToast(message) {
	var toast = document.createElement('div');
	toast.textContent = message;
	toast.className = 'toast-notification';
	document.body.appendChild(toast);

	setTimeout(function () {
		toast.classList.add('hiding');
		setTimeout(function () {
			if (toast.parentNode) {
				document.body.removeChild(toast);
			}
		}, 300);
	}, 2000);
}
